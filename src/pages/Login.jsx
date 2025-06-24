import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    // Set a specific title for the login page
    document.title = `${t("login.login")} - ${t("app.title")}`;
  }, [t]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      alert("Login failed: " + error.message);
    } else {
      navigate("/");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return alert("Enter your email first.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) alert("Failed to send reset email");
    else alert("Password reset link sent!");
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-6 text-gray-900">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-700 mb-2">Pointaroo</h1>
          <p className="text-sm text-gray-600">{t("login.subtitle", "Log in to your account")}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("login.email", "Email")}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("login.password", "Password")}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition duration-200"
          >
            {loading ? t("login.loggingIn", "Logging in...") : t("login.login", "Log In")}
          </button>
        </form>

        <div className="text-sm text-center mt-4 space-y-2">
          <button
            onClick={handleForgotPassword}
            className="text-blue-600 hover:underline"
          >
            {t("login.forgotPassword", "Forgot password?")}
          </button>
          <p>
            {t("login.noAccount", "Don't have an account?")}{" "}
            <Link to="/signup" className="text-blue-600 hover:underline">
              {t("login.signup", "Sign up")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
