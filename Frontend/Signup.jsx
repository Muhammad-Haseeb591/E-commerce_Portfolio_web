import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Check } from "lucide-react";
import { registerUser, clearError } from "./src/assets/components/redux_Toolkit/authSlice";



const getStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
};

const STRENGTH_LABEL = ["Very weak", "Weak", "Okay", "Good", "Strong"];
const STRENGTH_COLOR = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-lime-500", "bg-green-500"];

const Signup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { loading, error } = useSelector((state) => state.auth);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const strength = getStrength(password);

  const validateForm = () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setLocalError("All fields are required.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError("Enter a valid email address.");
      return false;
    }
    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters.");
      return false;
    }
    if (password !== confirmPass) {
      setLocalError("Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    dispatch(clearError());
    if (!validateForm()) return;

    const result = await dispatch(registerUser({ fullName, email, password }));

    if (registerUser.fulfilled.match(result)) {
      // Account created but unverified — backend emailed an OTP.
      // Send the user to verify it before they can log in.
      navigate("/verify-otp", { state: { email, from: location.state?.from } });
    }
  };
  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10 font-sans">
      <div className="w-full max-w-[400px]">
       {/* Card */}
        <div className="border border-gray-200 rounded-2xl p-7 shadow-sm">

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-[#333333] placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#333333]/10 focus:border-[#333333] transition-all"
                />
              </div>
            </div>

            {/* Email */}
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

            {/* Password */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 text-sm text-[#333333] placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#333333]/10 focus:border-[#333333] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#333333] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i < strength ? STRENGTH_COLOR[strength - 1] : "bg-gray-100"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">{STRENGTH_LABEL[Math.max(strength - 1, 0)]}</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 text-sm text-[#333333] placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#333333]/10 focus:border-[#333333] transition-all"
                />
                {confirmPass && password === confirmPass && (
                  <Check className="w-4 h-4 text-green-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                )}
              </div>
            </div>

            {/* Error */}
            {displayError && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {displayError}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#333333] hover:bg-[#1f1f1f] text-white text-sm font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        </div>

        {/* Login link */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-[#333333] font-medium hover:underline">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Signup;