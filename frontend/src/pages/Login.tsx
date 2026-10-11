import { useState, FormEvent } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, error, clearError, user, token } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [socialModalMessage, setSocialModalMessage] = useState<string | null>(null);

  // If already authenticated, redirect to the authorized portal based on role
  if (token && user) {
    switch (user.role) {
      case "ADMIN":
        return <Navigate to="/admin" replace />;
      case "COUNSELOR":
        return <Navigate to="/counselor" replace />;
      case "CLIENT":
        return <Navigate to="/client" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // Quick fill helper for defense evaluators
  const handleQuickFill = (accountType: "Client" | "Counsellor" | "Admin") => {
    setFormError(null);
    clearError();
    if (accountType === "Client") {
      setEmail("client@test.com");
      setPassword("Password123");
    } else if (accountType === "Counsellor") {
      setEmail("counselor@test.com");
      setPassword("Password123");
    } else if (accountType === "Admin") {
      setEmail("salmamustefa@gmail.com");
      setPassword("Password123");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setFormError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setFormError("Password is required to sign in.");
      return;
    }

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }

    try {
      // Backend validates credentials and returns authenticated user role
      const authenticatedUser = await login(email.trim(), password, rememberMe);

      // Dynamic Role-Based Access Control (RBAC) routing differentiated by backend
      switch (authenticatedUser.role) {
        case "ADMIN":
          navigate("/admin");
          break;
        case "COUNSELOR":
          navigate("/counselor");
          break;
        case "CLIENT":
        default:
          navigate("/client");
          break;
      }
    } catch {
      // Handled in AuthContext
    }
  };

  const handleSocialAuth = (provider: "Google" | "Telebirr") => {
    setSocialModalMessage(
      `${provider} Single Sign-On: The system automatically retrieves your profile and determines role-based permissions from the backend identity provider.`
    );
  };

  const displayError = formError || error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-sky-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand & Academic Defense Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <Link to="/" className="inline-flex items-center space-x-3 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform duration-200">
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <div className="text-left">
            <span className="text-2xl font-bold tracking-tight text-slate-900 block leading-tight">
              Mind<span className="text-teal-600">Bridge</span>
            </span>
            <span className="text-[11px] font-medium tracking-wide uppercase text-teal-700 block">
              Psychological Care Hub
            </span>
          </div>
        </Link>

        {/* Academic Project Defense Badge */}
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100/70 text-teal-800 text-xs font-medium border border-teal-200/60 shadow-sm">
          <svg className="w-3.5 h-3.5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a10.974 10.974 0 01-1.2 5.094c-.21.439-.06.97.351 1.229.41.258.949.13 1.189-.297a8.974 8.974 0 001.077-4.148l3.333 1.428v4.544a1 1 0 00.553.894l2 1a1 1 0 001.447-.894v-4.544l3.333-1.428a8.974 8.974 0 001.077 4.148c.24.427.779.555 1.189.297.411-.259.561-.79.351-1.229a10.974 10.974 0 01-1.2-5.094l2.644-1.131a1 1 0 000-1.84l-7-3zM10 4.162l5.622 2.41L10 8.981 4.378 6.572 10 4.162z" />
          </svg>
          <span>Dire Dawa University &bull; Final Project Defense</span>
        </div>

        <h1 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
          Sign in to your account
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter your credentials to access your authorized portal.
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-5 sm:px-10 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-100">
          {/* Social info modal message */}
          {socialModalMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs relative flex justify-between items-start">
              <span>{socialModalMessage}</span>
              <button
                type="button"
                onClick={() => setSocialModalMessage(null)}
                className="text-sky-600 font-bold ml-2 text-sm"
              >
                &times;
              </button>
            </div>
          )}

          {/* Error Banner */}
          {displayError && (
            <div className="mb-5 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-rose-800 text-xs flex items-start gap-2.5 animate-shake">
              <svg className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <span className="font-semibold block text-rose-900">Authentication Failed</span>
                <span className="mt-0.5 block">{displayError}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormError(null);
                  clearError();
                }}
                className="text-rose-500 hover:text-rose-700 font-bold"
              >
                &times;
              </button>
            </div>
          )}

          {/* Single Unified Sign In Form */}
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      "To reset your password in this defense prototype, please contact the MindBridge Administrator (admin@test.com)."
                    )
                  }
                  className="text-xs font-medium text-teal-600 hover:text-teal-800 hover:underline transition"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember me for 30-Day Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 transition cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900 select-none">
                  Remember me for 30-Day
                </span>
              </label>
            </div>

            {/* Primary Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-2xl shadow-lg shadow-teal-600/25 text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-teal-700/30"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Alternative Authentication Buttons: Google & Telebirr */}
          <div className="mt-7">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-500 font-semibold tracking-wider">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {/* Google Button */}
              <button
                type="button"
                onClick={() => handleSocialAuth("Google")}
                className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all group"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Google</span>
              </button>

              {/* Telebirr Button */}
              <button
                type="button"
                onClick={() => handleSocialAuth("Telebirr")}
                className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-[#0072ce]/30 rounded-xl bg-gradient-to-r from-[#0072ce]/5 to-[#ffcc00]/10 text-xs font-semibold text-[#005bb5] hover:bg-[#0072ce]/15 shadow-sm transition-all group"
              >
                <div className="w-4 h-4 mr-2 rounded-full bg-[#0072ce] flex items-center justify-center text-white text-[9px] font-black">
                  t
                </div>
                <span>Telebirr</span>
              </button>
            </div>
          </div>

          {/* Discreet Defense Quick-Fill Panel */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
              <span className="font-medium text-slate-600">Defense Test Accounts:</span>
              <span className="text-[10px] text-slate-400">Password: Password123</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill("Client")}
                className="py-1 px-2 text-[11px] rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 font-medium transition"
              >
                Client
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("Counsellor")}
                className="py-1 px-2 text-[11px] rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 font-medium transition"
              >
                Counsellor
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("Admin")}
                className="py-1 px-2 text-[11px] rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 font-medium transition"
              >
                Admin
              </button>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="mt-6 text-center border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-teal-600 hover:text-teal-700 hover:underline transition"
              >
                Create an Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
