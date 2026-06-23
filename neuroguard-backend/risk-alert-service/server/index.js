// cors is handled by the API gateway; do NOT add it here to avoid duplicate Access-Control-Allow-Origin headers
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import mongoose from 'mongoose';
import amqp from 'amqplib';
import { config } from './config.js';
import { createEurekaClient } from './eureka.js';
import { assessMedicalFeatures, buildPredictiveAlert, estimatePredictiveRisk } from './services/riskEngine.js';
import { AlertStore } from './store/alertStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wsServer = new WebSocketServer({ noServer: true });
const store = new AlertStore(path.resolve(__dirname, '..', config.storageFile));

function sendJson(res, statusCode, payload) {
  return res.status(statusCode).json(payload);
}

function extractUserIdFromToken(request) {
  const auth = request.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token || token.split('.').length < 2) {
    return null;
  }

  try {
    const payloadPart = token.split('.')[1];
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const payload = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
    return payload.userId ?? null;
  } catch {
    return null;
  }
}

function pickRequesterId(request, fallbackKey = 'userId') {
  const headerValue = request.get(`x-${fallbackKey}`) || request.get('x-user-id');
  const queryValue = request.query?.[fallbackKey] || request.query?.patientId || request.params?.patientId;
  const tokenUserId = extractUserIdFromToken(request);
  return queryValue ?? headerValue ?? tokenUserId ?? null;
}

function broadcast(eventType, payload) {
  const message = JSON.stringify({ eventType, ...payload });
  for (const client of wsServer.clients) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
}

function normalizeAlert(alert) {
  return {
    id: alert.id,
    patientId: alert.patientId,
    patientName: alert.patientName,
    message: alert.message,
    severity: alert.severity,
    resolved: alert.resolved,
    source: alert.source,
    meta: alert.meta,
    createdAt: alert.createdAt,
    updatedAt: alert.updatedAt
  };
}

async function fetchMedicalFeatures(patientId, authorizationHeader) {
  const response = await fetch(`${config.medicalHistoryServiceUrl}/api/provider/medical-history/features/${patientId}`, {
    headers: authorizationHeader ? { Authorization: authorizationHeader } : {}
  });

  if (!response.ok) {
    throw new Error(`Unable to load patient features (${response.status})`);
  }

  return response.json();
}

async function createAlertsFromFeatures(features, context = {}) {
  const generated = assessMedicalFeatures(features, context);
  const created = await store.createMany(generated.map((alert) => ({ ...alert, source: 'rules-engine' })));
  created.forEach((alert) => broadcast('alert.created', normalizeAlert(alert)));
  return created.map(normalizeAlert);
}

async function createPredictiveAlertFromPayload(payload, context = {}) {
  const probability = payload.riskProbability ?? payload.probability ?? payload.predictedProbability ?? 0;
  const riskAlert = buildPredictiveAlert(
    payload.patientFeatures || payload.features || payload,
    probability,
    config.predictiveThreshold,
    context
  );

  if (!riskAlert) {
    return null;
  }

  const created = await store.create({
    ...riskAlert,
    source: 'predictive-engine',
    meta: {
      probability: probability || estimatePredictiveRisk(payload.patientFeatures || payload.features || payload).probability,
      threshold: config.predictiveThreshold
    }
  });

  broadcast('alert.created', normalizeAlert(created));
  return normalizeAlert(created);
}

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_, res) => sendJson(res, 200, { status: 'UP', service: config.serviceName }));
app.get('/actuator/health', (_, res) => sendJson(res, 200, { status: 'UP', service: config.serviceName }));

app.get('/alerts', async (req, res) => {
  const patientId = req.query.patientId || null;
  const severity = req.query.severity || null;
  const unresolvedOnly = String(req.query.unresolvedOnly || 'false').toLowerCase() === 'true';
  const alerts = await store.list({ patientId, severity, unresolvedOnly });
  return sendJson(res, 200, alerts.map(normalizeAlert));
});

app.get('/alerts/patient/:patientId', async (req, res) => {
  const alerts = await store.list({ patientId: req.params.patientId });
  return sendJson(res, 200, alerts.map(normalizeAlert));
});

app.post('/alerts/batch', async (req, res) => {
  const patientIds = Array.isArray(req.body) ? req.body : req.body?.patientIds || [];
  const alerts = await store.list({});
  const filtered = alerts.filter((alert) => patientIds.map(String).includes(String(alert.patientId))).map(normalizeAlert);
  return sendJson(res, 200, filtered);
});

