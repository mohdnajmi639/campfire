import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IServer extends Document {
  _id: Types.ObjectId;
  name: string;
  imageUrl: string;
  inviteCode: string;
  userId: Types.ObjectId;
  members: Types.ObjectId[];
  channels: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ServerSchema = new Schema<IServer>(
  {
    name: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    inviteCode: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "Member" }],
    channels: [{ type: Schema.Types.ObjectId, ref: "Channel" }],
  },
  { timestamps: true }
);

const Server: Model<IServer> =
  mongoose.models.Server || mongoose.model<IServer>("Server", ServerSchema);

export default Server;
