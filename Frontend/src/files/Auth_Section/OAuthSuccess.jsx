import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { checkAuth } from "../../assets/components/redux_Toolkit/authSlice";

const OAuthSuccess = () => {
  const [params] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const redirect = params.get("redirect") || "/";

    // Backend already set the auth cookie during the Google callback.
    // Just ask the backend "who am I?" the same way normal login does.
    dispatch(checkAuth()).then(() => {
      navigate(redirect, { replace: true });
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
      Signing you in…
    </div>
  );
};

export default OAuthSuccess;