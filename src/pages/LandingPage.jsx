import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

export default function LandingPage() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t("app.title");
  }, [t]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center px-4">
      {/* Top Login Nav */}
      <header className="w-full max-w-7xl flex justify-between items-center py-4 mb-8">
        <img src="/logo.png" alt="Pointaroo" className="h-8" />
        <Link to="/login" className="text-sm font-medium text-white hover:text-yellow-400 transition">
          Log In
        </Link>
      </header>

      {/* Hero */}
      <section className="text-center max-w-3xl mb-16">
        <img src="/logo.png" alt="Pointaroo" className="h-16 mx-auto mb-4" />
        <p className="text-lg text-gray-300">
          Help kids build healthy habits by completing chores to earn rewards —
          from their first phone to fun family experiences.
        </p>
      </section>

      {/* How it works */}
      <section className="bg-gray-800 w-full max-w-5xl rounded-lg shadow-md p-8 mb-16">
        <h3 className="text-xl font-bold text-center mb-6">How it works</h3>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 text-sm text-left">
          <div>
            <p className="text-lg mb-1">🎯 <strong>Set a goal</strong></p>
            <p className="text-gray-400">Choose a phone model or reward kids can work toward.</p>
          </div>
          <div>
            <p className="text-lg mb-1">📋 <strong>Complete tasks</strong></p>
            <p className="text-gray-400">Upload before/after photos to earn points for chores.</p>
          </div>
          <div>
            <p className="text-lg mb-1">🏆 <strong>Earn rewards</strong></p>
            <p className="text-gray-400">Track progress and unlock achievements.</p>
          </div>
          <div>
            <p className="text-lg mb-1">🛍️ <strong>Unlock experiences</strong></p>
            <p className="text-gray-400">Spend points on fun things like ice cream, swimming, or movies with family.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center">
        <p className="text-lg mb-4 font-semibold">Ready to start your Pointaroo journey?</p>
        <Link
          to="/signup"
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded transition"
        >
          Sign Up
        </Link>
        <p className="text-sm text-gray-400 mt-2">🎉 No more nagging — just motivation!</p>
      </section>
    </div>
  );
}
