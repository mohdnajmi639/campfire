import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IConversation extends Document {
  _id: Types.ObjectId;
  memberOneId: Types.ObjectId;
  memberTwoId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    memberOneId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    memberTwoId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index to quickly look up conversations between two members
ConversationSchema.index({ memberOneId: 1, memberTwoId: 1 }, { unique: true });

const Conversation: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);

export default Conversation;
