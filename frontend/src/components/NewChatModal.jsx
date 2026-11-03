
import { useEffect, useState } from "react";
import {
  Search,
  X,
  UserRound,
  Loader2,
} from "lucide-react";
import useChatStore from "../store/chatStore";

const NewChatModal = ({ onClose }) => {
  const {
    users,
    getUsers,
    createConversation,
    isLoadingUsers,
  } = useChatStore();

  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = users.filter((user) => {
    const name = user.fullName || "";
    const username = user.username || "";

    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      username.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleSelectUser = async (userId) => {
    setSelectedUserId(userId);

    const conversation = await createConversation(userId);

    if (conversation) {
      onClose();
    } else {
      setSelectedUserId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#17171f] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div>
            <h2 className="text-lg font-semibold text-white">
              New Chat
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Find someone on Connectly
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#22222c] px-4">
            <Search size={18} className="text-gray-400" />

            <input
              type="text"
              placeholder="Search people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-gray-500"
            />
          </div>
        </div>

        <div className="max-h-80 min-h-40 overflow-y-auto px-3 pb-3">
          {isLoadingUsers ? (
            <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Loading people...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">
              {search
                ? "No users found."
                : "No other users registered yet."}
            </p>
          ) : (
            filteredUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => handleSelectUser(user._id)}
                disabled={selectedUserId !== null}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-white/5 disabled:opacity-50"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-500/20 text-violet-300">
                  {user.profilePic ? (
                    <img
                      src={user.profilePic}
                      alt={user.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound size={21} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {user.fullName}
                  </p>
                  <p className="truncate text-xs text-gray-400">
                    @{user.username}
                  </p>
                </div>

                {selectedUserId === user._id && (
                  <Loader2
                    size={18}
                    className="animate-spin text-violet-400"
                  />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
