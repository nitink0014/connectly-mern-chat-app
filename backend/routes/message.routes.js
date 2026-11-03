
import express from "express";
import {
  sendMessage,
  getMessages,
  deleteMessageForMe,
  deleteMessageForEveryone,
  clearConversationForMe,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/send", protectRoute, sendMessage);

router.delete("/:messageId/me", protectRoute, deleteMessageForMe);

router.delete(
  "/:messageId/everyone",
  protectRoute,
  deleteMessageForEveryone
);
router.delete(
  "/conversation/:conversationId/clear",
  protectRoute,
  clearConversationForMe
);

router.get("/:conversationId", protectRoute, getMessages);

export default router;
