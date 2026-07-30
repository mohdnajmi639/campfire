import mongoose, { Schema, Document, Model, Types } from "mongoose";

import { MemberRole } from "@/types";

export interface IMember extends Document {
  _id: Types.ObjectId;
  role: MemberRole;
  nickname?: string;
  userId: Types.ObjectId;
  serverId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IMember>(
  {
    role: {
      type: String,
      enum: Object.values(MemberRole),
      default: MemberRole.GUEST,
    },
    nickname: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    serverId: { type: Schema.Types.ObjectId, ref: "Server", required: true },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate memberships
MemberSchema.index({ userId: 1, serverId: 1 }, { unique: true });

const Member: Model<IMember> =
  mongoose.models.Member || mongoose.model<IMember>("Member", MemberSchema);

export default Member;
