import mongoose, { Schema, Document, Model, Types } from "mongoose";

import { ChannelType } from "@/types";

export interface IChannel extends Document {
  _id: Types.ObjectId;
  name: string;
  type: ChannelType;
  userId: Types.ObjectId;
  serverId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ChannelSchema = new Schema<IChannel>(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(ChannelType),
      default: ChannelType.TEXT,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    serverId: { type: Schema.Types.ObjectId, ref: "Server", required: true },
  },
  { timestamps: true }
);

const Channel: Model<IChannel> =
  mongoose.models.Channel ||
  mongoose.model<IChannel>("Channel", ChannelSchema);

export default Channel;
