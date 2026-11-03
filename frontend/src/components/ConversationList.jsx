
import { useEffect } from "react";
import { MessageCircle } from "lucide-react";
import useChatStore from "../store/chatStore";
import useAuthStore from "../store/authStore";

function ConversationList() {
  const {
    conversations,
    getConversations,
    selectConversation,
    selectedConversation,
    isLoadingConversations,
    chatError,
    onlineUsers,
  } = useChatStore();

  const { authUser } = useAuthStore();

  useEffect(() => {
    getConversations();
  }, [getConversations]);

  if (isLoadingConversations) {
    return (
      <p className="text-gray-400 text-sm p-4">
        Loading conversations...
      </p>
    );
  }

  if (chatError) {
    return (
      <p className="text-red-400 text-sm p-4">
        {chatError}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.length === 0 ? (
        <p className="text-gray-500 text-sm p-4">
          No conversations yet.
        </p>
      ) : (
        conversations.map((conversation) => {
          const otherUser = conversation.participants.find(
            (user) => user._id !== authUser?._id
          );

          if (!otherUser) return null;

          const isSelected =
            selectedConversation?._id === conversation._id;

          const isOnline = onlineUsers.some(
            (id) => String(id) === String(otherUser._id)
          );

          return (
            <button
              key={conversation._id}
              onClick={() => selectConversation(conversation)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition ${
                isSelected
                  ? "bg-violet-600/20 border border-violet-500/30"
                  : "hover:bg-white/5 border border-transparent"
              }`}
            >
              {/* Profile picture and online status */}
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                  {otherUser.profilePic ? (
                    <img
                      src={otherUser.profilePic}
                      alt={otherUser.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    otherUser.fullName?.charAt(0).toUpperCase()
                  )}
                </div>

                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#11111b] ${
                    isOnline ? "bg-green-500" : "bg-gray-500"
                  }`}
                />
              </div>

              {/* User information */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-sm font-semibold truncate">
                  {otherUser.fullName}
                </h3>

                <p
                  className={`text-xs truncate ${
                    isOnline ? "text-green-400" : "text-gray-400"
                  }`}
                >
                  {isOnline
                    ? "Online"
                    : conversation.lastMessage?.text ||
                      "Start a conversation"}
                </p>
              </div>

              <MessageCircle
                size={17}
                className="text-gray-500"
              />
            </button>
          );
        })
      )}
    </div>
  );
}

export default ConversationList;
