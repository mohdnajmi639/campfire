import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IFriendship extends Document {
  _id: Types.ObjectId;
  user1: Types.ObjectId;
  user2: Types.ObjectId;
  status: "pending" | "accepted";
  actionUserId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FriendshipSchema = new Schema<IFriendship>(
  {
    user1: { type: Schema.Types.ObjectId, ref: "User", required: true },
    user2: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted"], default: "pending" },
    actionUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Ensure we can easily query friendships for a user
FriendshipSchema.index({ user1: 1, user2: 1 }, { unique: true });

// Prevent recompilation in dev
const Friendship: Model<IFriendship> =
  mongoose.models.Friendship || mongoose.model<IFriendship>("Friendship", FriendshipSchema);

export default Friendship;