app.get('/alerts/patient/:patientId/unresolved', async (req, res) => {
  const alerts = await store.list({ patientId: req.params.patientId, unresolvedOnly: true });
  return sendJson(res, 200, alerts.map(normalizeAlert));
});

app.get('/alerts/patient/:patientId/critical', async (req, res) => {
  const alerts = await store.list({ patientId: req.params.patientId, severity: 'CRITICAL' });
  const filtered = alerts.filter((alert) => !alert.resolved).map(normalizeAlert);
  return sendJson(res, 200, filtered);
});

app.get('/api/patient/alerts', async (req, res) => {
  const patientId = pickRequesterId(req, 'patientId');
  if (!patientId) {
    return sendJson(res, 400, { message: 'patientId is required' });
  }

  const alerts = await store.list({ patientId });
  return sendJson(res, 200, alerts.map(normalizeAlert));
});

app.patch('/api/patient/alerts/:alertId/resolve', async (req, res) => {
  const updated = await store.resolve(req.params.alertId);
  if (!updated) {
    return sendJson(res, 404, { message: 'Alert not found' });
  }

  broadcast('alert.resolved', normalizeAlert(updated));
  return sendJson(res, 200, normalizeAlert(updated));
});

app.get('/api/caregiver/alerts', async (req, res) => {
  const patientId = pickRequesterId(req, 'patientId');
  if (!patientId) {
    return sendJson(res, 400, { message: 'patientId is required' });
  }

  const alerts = await store.list({ patientId });
  return sendJson(res, 200, alerts.map(normalizeAlert));
});

app.patch('/api/caregiver/alerts/:alertId/resolve', async (req, res) => {
  const updated = await store.resolve(req.params.alertId);
  if (!updated) {
    return sendJson(res, 404, { message: 'Alert not found' });
  }

  broadcast('alert.resolved', normalizeAlert(updated));
  return sendJson(res, 200, normalizeAlert(updated));
});

app.get('/api/provider/alerts', async (req, res) => {
  const alerts = await store.list({ unresolvedOnly: String(req.query.unresolvedOnly || 'false').toLowerCase() === 'true' });
  return sendJson(res, 200, alerts.map(normalizeAlert));
});

app.post('/api/provider/alerts', async (req, res) => {
  const created = await store.create({
    ...req.body,
    source: req.body?.source || 'manual'
  });

  broadcast('alert.created', normalizeAlert(created));
  return sendJson(res, 201, normalizeAlert(created));
});

app.post('/api/provider/alerts/generate', async (req, res) => {
  const patientId = req.body?.patientId ?? req.query?.patientId;

  if (!patientId && !req.body?.patientFeatures) {
    return sendJson(res, 400, { message: 'patientId or patientFeatures is required' });
  }

  let features = req.body?.patientFeatures || req.body?.features || {};

  if (patientId && Object.keys(features).length === 0) {
    try {
      features = await fetchMedicalFeatures(patientId, req.get('authorization'));
    } catch (error) {
      return sendJson(res, 502, {
        message: 'Unable to fetch patient features from medical-history-service',
        details: error.message
      });
    }
  }

  const created = await createAlertsFromFeatures(features, {
    patientId,
    patientName: req.body?.patientName || features.patientName
  });

  return sendJson(res, 201, {
    generatedCount: created.length,
    alerts: created
  });
});

app.post('/api/provider/alerts/generate-predictive', async (req, res) => {
  const patientId = req.body?.patientId ?? req.query?.patientId;

  if (!patientId && !req.body?.patientFeatures) {
    return sendJson(res, 400, { message: 'patientId or patientFeatures is required' });
  }

  let features = req.body?.patientFeatures || req.body?.features || {};

  if (patientId && Object.keys(features).length === 0) {
    try {
      features = await fetchMedicalFeatures(patientId, req.get('authorization'));
    } catch (error) {
      return sendJson(res, 502, {
        message: 'Unable to fetch patient features from medical-history-service',
        details: error.message
      });
    }
  }

  const created = await createPredictiveAlertFromPayload(req.body || {}, {
    patientId,
    patientName: req.body?.patientName || features.patientName
  });

  return sendJson(res, 201, {
    created: Boolean(created),
    alert: created
  });
});

app.post('/api/notifications/mark-read', async (req, res) => {
  const alertIds = Array.isArray(req.body?.alertIds) ? req.body.alertIds : [];
  const updated = await store.markRead(alertIds);

  updated.forEach((alert) => broadcast('alert.resolved', normalizeAlert(alert)));
  return sendJson(res, 200, {
    updatedCount: updated.length,
    alerts: updated.map(normalizeAlert)
  });
});

