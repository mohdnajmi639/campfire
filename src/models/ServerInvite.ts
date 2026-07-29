import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IServerInvite extends Document {
  _id: Types.ObjectId;
  server: Types.ObjectId;
  inviter: Types.ObjectId;
  invitee: Types.ObjectId;
  status: "pending" | "accepted" | "declined";
  createdAt: Date;
  updatedAt: Date;
}

const ServerInviteSchema = new Schema<IServerInvite>(
  {
    server: { type: Schema.Types.ObjectId, ref: "Server", required: true },
    inviter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    invitee: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
  },
  { timestamps: true }
);

// Ensure we don't spam invites to the same server for the same person
ServerInviteSchema.index({ server: 1, invitee: 1 }, { unique: true });

const ServerInvite: Model<IServerInvite> =
  mongoose.models.ServerInvite || mongoose.model<IServerInvite>("ServerInvite", ServerInviteSchema);

export default ServerInvite;
