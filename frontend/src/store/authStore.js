
import { create } from "zustand";
import api from "../services/axios";

const useAuthStore = create((set) => ({
  authUser: null,
  isCheckingAuth: false,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfilePic: false,
  authError: null,

  signup: async (formData) => {
    set({ isSigningUp: true, authError: null });

    try {
      const res = await api.post("/auth/signup", formData);
      set({ authUser: res.data.user });
      return true;
    } catch (error) {
      set({
        authError: error.response?.data?.message || error.message,
      });
      return false;
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (formData) => {
    set({ isLoggingIn: true, authError: null });

    try {
      const res = await api.post("/auth/login", formData);
      set({ authUser: res.data.user });
      return true;
    } catch (error) {
      set({
        authError: error.response?.data?.message || error.message,
      });
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  checkAuth: async () => {
    set({ isCheckingAuth: true });

    try {
      const res = await api.get("/auth/me");
      set({ authUser: res.data.user });
    } catch {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // Upload or update profile picture
  updateProfilePic: async (image) => {
    set({
      isUpdatingProfilePic: true,
      authError: null,
    });

    try {
      const res = await api.put("/auth/profile-picture", {
        image,
      });

      set({
        authUser: res.data.user,
      });

      return true;
    } catch (error) {
      set({
        authError:
          error.response?.data?.message || error.message,
      });

      return false;
    } finally {
      set({
        isUpdatingProfilePic: false,
      });
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
      set({ authUser: null });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  },
}));

export default useAuthStore;
