import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  ShieldCheck,
  Lock,
  Mail,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  CreditCard,
  Building2,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react';
import api from '../api/axiosClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [step, setStep] = useState(1); // 1 = request, 2 = reset
  const [forgotMsg, setForgotMsg] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

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
      setGeneratedCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed');
    }
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard?.writeText(generatedCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden flex items-center justify-center p-4 sm:p-6 lg:p-10 select-none">
      {/* Decorative Ambient Glowing Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Subtle Fintech Background Grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}
      />

      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        
        {/* LEFT COLUMN: Community Heritage, Branding & Trust Showcase */}
        <div className="lg:col-span-7 space-y-6 text-left">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-white/10 to-white/5 border border-white/10 backdrop-blur-md text-amber-300 text-xs font-bold tracking-wide shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            <span>સેન્ટ્રલ ડિરેક્ટર પોર્ટલ • Central Management Console</span>
          </div>

          {/* Emblem & Organization Titles */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-amber-400 p-0.5 shadow-xl shadow-indigo-600/30 flex items-center justify-center shrink-0">
                <div className="h-full w-full bg-slate-950 rounded-[14px] flex flex-col items-center justify-center text-center p-1">
                  <span className="text-[10px] font-bold text-amber-400 leading-none">શ્રી</span>
                  <span className="text-xl sm:text-2xl font-black text-white leading-none mt-0.5 tracking-tight">૪૨</span>
                  <span className="text-[9px] font-semibold text-slate-400 leading-none mt-0.5">જ્ઞાતિ</span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                  શ્રી દશાશ્રીમાળી ૪૨ જ્ઞાતિ
                </h1>
                <p className="text-base sm:text-lg font-bold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                  સુરક્ષા સમિતિ — Director Portal
                </p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Shree Dashashremali 42 Gnati Suraksha Samiti
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed max-w-xl pt-1">
              સમાજના કલ્યાણ, સભ્યોની સુરક્ષા અને પારદર્શક નાણાકીય હિસાબ માટેનું અધિકૃત ડિરેક્ટર પોર્ટલ.
              સભ્ય સંચાલન, વાર્ષિક હપ્તા, દંડ નિયમો અને ત્વરિત રસીદ કલેક્શનની કેન્દ્રિય વ્યવસ્થા.
            </p>
          </div>

          {/* 3 Value Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xs hover:bg-white/[0.07] transition">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h4 className="font-bold text-xs text-white">ડિરેક્ટર સુરક્ષા (RBAC)</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                મલ્ટિ-ડિરેક્ટર એક્સેસ અને ઓટોમેટિક ઓડિટ હિસ્ટ્રી.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xs hover:bg-white/[0.07] transition">
              <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
                <CreditCard className="h-4 w-4" />
              </div>
              <h4 className="font-bold text-xs text-white">સ્માર્ટ કલેક્શન</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                સિંગલ & બલ્ક પેમેન્ટ સાથે તાત્કાલિક ડિજિટલ રસીદ.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xs hover:bg-white/[0.07] transition">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                <Building2 className="h-4 w-4" />
              </div>
              <h4 className="font-bold text-xs text-white">હપ્તા અને દંડ વ્યવસ્થા</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                ૩ મહિના ઓવરડ્યુ ઓટો-દંડ અને ડિરેક્ટર મુક્તિ વિકલ્પ.
              </p>
            </div>
          </div>

          {/* Footnote */}
          <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>કેન્દ્રિય કાર્યાલય: મહુવા / ભાવનગર, ગુજરાત • સુરક્ષિત અને સંરક્ષિત ડેટા સિસ્ટમ</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Elevated Glassmorphic Sign-In Console */}
        <div className="lg:col-span-5 w-full">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl shadow-black/60 p-7 sm:p-9 text-slate-900 relative">
            
            {/* Top Glowing Gradient Accent Bar */}
            <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-amber-400 via-indigo-600 to-amber-500 rounded-t-full" />

            {/* Error Message Box */}
            {error && (
              <div className="mb-5 rounded-xl bg-rose-50 p-3.5 text-xs text-rose-800 flex items-start gap-2.5 border border-rose-200 shadow-2xs animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <strong className="font-bold">પ્રવેશ નિષ્ફળ (Login Failed):</strong>
                  <p className="mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {!showForgot ? (
              /* LOGIN FORM */
              <div className="space-y-5">
                <div className="text-left pb-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider mb-2">
                    <Shield className="h-3 w-3" />
                    Authorized Director Sign-In
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    ડિરેક્ટર પ્રવેશ • Welcome Back
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    પોતાના રજીસ્ટર્ડ ઇમેઇલ અને પાસવર્ડ દ્વારા લોગિન કરો.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4 text-left">
                  {/* Email Field */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Login Email ID <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative rounded-xl shadow-2xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3.5 py-3 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-slate-50/60 font-medium text-slate-900 placeholder:text-slate-400 transition"
                        placeholder="director@ds24g.org"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                        Password <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgot(true);
                          setError('');
                        }}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition hover:underline cursor-pointer"
                      >
                        પાસવર્ડ ભૂલી ગયા? (Forgot?)
                      </button>
                    </div>
                    <div className="relative rounded-xl shadow-2xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-10 py-3 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-slate-50/60 font-mono text-slate-900 placeholder:text-slate-400 transition"
                        placeholder="••••••••••••"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Security Badge */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300 cursor-pointer"
                      />
                      <span className="text-slate-600 font-medium">સુરક્ષિત સત્ર (Stay logged in)</span>
                    </label>
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <ShieldCheck className="h-3 w-3" />
                      256-Bit SSL
                    </span>
                  </div>

                  {/* Sign In Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider text-white transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 via-indigo-700 to-amber-600 hover:from-indigo-500 hover:to-amber-500 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-0.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>ઓથેન્ટિકેશન થઈ રહ્યું છે...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          <span>સાઇન-ઇન કરો (Sign In to Portal)</span>
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Footer Notice */}
                <div className="pt-3 border-t border-slate-100 text-center">
                  <p className="text-[11px] text-slate-400">
                    આ કન્સોલ ફક્ત શ્રી દશાશ્રીમાળી ૪૨ જ્ઞાતિ સુરક્ષા સમિતિના માન્ય ડિરેક્ટર્સ માટે છે.
                  </p>
                </div>
              </div>
            ) : (
              /* FORGOT PASSWORD WORKFLOW */
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">
                        પાસવર્ડ પુનઃપ્રાપ્તિ (Password Recovery)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {step === 1 ? 'પગલું ૧: વેરિફિકેશન કોડ મેળવો' : 'પગલું ૨: નવો પાસવર્ડ સેટ કરો'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgot(false);
                      setStep(1);
                      setError('');
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                </div>

                {step === 1 ? (
                  /* Step 1: Request Code */
                  <form onSubmit={handleRequestReset} className="space-y-4">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      પોતાનો રજીસ્ટર્ડ ડિરેક્ટર ઇમેઇલ દાખલ કરો જેથી સિસ્ટમ સુરક્ષિત વેરિફિકેશન કોડ જનરેટ કરશે:
                    </p>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Registered Email ID <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative rounded-xl shadow-2xs">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail className="h-4 w-4" />
                        </div>
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="director@ds24g.org"
                          className="block w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 font-medium"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <KeyRound className="h-4 w-4" />
                      <span>વેરિફિકેશન કોડ જનરેટ કરો (Generate Code)</span>
                    </button>
                  </form>
                ) : (
                  /* Step 2: Reset Password */
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    {generatedCode && (
                      <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-2 shadow-2xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-700 block">
                            સુરક્ષા વેરિફિકેશન કોડ:
                          </span>
                          <span className="font-mono font-black text-base tracking-widest text-amber-950">
                            {generatedCode}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                          title="Copy reset code"
                        >
                          {copiedCode ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-700" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy Code</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Enter Verification Code <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        placeholder="Enter 6-digit code"
                        className="block w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        New Secure Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative rounded-xl shadow-2xs">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="h-4 w-4" />
                        </div>
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="block w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>નવો પાસવર્ડ સેવ કરો (Update Password)</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
