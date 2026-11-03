
import { useState } from "react";
import useAuthStore from "../store/authStore";

function Signup() {
const { signup, isSigningUp, authError } = useAuthStore();
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });

 const handleSubmit = async (e) => {
  e.preventDefault();
  await signup(formData);
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
          Create your account
        </p>

        {Object.keys(formData).map((field) => (
          <input
            key={field}
            type={field === "password" ? "password" : "text"}
            placeholder={field === "fullName" ? "Full name" : field.charAt(0).toUpperCase() + field.slice(1)}
            value={formData[field]}
            onChange={(e) =>
              setFormData({
                ...formData,
                [field]: e.target.value,
              })
            }
            required
            className="w-full mb-4 p-3 rounded-lg bg-[#27272a] outline-none border border-white/10 focus:border-violet-500"
          />
        ))}
        {authError && (
  <p className="text-red-400 text-sm mb-4">
    {authError}
  </p>
)}

       <button type="submit" disabled={isSigningUp}>
  {isSigningUp ? "Creating account..." : "Create Account"}
</button>
      </form>
    </div>
  );
}

export default Signup;
