export const config = {
  serviceName: process.env.SERVICE_NAME || 'risk-alert-service',
  port: Number.parseInt(process.env.PORT || '8084', 10),
  host: process.env.SERVICE_HOST || '0.0.0.0',
  eurekaInstanceHost: process.env.EUREKA_INSTANCE_HOSTNAME || 'localhost',
  eurekaHost: process.env.EUREKA_HOST || 'localhost',
  eurekaPort: Number.parseInt(process.env.EUREKA_PORT || '8761', 10),
  eurekaEnabled: process.env.EUREKA_ENABLED !== 'false',
  medicalHistoryServiceUrl: process.env.MEDICAL_HISTORY_SERVICE_URL || 'http://localhost:8082',
  storageFile: process.env.ALERT_STORE_FILE || 'data/alerts.json',
  predictiveThreshold: Number.parseFloat(process.env.PREDICTIVE_THRESHOLD || '0.7')
};