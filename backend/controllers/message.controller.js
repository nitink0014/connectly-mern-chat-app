
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import {
  getIO,
  getReceiverSocketIds,
} from "../sockets/socket.js";

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, text, image } = req.body;
    const senderId = req.user._id;

    if (!conversationId || (!text?.trim() && !image)) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID and message content are required",
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const isParticipant = conversation.participants.some(
      (id) => id.toString() === senderId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant in this conversation",
      });
    }

    const receiverIds = conversation.participants.filter(
      (id) => id.toString() !== senderId.toString()
    );

    const onlineReceiverSockets = receiverIds.flatMap(
      (receiverId) => Array.from(getReceiverSocketIds(receiverId))
    );

    const deliveredAt =
      onlineReceiverSockets.length > 0 ? new Date() : null;

    const newMessage = await Message.create({
      conversationId,
      senderId,
      text: text?.trim() || "",
      image: image || "",
      deliveredAt,
    });

    conversation.lastMessage = newMessage._id;
    await conversation.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("senderId", "fullName username profilePic");

    const io = getIO();

    onlineReceiverSockets.forEach((socketId) => {
      io.to(socketId).emit("newMessage", populatedMessage);
    });

    if (deliveredAt) {
      const senderSockets = getReceiverSocketIds(senderId);

      senderSockets.forEach((socketId) => {
        io.to(socketId).emit("messageDelivered", {
          conversationId,
          messageId: newMessage._id,
          deliveredAt,
        });
      });
    }

    return res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    console.error("Send Message Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

// Get messages
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const isParticipant = conversation.participants.some(
      (id) => id.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const unreadMessages = await Message.find({
      conversationId,
      senderId: { $ne: userId },
      readAt: null,
      deletedForEveryone: { $ne: true },
    });

    if (unreadMessages.length > 0) {
      const readAt = new Date();

      await Message.updateMany(
        { _id: { $in: unreadMessages.map((message) => message._id) } },
        { $set: { deliveredAt: readAt, readAt } }
      );

      const io = getIO();

      unreadMessages.forEach((message) => {
        const senderSockets = getReceiverSocketIds(message.senderId);

        senderSockets.forEach((socketId) => {
          io.to(socketId).emit("messageRead", {
            conversationId,
            messageId: message._id,
            readAt,
          });
        });
      });
    }

    // Do not return messages hidden by this user.
    const messages = await Message.find({
      conversationId,
      deletedFor: { $ne: userId },
    })
      .populate("senderId", "fullName username profilePic")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Get Messages Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
    });
  }
};

// Delete a message only for the logged-in user
export const deleteMessageForMe = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    const conversation = await Conversation.findById(
      message.conversationId
    );

    if (
      !conversation ||
      !conversation.participants.some(
        (id) => id.toString() === userId.toString()
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (message.deletedForEveryone) {
      return res.status(400).json({
        success: false,
        message: "This message has already been deleted for everyone",
      });
    }

    await Message.updateOne(
      { _id: messageId },
      { $addToSet: { deletedFor: userId } }
    );

    // Sync the deletion across this user's other connected sessions.
    const io = getIO();
    const userSockets = getReceiverSocketIds(userId);

    userSockets.forEach((socketId) => {
      io.to(socketId).emit("messageDeletedForMe", {
        messageId,
        conversationId: message.conversationId,
      });
    });

    return res.status(200).json({
      success: true,
      message: "Message deleted for you",
    });
  } catch (error) {
    console.error("Delete Message For Me Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete message",
    });
  }
};

// Delete a message for everyone (sender only)
export const deleteMessageForEveryone = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the sender can delete this message for everyone",
      });
    }

    const conversation = await Conversation.findById(
      message.conversationId
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (message.deletedForEveryone) {
      return res.status(400).json({
        success: false,
        message: "This message has already been deleted",
      });
    }

    const deletedAt = new Date();

    await Message.updateOne(
      { _id: messageId },
      {
        $set: {
          deletedForEveryone: true,
          deletedAt,
          text: "",
          image: "",
        },
      }
    );

    // Notify every connected participant in the conversation.
    const io = getIO();

    const participantSockets = conversation.participants.flatMap(
      (participantId) =>
        Array.from(getReceiverSocketIds(participantId))
    );

    participantSockets.forEach((socketId) => {
      io.to(socketId).emit("messageDeletedForEveryone", {
        messageId,
        conversationId: message.conversationId,
        deletedAt,
      });
    });

    return res.status(200).json({
      success: true,
      message: "Message deleted for everyone",
      deletedAt,
    });
  } catch (error) {
    console.error("Delete Message For Everyone Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete message for everyone",
    });
  }
};
// Clear conversation for the logged-in user only
export const clearConversationForMe = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const isParticipant = conversation.participants.some(
      (id) => id.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Hide every message in this conversation for this user.
    await Message.updateMany(
      { conversationId },
      { $addToSet: { deletedFor: userId } }
    );

    // Synchronize the clearing across this user's connected devices.
    const io = getIO();
    const userSockets = getReceiverSocketIds(userId);

    userSockets.forEach((socketId) => {
      io.to(socketId).emit("conversationClearedForMe", {
        conversationId,
      });
    });

    return res.status(200).json({
      success: true,
      message: "Conversation cleared successfully",
    });
  } catch (error) {
    console.error("Clear Conversation Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to clear conversation",
    });
  }
};