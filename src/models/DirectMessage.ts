import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IDirectMessage extends Document {
  _id: Types.ObjectId;
  content: string;
  fileUrl?: string;
  memberId: Types.ObjectId;
  conversationId: Types.ObjectId;
  replyToId?: Types.ObjectId;
  mentions: Types.ObjectId[];
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DirectMessageSchema = new Schema<IDirectMessage>(
  {
    content: { type: String, required: true },
    fileUrl: { type: String, default: "" },
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    replyToId: { type: Schema.Types.ObjectId, ref: "DirectMessage", required: false },
    mentions: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for efficient DM pagination
DirectMessageSchema.index({ conversationId: 1, createdAt: -1 });

const DirectMessage: Model<IDirectMessage> =
  mongoose.models.DirectMessage ||
  mongoose.model<IDirectMessage>("DirectMessage", DirectMessageSchema);

export default DirectMessage;
