
import { useRef, useState } from "react";
import { Camera, X, Upload, UserRound } from "lucide-react";
import useAuthStore from "../store/authStore";

function ProfileModal({ onClose }) {
  const { authUser, updateProfilePic, isUpdatingProfilePic } =
    useAuthStore();

  const [preview, setPreview] = useState(
    authUser?.profilePic || ""
  );
  const [selectedImage, setSelectedImage] = useState("");
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      return;
    }

    setError("");

    const reader = new FileReader();

    reader.onloadend = () => {
      setPreview(reader.result);
      setSelectedImage(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      setError("Please select a picture first.");
      return;
    }

    const success = await updateProfilePic(selectedImage);

    if (success) {
      onClose();
    } else {
      setError("Unable to upload picture. Please try again.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#11111b] border border-white/10 rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">
              Edit Profile
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Update your profile picture
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-violet-500/30 bg-[#27272a] flex items-center justify-center">
              {preview ? (
                <img
                  src={preview}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserRound size={55} className="text-gray-500" />
              )}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 p-3 rounded-full bg-violet-600 hover:bg-violet-700 text-white border-4 border-[#11111b] transition"
              aria-label="Choose profile picture"
            >
              <Camera size={18} />
            </button>
          </div>

          <p className="text-white font-semibold mt-4">
            {authUser?.fullName}
          </p>

          <p className="text-sm text-gray-500">
            @{authUser?.username}
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleImageChange}
          className="hidden"
        />

        {error && (
          <p className="text-red-400 text-sm text-center mt-4">
            {error}
          </p>
        )}

        <div className="mt-6 space-y-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#27272a] hover:bg-[#323236] text-white transition"
          >
            <Camera size={18} />
            Choose Picture
          </button>

          <button
            onClick={handleUpload}
            disabled={!selectedImage || isUpdatingProfilePic}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition"
          >
            <Upload size={18} />
            {isUpdatingProfilePic ? "Uploading..." : "Save Picture"}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          JPG, PNG or WebP · Maximum size 5MB
        </p>
      </div>
    </div>
  );
}

export default ProfileModal;
