
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      trim: true,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    // Message delivery status
    deliveredAt: {
      type: Date,
      default: null,
    },

    // Message read status
    readAt: {
      type: Date,
      default: null,
    },

    // Users who deleted this message for themselves
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Whether the message was deleted for everyone
    deletedForEveryone: {
      type: Boolean,
      default: false,
    },

    // Time when message was deleted for everyone
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
