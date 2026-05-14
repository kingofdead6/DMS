import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema(
  {
    // Client Info
    clientFullName: { type: String, required: true, trim: true },
    clientPhone: { type: String, required: true, trim: true },
    clientDescription: { type: String, trim: true },

    // Case Info
    caseName: { type: String, required: true, trim: true },
    caseType: { type: String, trim: true }, // e.g. civil, pénal, commercial
    status: {
      type: String,
      enum: ['en_cours', 'suspendu', 'clôturé', 'gagné', 'perdu'],
      default: 'en_cours',
    },

    // Dates
    startDate: { type: Date },
    endDate: { type: Date },      // optional estimated or actual end
    nextHearing: { type: Date },  // next court date

    // Documents uploaded to Cloudinary
    documents: [
      {
        url: { type: String, required: true },
        originalName: { type: String },
        fileType: { type: String }, // pdf, docx, jpg, etc.
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('Case', caseSchema);