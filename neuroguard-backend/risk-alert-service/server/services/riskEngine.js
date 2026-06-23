function toNumeric(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'y'].includes(value.trim().toLowerCase());
  }

  return Boolean(value);
}

function buildAlertRule({ id, severity, message, source, patientId, patientName }) {
  return {
    id,
    patientId,
    patientName,
    severity,
    message,
    source,
    resolved: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function assessMedicalFeatures(features = {}, context = {}) {
  const patientId = context.patientId ?? features.patientId ?? null;
  const patientName = context.patientName ?? features.patientName ?? `Patient ${patientId ?? 'unknown'}`;
  const alerts = [];
  let counter = 0;

  const severityStage = String(features.progressionStage || '').trim().toUpperCase();
  const age = toNumeric(features.age);
  const comorbidityCount = toNumeric(features.comorbidityCount);
  const allergyCount = toNumeric(features.allergyCount);
  const surgeryCount = toNumeric(features.surgeryCount);
  const caregiverCount = toNumeric(features.caregiverCount);
  const providerCount = toNumeric(features.providerCount);

  if (severityStage === 'SEVERE') {
    alerts.push(buildAlertRule({
      id: ++counter,
      patientId,
      patientName,
      severity: 'CRITICAL',
      source: 'rules-engine',
      message: 'Severe progression stage detected. Immediate clinical review recommended.'
    }));
  }

  if (age >= 85) {
    alerts.push(buildAlertRule({
      id: ++counter,
      patientId,
      patientName,
      severity: 'WARNING',
      source: 'rules-engine',
      message: `Advanced age risk factor detected (${age} years).`
    }));
  }

  if (comorbidityCount >= 4) {
    alerts.push(buildAlertRule({
      id: ++counter,
      patientId,
      patientName,
      severity: 'WARNING',
      source: 'rules-engine',
      message: 'High comorbidity burden detected.'
    }));
  }

  if (allergyCount >= 3) {
    alerts.push(buildAlertRule({
      id: ++counter,
      patientId,
      patientName,
      severity: 'WARNING',
      source: 'rules-engine',
      message: 'Multiple allergies recorded.'
    }));
  }

  if (surgeryCount >= 3) {
    alerts.push(buildAlertRule({
      id: ++counter,
      patientId,
      patientName,
      severity: 'INFO',
      source: 'rules-engine',
      message: 'Multiple surgeries are present in the medical history.'
    }));
  }

  if (toBoolean(features.hasGeneticRisk) || toBoolean(features.hasFamilyHistory)) {
    alerts.push(buildAlertRule({
      id: ++counter,
      patientId,
      patientName,
      severity: 'WARNING',
      source: 'rules-engine',
      message: 'Genetic or family risk factor identified.'
    }));
  }

  if (toNumeric(features.mmse) > 0 && toNumeric(features.mmse) <= 18) {
    alerts.push(buildAlertRule({
      id: ++counter,
      patientId,
      patientName,
      severity: 'CRITICAL',
      source: 'rules-engine',
      message: 'Low MMSE score suggests high cognitive decline risk.'
    }));
  }

  if (toNumeric(features.functionalAssessment) > 0 && toNumeric(features.functionalAssessment) <= 40) {
    alerts.push(buildAlertRule({
      id: ++counter,
      patientId,
      patientName,
      severity: 'WARNING',
      source: 'rules-engine',
      message: 'Functional assessment score is low.'
    }));
  }

  if (toBoolean(features.memoryComplaints) || toBoolean(features.behavioralProblems)) {
    alerts.push(buildAlertRule({
      id: ++counter,
      patientId,
      patientName,
      severity: 'INFO',
      source: 'rules-engine',
      message: 'Memory or behavioral concerns reported in the current profile.'
    }));
  }

  if (caregiverCount === 0 || providerCount === 0) {
    alerts.push(buildAlertRule({
      id: ++counter,
      patientId,
      patientName,
      severity: 'INFO',
      source: 'rules-engine',
      message: 'Patient is missing either caregiver or provider assignment.'
    }));
  }

  if (alerts.length === 0) {
    alerts.push(buildAlertRule({
      id: ++counter,
      patientId,
      patientName,
      severity: 'INFO',
      source: 'rules-engine',
      message: 'No high-risk rule was triggered for this patient profile.'
    }));
  }

  return alerts;
}

export function estimatePredictiveRisk(features = {}) {
  const age = toNumeric(features.age);
  const progressionStage = String(features.progressionStage || '').trim().toUpperCase();
  const comorbidityCount = toNumeric(features.comorbidityCount);
  const allergyCount = toNumeric(features.allergyCount);
  const surgeryCount = toNumeric(features.surgeryCount);
  const mmse = toNumeric(features.mmse, 28);
  const functionalAssessment = toNumeric(features.functionalAssessment, 80);

  let probability = 0.12;

  if (age >= 80) probability += 0.12;
  if (age >= 90) probability += 0.06;
  if (progressionStage === 'MODERATE') probability += 0.18;
  if (progressionStage === 'SEVERE') probability += 0.32;
  probability += Math.min(comorbidityCount, 6) * 0.035;
  probability += Math.min(allergyCount, 5) * 0.02;
  probability += Math.min(surgeryCount, 5) * 0.015;
  if (mmse <= 18) probability += 0.15;
  if (mmse <= 12) probability += 0.08;
  if (functionalAssessment <= 40) probability += 0.1;

  const clipped = Math.max(0, Math.min(0.99, Number(probability.toFixed(2))));

  return {
    probability: clipped,
    riskLevel: clipped >= 0.9 ? 'CRITICAL' : clipped >= 0.75 ? 'HIGH' : clipped >= 0.5 ? 'MODERATE' : clipped >= 0.25 ? 'LOW' : 'MINIMAL'
  };
}

export function buildPredictiveAlert(features = {}, probability = 0, threshold = 0.7, context = {}) {
  const patientId = context.patientId ?? features.patientId ?? null;
  const patientName = context.patientName ?? features.patientName ?? `Patient ${patientId ?? 'unknown'}`;
  const { riskLevel, probability: normalizedProbability } = estimatePredictiveRisk({ ...features, probability });
  const effectiveProbability = probability > 0 ? toNumeric(probability) : normalizedProbability;

  if (effectiveProbability < threshold) {
    return null;
  }

  return buildAlertRule({
    id: 1,
    patientId,
    patientName,
    severity: riskLevel === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
    source: 'predictive-engine',
    message: `Predicted hospitalization risk is ${Math.round(effectiveProbability * 100)}% (${riskLevel}).`
  });
}