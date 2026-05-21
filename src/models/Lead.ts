import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILead extends Document {
  customerName: string;
  phone: string;
  city: string;
  serviceId: number;
  serviceName: string;
  description: string;
  assignedProviders: number[];
  createdAt: Date;
}

const LeadSchema = new Schema<ILead>({
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  city: { type: String, required: true },
  serviceId: { type: Number, required: true },
  serviceName: { type: String, required: true },
  description: { type: String, required: true },
  assignedProviders: [{ type: Number }],
  createdAt: { type: Date, default: Date.now },
});

// DB-level unique constraint: same phone cannot submit same service twice
LeadSchema.index({ phone: 1, serviceId: 1 }, { unique: true });

export const Lead: Model<ILead> =
  mongoose.models.Lead ?? mongoose.model<ILead>("Lead", LeadSchema);
