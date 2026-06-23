import { Alert } from '../models/Alert.js';
import mongoose from 'mongoose';

export class AlertStore {
  constructor(filePath) {
    // filePath is no longer used, we use MongoDB connection
  }

  async load() {
    // Mongoose connection should be established in index.js
    console.log('AlertStore using MongoDB via Mongoose');
  }

  async list(filters = {}) {
    const { patientId, severity, unresolvedOnly = false } = filters;
    const query = {};
    
    if (patientId != null) {
      query.patientId = String(patientId);
    }
    if (severity) {
      query.severity = String(severity).toUpperCase();
    }
    if (unresolvedOnly) {
      query.resolved = false;
    }
    
    const docs = await Alert.find(query).sort({ createdAt: -1 });
    return docs.map(doc => doc.toObject());
  }

  async getById(alertId) {
    const doc = await Alert.findOne({ id: String(alertId) });
    return doc ? doc.toObject() : null;
  }

  async create(alertInput) {
    const nextId = await this._getNextId();
    const now = new Date().toISOString();
    
    const alertData = {
      id: String(nextId),
      patientId: alertInput.patientId ?? null,
      patientName: alertInput.patientName ?? `Patient ${alertInput.patientId ?? 'unknown'}`,
      message: alertInput.message,
      severity: alertInput.severity || 'INFO',
      resolved: Boolean(alertInput.resolved),
      createdAt: alertInput.createdAt || now,
      updatedAt: now,
      source: alertInput.source || 'manual',
      meta: alertInput.meta || null
    };

    const doc = await Alert.create(alertData);
    return doc.toObject();
  }

  async createMany(alertInputs) {
    const created = [];
    for (const alertInput of alertInputs) {
      created.push(await this.create(alertInput));
    }
    return created;
  }

  async resolve(alertId) {
    const doc = await Alert.findOneAndUpdate(
      { id: String(alertId) },
      { resolved: true, updatedAt: new Date().toISOString() },
      { new: true }
    );
    return doc ? doc.toObject() : null;
  }

  async update(alertId, updates = {}) {
    const allowed = ['message', 'severity', 'patientId', 'patientName', 'resolved'];
    const patch = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        patch[key] = updates[key];
      }
    }
    patch.updatedAt = new Date().toISOString();

    const doc = await Alert.findOneAndUpdate(
      { id: String(alertId) },
      patch,
      { new: true }
    );
    return doc ? doc.toObject() : null;
  }

  async remove(alertId) {
    const doc = await Alert.findOneAndDelete({ id: String(alertId) });
    return doc ? doc.toObject() : null;
  }

  async markRead(alertIds = []) {
    const stringIds = alertIds.map(String);
    await Alert.updateMany(
      { id: { $in: stringIds }, resolved: false },
      { resolved: true, updatedAt: new Date().toISOString() }
    );
    
    const updatedDocs = await Alert.find({ id: { $in: stringIds }, resolved: true });
    return updatedDocs.map(doc => doc.toObject());
  }

  async _getNextId() {
    const lastAlert = await Alert.findOne().sort({ id: -1 });
    return lastAlert ? parseInt(lastAlert.id, 10) + 1 : 1;
  }
}