app.get('/api/provider/alerts/patient/:patientId', async (req, res) => {
  const alerts = await store.list({ patientId: req.params.patientId });
  return sendJson(res, 200, alerts.map(normalizeAlert));
});

app.get('/api/provider/alerts/patient/:patientId/unresolved', async (req, res) => {
  const alerts = await store.list({ patientId: req.params.patientId, unresolvedOnly: true });
  return sendJson(res, 200, alerts.map(normalizeAlert));
});

app.get('/api/provider/alerts/patient/:patientId/critical', async (req, res) => {
  const alerts = await store.list({ patientId: req.params.patientId, severity: 'CRITICAL' });
  const filtered = alerts.filter((alert) => !alert.resolved).map(normalizeAlert);
  return sendJson(res, 200, filtered);
});

app.patch('/api/provider/alerts/:alertId/resolve', async (req, res) => {
  const updated = await store.resolve(req.params.alertId);
  if (!updated) {
    return sendJson(res, 404, { message: 'Alert not found' });
  }

  broadcast('alert.resolved', normalizeAlert(updated));
  return sendJson(res, 200, normalizeAlert(updated));
});

app.put('/api/provider/alerts/:alertId', async (req, res) => {
  const updated = await store.update(req.params.alertId, req.body || {});
  if (!updated) {
    return sendJson(res, 404, { message: 'Alert not found' });
  }

  broadcast('alert.updated', normalizeAlert(updated));
  return sendJson(res, 200, normalizeAlert(updated));
});

app.delete('/api/provider/alerts/:alertId', async (req, res) => {
  const deleted = await store.remove(req.params.alertId);
  if (!deleted) {
    return sendJson(res, 404, { message: 'Alert not found' });
  }

  broadcast('alert.deleted', normalizeAlert(deleted));
  return res.sendStatus(204);
});

wsServer.on('connection', (socket) => {
  socket.send(JSON.stringify({ eventType: 'connected', service: config.serviceName }));
});

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (!url.pathname.startsWith('/ws/alerts')) {
    socket.destroy();
    return;
  }

  wsServer.handleUpgrade(request, socket, head, (ws) => {
    wsServer.emit('connection', ws, request);
  });
});

async function startRabbitMQConsumer(maxAttempts = 10) {
  const rabbitMqUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
  const exchange = 'medical-history-exchange';
  const queue = 'risk-alert-queue';

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      console.log(`Connecting to RabbitMQ at ${rabbitMqUrl} (attempt ${attempt}/${maxAttempts})...`);
      const connection = await amqp.connect(rabbitMqUrl);
      const channel = await connection.createChannel();

      await channel.assertExchange(exchange, 'topic', { durable: true });
      await channel.assertQueue(queue, { durable: true });
      await channel.bindQueue(queue, exchange, 'medical.history.created');

      console.log(`Waiting for messages in ${queue}.`);
      channel.consume(queue, async (msg) => {
        if (msg !== null) {
          try {
            const payload = JSON.parse(msg.content.toString());
            console.log('Received RabbitMQ message:', payload);
            const { patientId, token } = payload;
            if (patientId) {
              try {
                const features = await fetchMedicalFeatures(patientId, token || null);
                await createAlertsFromFeatures(features, { patientId, patientName: features.patientName });
                console.log(`Successfully processed async risk alerts for patient ${patientId}`);
              } catch (err) {
                console.error(`Failed to process async risk alerts for patient ${patientId}:`, err.message);
              }
            }
            channel.ack(msg);
          } catch (e) {
            console.error('Error processing message', e);
            channel.nack(msg);
          }
        }
      });
      return;
    } catch (error) {
      console.error(`Failed to connect to RabbitMQ (attempt ${attempt}/${maxAttempts}):`, error.message || error);
      if (attempt === maxAttempts) {
        console.warn('RabbitMQ consumer disabled after max retries; REST and WebSocket alerts still work.');
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 5000 * attempt));
    }
  }
}

async function start() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/risk-alert-db';
  try {
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exitCode = 1;
    return;
  }

  await store.load();
  void startRabbitMQConsumer();

  server.listen(config.port, config.host, () => {
    console.log(`${config.serviceName} listening on http://${config.host}:${config.port}`);

    if (config.eurekaEnabled) {
      const eurekaClient = createEurekaClient(config);
      eurekaClient.start((error) => {
        if (error) {
          console.warn('Eureka registration failed:', error.message);
          return;
        }

        console.log('Registered risk-alert-service with Eureka');
      });
    }
  });
}

start().catch((error) => {
  console.error('Unable to start risk-alert-service', error);
  process.exitCode = 1;
});