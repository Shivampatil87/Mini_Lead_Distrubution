import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAllocationState extends Document {
  serviceId: number;
  lastIndex: number; // index into fair pool array
  version: number;   // optimistic concurrency control
}

const AllocationStateSchema = new Schema<IAllocationState>({
  serviceId: { type: Number, required: true, unique: true },
  lastIndex: { type: Number, default: -1 },
  version: { type: Number, default: 0 },
});

export const AllocationState: Model<IAllocationState> =
  mongoose.models.AllocationState ??
  mongoose.model<IAllocationState>("AllocationState", AllocationStateSchema);
