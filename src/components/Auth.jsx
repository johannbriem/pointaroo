import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    const { data, error } = isSignup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } else {
      onLogin(data?.user);
    }
  };

  return (
    <div className="p-4 max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-4">{isSignup ? 'Sign Up' : 'Log In'}</h2>
      <input
        type="email"
        className="w-full p-2 border mb-2"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        className="w-full p-2 border mb-2"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleAuth} className="bg-blue-500 text-white w-full py-2 rounded">
        {isSignup ? 'Sign Up' : 'Log In'}
      </button>
      <p className="text-sm mt-2 cursor-pointer text-blue-600" onClick={() => setIsSignup(!isSignup)}>
        {isSignup ? 'Have an account? Log in' : 'No account? Sign up'}
      </p>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
