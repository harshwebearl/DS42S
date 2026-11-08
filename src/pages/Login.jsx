import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';
import api from '../api/axiosClient';

export default function Login() {
  const [email, setEmail] = useState('director@ds24g.org');
  const [password, setPassword] = useState('Director@2026');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1 = request, 2 = reset
  const [forgotMsg, setForgotMsg] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setForgotMsg('');
    setError('');
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotMsg(res.data.message);
      if (res.data.resetCode) {
        setGeneratedCode(res.data.resetCode);
        setResetCode(res.data.resetCode);
      }
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Error processing request');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/reset-password', {
        email: forgotEmail,
        resetCode,
        newPassword
      });
      alert(res.data.message);
      setShowForgot(false);
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center font-black text-white shadow-xl text-2xl tracking-wider mb-4 border border-white/10">
          42G
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">
          Shree Dashashremali 42 Gnati
        </h2>
        <p className="text-sm font-semibold text-amber-400 mt-1">
          Suraksha Samiti — Director CRM System
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Authorized Director Single Sign-In Console
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {error && (
            <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!showForgot ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Director Email
                </label>
                <div className="mt-1 relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2.5 sm:text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                    placeholder="director@ds24g.org"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setShowForgot(true); setError(''); }}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="mt-1 relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2.5 sm:text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50"
                >
                  <Shield className="h-4 w-4" />
                  {loading ? 'Authenticating Director...' : 'Secure Director Login'}
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-[11px] text-slate-500">
                  Initial Seed Credentials: <span className="font-mono text-slate-700 font-bold">director@ds24g.org</span> / <span className="font-mono text-slate-700 font-bold">Director@2026</span>
                </p>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Director Password Recovery</h3>
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="text-xs text-slate-500 hover:underline"
                >
                  Back to Login
                </button>
              </div>

              {step === 1 ? (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <p className="text-xs text-slate-600">Enter your registered Director email to generate a secure reset code:</p>
                  <div>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="director@ds24g.org"
                      className="block w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                  >
                    Generate Reset Code
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  {generatedCode && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                      <strong>Verification Code:</strong> <span className="font-mono font-bold text-sm">{generatedCode}</span>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Enter Reset Code</label>
                    <input
                      type="text"
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">New Secure Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="mt-1 block w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
                  >
                    Set New Password
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
