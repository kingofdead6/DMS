import mongoose from 'mongoose';

const calendarEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    date: { type: Date, required: true },
    endDate: { type: Date }, // optional end time
    type: {
      type: String,
      enum: ['audience', 'réunion', 'délai', 'autre'],
      default: 'autre',
    },
    // Optional link to a case
    caseRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
    color: { type: String, default: '#000000' },
    reminder48hSent: { type: Boolean, default: false },
    reminder24hSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('CalendarEvent', calendarEventSchema);