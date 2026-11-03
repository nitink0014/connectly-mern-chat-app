import { create } from "zustand";
import api from "../services/axios";

const useUserStore = create((set) => ({
  users: [],
  isLoadingUsers: false,
  userError: null,

  getUsers: async () => {
    set({ isLoadingUsers: true, userError: null });

    try {
      const res = await api.get("/users");

      set({ users: res.data.users });
    } catch (error) {
      set({
        userError:
          error.response?.data?.message || error.message,
      });
    } finally {
      set({ isLoadingUsers: false });
    }
  },
}));

export default useUserStore;