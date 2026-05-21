import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWebhookEvent extends Document {
  eventId: string;
  type: string;
  processedAt: Date;
}

const WebhookEventSchema = new Schema<IWebhookEvent>({
  eventId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  processedAt: { type: Date, default: Date.now },
});

export const WebhookEvent: Model<IWebhookEvent> =
  mongoose.models.WebhookEvent ??
  mongoose.model<IWebhookEvent>("WebhookEvent", WebhookEventSchema);
