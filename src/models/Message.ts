import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IMessage extends Document {
  _id: Types.ObjectId;
  content: string;
  fileUrl?: string;
  memberId: Types.ObjectId;
  channelId: Types.ObjectId;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    content: { type: String, required: true },
    fileUrl: { type: String, default: "" },
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    channelId: { type: Schema.Types.ObjectId, ref: "Channel", required: true },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for efficient pagination queries
MessageSchema.index({ channelId: 1, createdAt: -1 });

const Message: Model<IMessage> =
  mongoose.models.Message ||
  mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
