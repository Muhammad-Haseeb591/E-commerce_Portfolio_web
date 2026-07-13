import { useSelector } from "react-redux";

const useAuth = () => {
  const { user, authChecked, loading } = useSelector((state) => state.auth);

  const isLoggedIn = !!user;
  const isAdmin = user?.role === "admin";
  const isUser = user?.role === "user";

  return {
    user,
    isLoggedIn,
    isAdmin,
    isUser,
    authChecked,
    loading,
  };
};

export default useAuth;