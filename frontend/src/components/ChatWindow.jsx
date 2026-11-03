import { useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Check,
  CheckCheck,
  MoreVertical,
  Trash2,
  X,
} from "lucide-react";

import useChatStore from "../store/chatStore";
import useAuthStore from "../store/authStore";
import socket from "../services/socket";

function ChatWindow() {
  const [text, setText] = useState("");
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  const [menuMessageId, setMenuMessageId] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [clearConfirmation, setClearConfirmation] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const typingTimeoutRef = useRef(null);

  const {
    selectedConversation,
    messages,
    isLoadingMessages,
    isSendingMessage,
    getMessages,
    sendMessage,
    selectConversation,
    deleteMessageForMe,
    deleteMessageForEveryone,
    clearConversationForMe,
  } = useChatStore();

  const { authUser } = useAuthStore();

  const otherUser = selectedConversation?.participants?.find(
    (user) => String(user._id) !== String(authUser?._id)
  );

  const conversationId = selectedConversation?._id;
  const receiverId = otherUser?._id;

  // Fetch messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      getMessages(conversationId);
    }

    setIsOtherTyping(false);
    setText("");
    setMenuMessageId(null);
    setDeleteConfirmation(null);
    setIsHeaderMenuOpen(false);
    setClearConfirmation(false);
  }, [conversationId, getMessages]);

  // Listen for typing events
  useEffect(() => {
    if (!conversationId) return;

    const handleUserTyping = ({
      userId,
      conversationId: incomingConversationId,
    }) => {
      if (
        String(userId) === String(receiverId) &&
        String(incomingConversationId) === String(conversationId)
      ) {
        setIsOtherTyping(true);
      }
    };

    const handleUserStoppedTyping = ({
      userId,
      conversationId: incomingConversationId,
    }) => {
      if (
        String(userId) === String(receiverId) &&
        String(incomingConversationId) === String(conversationId)
      ) {
        setIsOtherTyping(false);
      }
    };

    socket.on("userTyping", handleUserTyping);
    socket.on("userStoppedTyping", handleUserStoppedTyping);

    return () => {
      socket.off("userTyping", handleUserTyping);
      socket.off("userStoppedTyping", handleUserStoppedTyping);
      setIsOtherTyping(false);
    };
  }, [conversationId, receiverId]);

  // Stop typing
  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (receiverId && conversationId) {
      socket.emit("stopTyping", {
        receiverId,
        conversationId,
      });
    }
  };

  // Handle input changes
  const handleTextChange = (e) => {
    const value = e.target.value;
    setText(value);

    if (!receiverId || !conversationId) return;

    if (value.trim()) {
      socket.emit("typing", {
        receiverId,
        conversationId,
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 1000);
    } else {
      stopTyping();
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!text.trim() || !selectedConversation) return;

    const messageText = text.trim();

    stopTyping();

    const success = await sendMessage(
      conversationId,
      messageText
    );

    if (success) {
      setText("");
    }
  };

  // Return to conversation list on mobile
  const handleBack = () => {
    stopTyping();
    selectConversation(null);
  };

  // Open delete confirmation
  const openDeleteConfirmation = (message, type) => {
    setMenuMessageId(null);

    setDeleteConfirmation({
      messageId: message._id,
      type,
    });
  };

  // Confirm individual message deletion
  const handleDeleteMessage = async () => {
    if (!deleteConfirmation || isDeleting) return;

    setIsDeleting(true);

    let success = false;

    if (deleteConfirmation.type === "me") {
      success = await deleteMessageForMe(
        deleteConfirmation.messageId
      );
    } else {
      success = await deleteMessageForEveryone(
        deleteConfirmation.messageId
      );
    }

    if (success) {
      setDeleteConfirmation(null);
    }

    setIsDeleting(false);
  };

  // Clear entire conversation for current user
  const handleClearConversation = async () => {
    if (!conversationId || isClearing) return;

    setIsClearing(true);

    const success = await clearConversationForMe(conversationId);

    if (success) {
      setClearConfirmation(false);
      setIsHeaderMenuOpen(false);
      setMenuMessageId(null);
    }

    setIsClearing(false);
  };

  // Empty chat screen
  if (!selectedConversation) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center text-center bg-[#09090b]">
        <div className="px-5">
          <MessageCircle
            size={50}
            className="mx-auto mb-4 text-violet-400"
          />

          <h2 className="text-xl font-semibold text-white">
            Welcome to Connectly
          </h2>

          <p className="text-gray-400 mt-2">
            Select a conversation to start chatting.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 min-h-0 flex flex-col bg-[#09090b] overflow-hidden">

      {/* Chat Header */}
      <header className="relative shrink-0 min-h-16 sm:h-20 border-b border-white/10 flex items-center px-3 sm:px-6 gap-3">

        <button
          onClick={handleBack}
          className="sm:hidden shrink-0 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
          aria-label="Back to conversations"
        >
          <ArrowLeft size={22} />
        </button>

        {/* Other user's profile picture */}
        <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-white">
          {otherUser?.profilePic ? (
            <img
              src={otherUser.profilePic}
              alt={otherUser.fullName || "Profile"}
              className="w-full h-full object-cover"
            />
          ) : (
            otherUser?.fullName?.charAt(0).toUpperCase()
          )}
        </div>

        {/* User information */}
        <div className="min-w-0 flex-1">
          <h2 className="text-white font-semibold truncate">
            {otherUser?.fullName}
          </h2>

          {isOtherTyping ? (
            <p className="text-violet-400 text-xs animate-pulse">
              Typing...
            </p>
          ) : (
            <p className="text-gray-400 text-xs truncate">
              @{otherUser?.username}
            </p>
          )}
        </div>

        {/* Header Options */}
        <div className="relative shrink-0">
          <button
            onClick={() =>
              setIsHeaderMenuOpen((prev) => !prev)
            }
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Conversation options"
            title="Conversation options"
          >
            <MoreVertical size={21} />
          </button>

          {isHeaderMenuOpen && (
            <div className="absolute right-0 top-12 z-50 w-52 rounded-xl border border-white/10 bg-[#18181f] shadow-2xl p-1">
              <button
                onClick={() => {
                  setIsHeaderMenuOpen(false);
                  setClearConfirmation(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition"
              >
                <Trash2 size={16} />
                Clear conversation
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Messages Container */}
      <div
        className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto p-3 sm:p-6 space-y-4"
        onClick={() => setMenuMessageId(null)}
      >
        {isLoadingMessages ? (
          <p className="text-gray-400 text-center">
            Loading messages...
          </p>
        ) : messages.length === 0 ? (
          <p className="text-gray-500 text-center mt-10">
            No messages yet. Say hello!
          </p>
        ) : (
          messages.map((message) => {
            const senderId =
              typeof message.senderId === "object"
                ? message.senderId?._id
                : message.senderId;

            const isOwnMessage =
              String(senderId) === String(authUser?._id);

            const isDeleted = message.deletedForEveryone;

            return (
              <div
                key={message._id}
                className={`flex min-w-0 ${
                  isOwnMessage ? "justify-end" : "justify-start"
                }`}
              >
                <div className="relative min-w-0 max-w-[85%] sm:max-w-[70%]">

                  {/* Message Bubble */}
                  <div
                    className={`min-w-0 px-3 sm:px-4 py-3 rounded-2xl ${
                      isDeleted
                        ? "bg-[#202027] text-gray-400 border border-white/5"
                        : isOwnMessage
                        ? "bg-violet-600 text-white rounded-br-sm"
                        : "bg-[#27272a] text-white rounded-bl-sm"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isDeleted ? (
                      <p className="text-sm italic flex items-center gap-2">
                        <Trash2 size={14} />
                        This message was deleted
                      </p>
                    ) : (
                      <>
                        {message.text && (
                          <p className="text-sm break-words whitespace-pre-wrap">
                            {message.text}
                          </p>
                        )}

                        {message.image && (
                          <img
                            src={message.image}
                            alt="Message attachment"
                            className="max-w-full rounded-lg mb-2"
                          />
                        )}
                      </>
                    )}

                    <div className="flex items-center justify-end gap-1 mt-2">
                      <span className="text-[10px] opacity-60">
                        {new Date(message.createdAt).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>

                      {/* Read receipts */}
                      {isOwnMessage && !isDeleted && (
                        message.readAt ? (
                          <CheckCheck
                            size={15}
                            className="text-sky-300"
                            aria-label="Seen"
                            title="Seen"
                          />
                        ) : message.deliveredAt ? (
                          <CheckCheck
                            size={15}
                            className="text-gray-300"
                            aria-label="Delivered"
                            title="Delivered"
                          />
                        ) : (
                          <Check
                            size={15}
                            className="text-gray-300"
                            aria-label="Sent"
                            title="Sent"
                          />
                        )
                      )}
                    </div>
                  </div>

                  {/* Message Options */}
                  {!isDeleted && (
                    <div
                      className={`absolute top-1 z-20 ${
                        isOwnMessage
                          ? "right-full mr-1"
                          : "left-full ml-1"
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() =>
                          setMenuMessageId(
                            menuMessageId === message._id
                              ? null
                              : message._id
                          )
                        }
                        className="p-1.5 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition"
                        title="Message options"
                        aria-label="Message options"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {/* Message Dropdown */}
                      {menuMessageId === message._id && (
                        <div
                          className={`absolute top-8 z-30 w-48 max-w-[calc(100vw-2rem)] rounded-xl border border-white/10 bg-[#18181f] shadow-xl p-1 ${
                            isOwnMessage ? "right-0" : "left-0"
                          }`}
                        >
                          <button
                            onClick={() =>
                              openDeleteConfirmation(message, "me")
                            }
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition"
                          >
                            <Trash2 size={15} />
                            Delete for me
                          </button>

                          {isOwnMessage && (
                            <button
                              onClick={() =>
                                openDeleteConfirmation(
                                  message,
                                  "everyone"
                                )
                              }
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition"
                            >
                              <Trash2 size={15} />
                              Delete for everyone
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Message Input */}
      <form
        onSubmit={handleSendMessage}
        className="shrink-0 p-3 sm:p-5 border-t border-white/10 flex items-center gap-2 sm:gap-3 bg-[#09090b]"
      >
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          placeholder="Type your message..."
          className="flex-1 min-w-0 bg-[#18181b] border border-white/10 rounded-xl px-3 sm:px-4 py-3 text-sm sm:text-base text-white outline-none focus:border-violet-500 transition"
        />

        <button
          type="submit"
          disabled={!text.trim() || isSendingMessage}
          className="shrink-0 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 p-3 sm:px-5 rounded-xl text-white transition"
          aria-label="Send message"
        >
          <Send size={20} />
        </button>
      </form>

      {/* Clear Conversation Confirmation */}
      {clearConfirmation && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#18181f] border border-white/10 rounded-2xl p-5 shadow-2xl">

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Trash2
                    size={20}
                    className="text-red-400"
                  />
                </div>

                <h3 className="text-white font-semibold">
                  Clear conversation?
                </h3>
              </div>

              <button
                onClick={() => setClearConfirmation(false)}
                disabled={isClearing}
                className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              This will remove all messages from your chat.
              The other participant will still be able to see
              their messages. This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setClearConfirmation(false)}
                disabled={isClearing}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleClearConversation}
                disabled={isClearing}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-50"
              >
                {isClearing ? "Clearing..." : "Clear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Message Delete Confirmation */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#18181f] border border-white/10 rounded-2xl p-5 shadow-2xl">

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Trash2
                    className="text-red-400"
                    size={20}
                  />
                </div>

                <h3 className="text-white font-semibold">
                  Delete message?
                </h3>
              </div>

              <button
                onClick={() => setDeleteConfirmation(null)}
                disabled={isDeleting}
                className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              {deleteConfirmation.type === "me"
                ? "This message will be removed from your chat. The other participant can still see it."
                : "This message will be deleted for both participants. A deleted-message notice will remain in the chat."}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteMessage}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatWindow;