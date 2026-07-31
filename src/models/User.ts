import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  emailVerified?: Date;
  image?: string;
  statusText?: string;
  password?: string;
  isSuperAdmin?: boolean;
  manualPresence?: "online" | "idle" | "dnd" | "invisible";
  isClientIdle?: boolean;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    emailVerified: { type: Date },
    image: { type: String, default: "" },
    statusText: { type: String, default: "" },
    password: { type: String },
    isSuperAdmin: { type: Boolean, default: false },
    manualPresence: { type: String, enum: ["online", "idle", "dnd", "invisible"], default: "online" },
    isClientIdle: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent recompilation in dev
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
