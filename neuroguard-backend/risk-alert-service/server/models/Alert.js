import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  message: { type: String, required: true },
  severity: { type: String, enum: ['INFO', 'LOW', 'MEDIUM', 'WARNING', 'HIGH', 'CRITICAL'], required: true },
  resolved: { type: Boolean, default: false },
  source: { type: String, default: 'manual' },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export const Alert = mongoose.model('Alert', alertSchema);
