import assert from 'node:assert/strict';
import test from 'node:test';
import { assessMedicalFeatures, estimatePredictiveRisk } from '../server/services/riskEngine.js';

test('assessMedicalFeatures returns a critical alert for severe progression', () => {
  const alerts = assessMedicalFeatures({
    patientId: 1,
    patientName: 'Test Patient',
    progressionStage: 'SEVERE',
    age: 90,
    comorbidityCount: 5,
    allergyCount: 4,
    surgeryCount: 3,
    hasGeneticRisk: true,
    mmse: 12,
    functionalAssessment: 35
  });

  assert.ok(alerts.some((alert) => alert.severity === 'CRITICAL'));
  assert.ok(alerts.length >= 3);
});

test('estimatePredictiveRisk increases with severe profiles', () => {
  const lowRisk = estimatePredictiveRisk({ age: 55, progressionStage: 'MILD', comorbidityCount: 0, allergyCount: 0, surgeryCount: 0, mmse: 28, functionalAssessment: 85 });
  const highRisk = estimatePredictiveRisk({ age: 90, progressionStage: 'SEVERE', comorbidityCount: 5, allergyCount: 3, surgeryCount: 2, mmse: 10, functionalAssessment: 25 });

  assert.ok(highRisk.probability > lowRisk.probability);
  assert.equal(highRisk.riskLevel, 'CRITICAL');
});