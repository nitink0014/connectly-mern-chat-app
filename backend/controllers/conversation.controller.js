import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";

export const createConversation = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Receiver ID is required",
      });
    }

    if (senderId.toString() === receiverId) {
      return res.status(400).json({
        success: false,
        message: "You cannot chat with yourself",
      });
    }

    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId], $size: 2 },
    }).populate("participants", "fullName username profilePic");

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });

      await conversation.populate(
        "participants",
        "fullName username profilePic"
      );
    }

    return res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Create Conversation Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create conversation",
    });
  }
};
export const getMyConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "fullName username profilePic")
      .populate({
        path: "lastMessage",
        populate: {
          path: "senderId",
          select: "fullName username",
        },
      })
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Get Conversations Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
    });
  }
};