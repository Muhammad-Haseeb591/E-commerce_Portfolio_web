import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { forgotPassword, clearError, clearMessage } from "../../assets/components/redux_Toolkit/authSlice";

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const { loading, error, message } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [localError, setLocalError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    dispatch(clearError());
    dispatch(clearMessage());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError("Enter a valid email address.");
      return;
    }

    const result = await dispatch(forgotPassword({ email }));
    if (forgotPassword.fulfilled.match(result)) setSent(true);
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10 font-sans">
      <div className="w-full max-w-[400px]">
        <div className="border border-gray-200 rounded-2xl p-7 shadow-sm">

          {sent ? (
            // ── Acknowledgement state ──
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <h1 className="text-lg font-semibold text-[#333333]">Check your inbox</h1>
              <p className="text-sm text-gray-400 mt-2">
                {message || `If ${email} is registered, a password reset link is on its way. It's valid for 15 minutes.`}
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-[#333333] mb-1">Forgot password?</h1>
              <p className="text-sm text-gray-400 mb-6">
                Enter your email and we'll send you a link to reset it.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-[#333333] placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#333333]/10 focus:border-[#333333] transition-all"
                    />
                  </div>
                </div>

                {displayError && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {displayError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-[#333333] hover:bg-[#1f1f1f] text-white text-sm font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Send reset link <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Remembered your password?{" "}
          <Link to="/login" className="text-[#333333] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;