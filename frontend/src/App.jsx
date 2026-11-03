import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import {
  MessageCircle,
  LogOut,
  Search,
  Plus,
} from "lucide-react";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ConversationList from "./components/ConversationList";
import ChatWindow from "./components/ChatWindow";
import NewChatModal from "./components/NewChatModal";
import ProfileModal from "./components/ProfileModal";

import socket from "./services/socket";
import useAuthStore from "./store/authStore";
import useChatStore from "./store/chatStore";

function HomePage() {
  const { authUser, logout } = useAuthStore();

  const {
    setOnlineUsers,
    addIncomingMessage,
    markMessageDelivered,
    markMessageRead,
    hideMessageForMe,
    markMessageDeletedForEveryone,
    clearMessagesForConversation,
    selectedConversation,
    selectConversation,
  } = useChatStore();

  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    if (!authUser) return;

    socket.connect();

    const handleConnect = () => {
      console.log("Socket connected:", socket.id);
    };

    const handleConnectError = (error) => {
      console.error("Socket connection error:", error.message);
    };

    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    const handleNewMessage = (message) => {
      addIncomingMessage(message);
    };

    const handleMessageDelivered = (data) => {
      markMessageDelivered(data);
    };

    const handleMessageRead = (data) => {
      markMessageRead(data);
    };

    const handleMessageDeletedForMe = ({ messageId }) => {
      hideMessageForMe(messageId);
    };

    const handleMessageDeletedForEveryone = (data) => {
      markMessageDeletedForEveryone(data);
    };

    const handleConversationCleared = ({ conversationId }) => {
      clearMessagesForConversation(conversationId);
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("getOnlineUsers", handleOnlineUsers);
    socket.on("newMessage", handleNewMessage);
    socket.on("messageDelivered", handleMessageDelivered);
    socket.on("messageRead", handleMessageRead);

    socket.on(
      "messageDeletedForMe",
      handleMessageDeletedForMe
    );

    socket.on(
      "messageDeletedForEveryone",
      handleMessageDeletedForEveryone
    );

    socket.on(
      "conversationClearedForMe",
      handleConversationCleared
    );

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("getOnlineUsers", handleOnlineUsers);
      socket.off("newMessage", handleNewMessage);
      socket.off("messageDelivered", handleMessageDelivered);
      socket.off("messageRead", handleMessageRead);

      socket.off(
        "messageDeletedForMe",
        handleMessageDeletedForMe
      );

      socket.off(
        "messageDeletedForEveryone",
        handleMessageDeletedForEveryone
      );

      socket.off(
        "conversationClearedForMe",
        handleConversationCleared
      );

      socket.disconnect();
    };
  }, [
    authUser,
    setOnlineUsers,
    addIncomingMessage,
    markMessageDelivered,
    markMessageRead,
    hideMessageForMe,
    markMessageDeletedForEveryone,
    clearMessagesForConversation,
  ]);

  const handleLogout = async () => {
    await logout();
    selectConversation(null);
  };

  return (
    <div className="h-[100dvh] bg-[#09090f] text-white flex p-2 sm:p-3 gap-2 sm:gap-3 overflow-hidden">
      <aside
        className={`
          w-full sm:w-[280px] md:w-[300px] lg:w-[340px]
          shrink-0 bg-[#11111b] border border-white/[0.06]
          rounded-2xl flex flex-col overflow-hidden
          ${selectedConversation ? "hidden sm:flex" : "flex"}
        `}
      >
        <div className="p-4 sm:p-6 flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <MessageCircle size={23} />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Connectly
            </h1>
            <p className="text-xs text-gray-500">
              Your space to connect
            </p>
          </div>
        </div>

        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          <div className="flex items-center gap-3 bg-[#1a1a28] border border-white/[0.05] rounded-xl px-4 py-3 focus-within:border-violet-500/50 transition">
            <Search
              size={18}
              className="text-gray-500 shrink-0"
            />

            <input
              type="text"
              placeholder="Search conversations..."
              className="bg-transparent outline-none text-sm text-white placeholder:text-gray-600 w-full min-w-0"
            />
          </div>
        </div>

        <div className="px-4 sm:px-5 flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold tracking-widest text-gray-500">
            MESSAGES
          </h2>

          <button
            onClick={() => setIsNewChatOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-400 transition hover:bg-violet-500/20"
          >
            <Plus size={16} />
            New Chat
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-2 sm:px-3">
          <ConversationList />
        </div>

        <div className="p-3 sm:p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 bg-[#1a1a28] p-3 rounded-xl">
            <button
              onClick={() => setIsProfileOpen(true)}
              className="w-10 h-10 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-white"
              title="Edit profile picture"
            >
              {authUser?.profilePic ? (
                <img
                  src={authUser.profilePic}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                authUser?.fullName?.charAt(0).toUpperCase()
              )}
            </button>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold truncate">
                {authUser?.fullName}
              </h3>

              <p className="text-xs text-gray-500 truncate">
                @{authUser?.username}
              </p>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition"
            >
              <LogOut size={19} />
            </button>
          </div>
        </div>
      </aside>

      <main
        className={`
          flex-1 min-w-0 min-h-0 flex flex-col
          bg-[#11111b] border border-white/[0.06]
          rounded-2xl overflow-hidden
          ${selectedConversation ? "flex" : "hidden sm:flex"}
        `}
      >
        <ChatWindow />
      </main>

      {isNewChatOpen && (
        <NewChatModal
          onClose={() => setIsNewChatOpen(false)}
        />
      )}

      {isProfileOpen && (
        <ProfileModal
          onClose={() => setIsProfileOpen(false)}
        />
      )}
    </div>
  );
}

function App() {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return (
      <div className="h-[100dvh] bg-[#09090f] flex items-center justify-center">
        <div className="text-violet-400 animate-pulse font-semibold">
          Connecting to Connectly...
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          authUser ? <Navigate to="/" replace /> : <Login />
        }
      />

      <Route
        path="/signup"
        element={
          authUser ? <Navigate to="/" replace /> : <Signup />
        }
      />

      <Route
        path="/"
        element={
          authUser ? <HomePage /> : <Navigate to="/login" replace />
        }
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default App;