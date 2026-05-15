import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  performedByName: { type: String },
  performedByEmail: { type: String },
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE'],
    required: true,
  },
  resource: {
    type: String,
    enum: ['CASE', 'EVENT', 'USER'],
    required: true,
  },
  resourceId: { type: String },
  resourceName: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

export default mongoose.model('Log', logSchema);