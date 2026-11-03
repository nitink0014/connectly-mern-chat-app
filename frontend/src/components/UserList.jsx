import { useEffect } from "react";
import useUserStore from "../store/userStore";

function UserList() {
  const { users, getUsers, isLoadingUsers, userError } =
    useUserStore();

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  if (isLoadingUsers) {
    return <p className="text-gray-400">Loading users...</p>;
  }

  if (userError) {
    return <p className="text-red-400">{userError}</p>;
  }

  if (users.length === 0) {
    return <p className="text-gray-400">No users found.</p>;
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div
          key={user._id}
          className="flex items-center gap-3 p-3 rounded-xl bg-[#18181b] border border-white/10"
        >
          <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center font-bold">
            {user.fullName?.charAt(0).toUpperCase()}
          </div>

          <div>
            <h3 className="text-white font-medium">
              {user.fullName}
            </h3>
            <p className="text-gray-400 text-sm">
              @{user.username}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default UserList;