import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { Leaf, User, Mail, Lock, ShieldAlert } from 'lucide-react';
import api from '../services/api';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Operator'); // Admin, Driver, Operator
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/signup', { name, email, password, role });
      login(res.data.user, res.data.token);
      
      if (res.data.user.role === 'Driver') {
        navigate('/driver');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 text-slate-100 relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[550px] w-[550px] rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none"></div>

      <div className="z-10 w-full max-w-md space-y-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-8 shadow-2xl">
        <div className="flex flex-col items-center justify-center text-center">
          <Link to="/" className="flex items-center gap-2 font-bold text-emerald-400 text-2xl mb-2">
            <Leaf className="h-7 w-7" />
            <span>Smart Waste</span>
          </Link>
          <h2 className="text-xl font-bold tracking-tight text-white mt-4">Create Account</h2>
          <p className="text-sm text-slate-400 mt-1">Register as a dispatcher, operator, or driver</p>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/25 p-3.5 text-center text-xs font-semibold text-rose-400">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-emerald-500 focus:outline-none transition-colors text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jsmith@smartwaste.com"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-emerald-500 focus:outline-none transition-colors text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-emerald-500 focus:outline-none transition-colors text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">System Access Role</label>
            <div className="relative">
              <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-800 border border-white/10 focus:border-emerald-500 focus:outline-none transition-colors text-sm text-white appearance-none"
              >
                <option value="Operator">Operator (Dispatcher Portal)</option>
                <option value="Driver">Driver (Field Portal)</option>
                <option value="Admin">Admin (Full Control)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 mt-6">
          <span>Already have an account? </span>
          <Link to="/login" className="text-emerald-400 hover:underline font-semibold">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
