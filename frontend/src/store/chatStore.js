import { create } from "zustand";
import api from "../services/axios";

const useChatStore = create((set) => ({
  conversations: [],
  selectedConversation: null,
  messages: [],
  users: [],
  onlineUsers: [],

  isLoadingConversations: false,
  isLoadingMessages: false,
  isSendingMessage: false,
  isLoadingUsers: false,

  chatError: null,

  setOnlineUsers: (users) => {
    set({ onlineUsers: users });
  },

  addIncomingMessage: (message) => {
    set((state) => {
      if (
        String(state.selectedConversation?._id) !==
        String(message.conversationId)
      ) {
        return state;
      }

      const alreadyExists = state.messages.some(
        (msg) => String(msg._id) === String(message._id)
      );

      if (alreadyExists) return state;

      return {
        messages: [...state.messages, message],
      };
    });
  },

  markMessageDelivered: ({ messageId, deliveredAt }) => {
    set((state) => ({
      messages: state.messages.map((message) =>
        String(message._id) === String(messageId)
          ? { ...message, deliveredAt }
          : message
      ),
    }));
  },

  markMessageRead: ({ messageId, readAt }) => {
    set((state) => ({
      messages: state.messages.map((message) =>
        String(message._id) === String(messageId)
          ? {
              ...message,
              deliveredAt: message.deliveredAt || readAt,
              readAt,
            }
          : message
      ),
    }));
  },

  hideMessageForMe: (messageId) => {
    set((state) => ({
      messages: state.messages.filter(
        (message) => String(message._id) !== String(messageId)
      ),
    }));
  },

  markMessageDeletedForEveryone: ({ messageId, deletedAt }) => {
    set((state) => ({
      messages: state.messages.map((message) =>
        String(message._id) === String(messageId)
          ? {
              ...message,
              text: "",
              image: "",
              deletedForEveryone: true,
              deletedAt,
            }
          : message
      ),
    }));
  },

  // Clear messages in the currently selected conversation.
  clearMessagesForConversation: (conversationId) => {
    set((state) => {
      if (
        String(state.selectedConversation?._id) !==
        String(conversationId)
      ) {
        return state;
      }

      return { messages: [] };
    });
  },

  deleteMessageForMe: async (messageId) => {
    set({ chatError: null });

    try {
      await api.delete(`/messages/${messageId}/me`);

      set((state) => ({
        messages: state.messages.filter(
          (message) => String(message._id) !== String(messageId)
        ),
      }));

      return true;
    } catch (error) {
      set({
        chatError:
          error.response?.data?.message || error.message,
      });

      return false;
    }
  },

  deleteMessageForEveryone: async (messageId) => {
    set({ chatError: null });

    try {
      const res = await api.delete(
        `/messages/${messageId}/everyone`
      );

      set((state) => ({
        messages: state.messages.map((message) =>
          String(message._id) === String(messageId)
            ? {
                ...message,
                text: "",
                image: "",
                deletedForEveryone: true,
                deletedAt: res.data.deletedAt,
              }
            : message
        ),
      }));

      return true;
    } catch (error) {
      set({
        chatError:
          error.response?.data?.message || error.message,
      });

      return false;
    }
  },

  // Clear conversation only for the current user.
  clearConversationForMe: async (conversationId) => {
    set({ chatError: null });

    try {
      await api.delete(
        `/messages/conversation/${conversationId}/clear`
      );

      set((state) => {
        if (
          String(state.selectedConversation?._id) !==
          String(conversationId)
        ) {
          return state;
        }

        return { messages: [] };
      });

      return true;
    } catch (error) {
      set({
        chatError:
          error.response?.data?.message || error.message,
      });

      return false;
    }
  },

  getUsers: async () => {
    set({
      isLoadingUsers: true,
      chatError: null,
    });

    try {
      const res = await api.get("/users");

      set({ users: res.data.users });
    } catch (error) {
      set({
        chatError:
          error.response?.data?.message || error.message,
      });
    } finally {
      set({ isLoadingUsers: false });
    }
  },

  createConversation: async (receiverId) => {
    set({ chatError: null });

    try {
      const res = await api.post("/conversations", {
        receiverId,
      });

      const conversation = res.data.conversation;

      set((state) => ({
        conversations: [
          conversation,
          ...state.conversations.filter(
            (item) => item._id !== conversation._id
          ),
        ],
        selectedConversation: conversation,
        messages: [],
      }));

      return conversation;
    } catch (error) {
      set({
        chatError:
          error.response?.data?.message || error.message,
      });

      return null;
    }
  },

  getConversations: async () => {
    set({
      isLoadingConversations: true,
      chatError: null,
      selectedConversation: null,
      messages: [],
    });

    try {
      const res = await api.get("/conversations");

      set({ conversations: res.data.conversations });
    } catch (error) {
      set({
        conversations: [],
        chatError:
          error.response?.data?.message || error.message,
      });
    } finally {
      set({ isLoadingConversations: false });
    }
  },

  getMessages: async (conversationId) => {
    set({
      isLoadingMessages: true,
      messages: [],
      chatError: null,
    });

    try {
      const res = await api.get(`/messages/${conversationId}`);

      set({ messages: res.data.messages });
    } catch (error) {
      set({
        chatError:
          error.response?.data?.message || error.message,
      });
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  selectConversation: (conversation) => {
    set({
      selectedConversation: conversation,
      messages: [],
    });
  },

  sendMessage: async (conversationId, text) => {
    if (!text.trim()) return false;

    set({
      isSendingMessage: true,
      chatError: null,
    });

    try {
      const res = await api.post("/messages/send", {
        conversationId,
        text,
      });

      set((state) => ({
        messages: [
          ...state.messages,
          res.data.message,
        ],
      }));

      return true;
    } catch (error) {
      set({
        chatError:
          error.response?.data?.message || error.message,
      });

      return false;
    } finally {
      set({ isSendingMessage: false });
    }
  },
}));

export default useChatStore;