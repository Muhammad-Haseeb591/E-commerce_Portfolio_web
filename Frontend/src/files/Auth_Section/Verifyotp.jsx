import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { verifyOtp, resendOtp, clearError, clearMessage } from "../../assets/components/redux_Toolkit/authSlice";

const RESEND_COOLDOWN = 30; // seconds

const VerifyOtp = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { loading, error, message } = useSelector((state) => state.auth);

  const email = location.state?.email;
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const timerRef = useRef(null);

  // No email in state (e.g. page refresh / direct visit) — nothing to verify
  useEffect(() => {
    if (!email) navigate("/signup", { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    dispatch(clearError());
    dispatch(clearMessage());
    timerRef.current = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.trim().length !== 6) return;

    const result = await dispatch(verifyOtp({ email, otp: otp.trim() }));
    if (verifyOtp.fulfilled.match(result)) {
      navigate("/", { replace: true });
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    const result = await dispatch(resendOtp({ email }));
    if (resendOtp.fulfilled.match(result)) setCooldown(RESEND_COOLDOWN);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10 font-sans">
      <div className="w-full max-w-[400px]">
        <div className="border border-gray-200 rounded-2xl p-7 shadow-sm text-center">

          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6 text-[#333333]" />
          </div>

          <h1 className="text-lg font-semibold text-[#333333]">Verify your email</h1>
          <p className="text-sm text-gray-400 mt-1 mb-6">
            We sent a 6-digit code to <span className="text-[#333333] font-medium">{email}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              className="w-full text-center tracking-[0.5em] text-lg py-3 rounded-xl border border-gray-200 text-[#333333] placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#333333]/10 focus:border-[#333333] transition-all"
            />

            {error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {message && !error && (
              <p className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full flex items-center justify-center gap-2 bg-[#333333] hover:bg-[#1f1f1f] text-white text-sm font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Verify <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0}
            className="text-xs text-gray-400 hover:text-[#333333] transition-colors mt-5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Wrong email?{" "}
          <Link to="/signup" className="text-[#333333] font-medium hover:underline">
            Sign up again
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyOtp;