
import { useState } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../store/authStore";

function Login() {
  const { login, isLoggingIn, authError } = useAuthStore();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-white p-5">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-[#18181b] p-8 rounded-2xl border border-white/10"
      >
        <h1 className="text-3xl font-bold text-violet-400 mb-2">
          Connectly
        </h1>

        <p className="text-gray-400 mb-8">
          Welcome back!
        </p>

        {/* Email */}
        <input
          type="email"
          placeholder="Email address"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          required
          className="w-full mb-4 p-3 rounded-lg bg-[#27272a] outline-none border border-white/10 focus:border-violet-500"
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required
          className="w-full mb-4 p-3 rounded-lg bg-[#27272a] outline-none border border-white/10 focus:border-violet-500"
        />

        {/* Error Message */}
        {authError && (
          <p className="text-red-400 text-sm mb-4">
            {authError}
          </p>
        )}

        {/* Login Button */}
        <button
          type="submit"
          disabled={isLoggingIn}
          className="w-full p-3 rounded-lg bg-violet-600 hover:bg-violet-700 font-semibold transition disabled:opacity-50"
        >
          {isLoggingIn ? "Signing in..." : "Login"}
        </button>

        {/* Signup Link */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-violet-400 hover:text-violet-300 font-semibold transition"
          >
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
