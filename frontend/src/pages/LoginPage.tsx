import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, User, Lock, AlertCircle, ArrowRight, Shield, Zap, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/auth';
import { useAuthStore } from '../store';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      await authService.login({ username, password });
      const user = await authService.getCurrentUser();
      setUser(user);

      toast.success(`Welcome back, ${user.full_name}!`);

      switch (user.role) {
        case 'super_admin':
        case 'hospital_admin':
          navigate('/admin/dashboard');
          break;
        case 'floor_manager':
          navigate('/manager/dashboard');
          break;
        case 'receptionist':
          navigate('/receptionist/dashboard');
          break;
        case 'doctor':
          navigate('/doctor/dashboard');
          break;
        case 'technician':
          navigate('/technician/dashboard');
          break;
        case 'patient':
          navigate('/patient/dashboard');
          break;
        default:
          navigate('/receptionist/dashboard');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Invalid credentials. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const demoCredentials = [
    { role: 'Admin', user: 'admin', pass: 'admin123', icon: Shield, color: 'medical' },
    { role: 'Receptionist', user: 'receptionist', pass: 'rec123', icon: User, color: 'health' },
    { role: 'Doctor', user: 'doctor', pass: 'doc123', icon: Heart, color: 'alert' },
    { role: 'Floor Manager', user: 'manager', pass: 'mgr123', icon: Zap, color: 'medical' },
  ];

  const quickLogin = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Hero */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '3s' }} />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
              <Activity className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-white">Apollo DQMS</h1>
              <p className="text-blue-200 text-sm font-medium">Version 2.0</p>
            </div>
          </div>

          <h2 className="text-5xl font-display font-bold text-white leading-tight mb-6">
            Intelligent Hospital
            <br />
            <span className="text-blue-300">Operations Platform</span>
          </h2>

          <p className="text-blue-200 text-lg leading-relaxed max-w-md mb-10">
            AI-powered queue management, real-time patient flow optimization, and zero-touch hospital orchestration.
          </p>

          <div className="grid grid-cols-3 gap-4 max-w-md">
            {[
              { label: 'Wait Time', value: '↓ 60%', desc: 'Reduction' },
              { label: 'Throughput', value: '↑ 35%', desc: 'Increase' },
              { label: 'Automation', value: '↓ 80%', desc: 'Manual work' },
            ].map((m) => (
              <div key={m.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-2xl font-display font-bold text-white">{m.value}</p>
                <p className="text-xs text-blue-300 mt-1">{m.label}</p>
                <p className="text-[10px] text-blue-400">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 gradient-medical rounded-2xl shadow-medical mb-4">
              <Activity className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-display font-bold text-slate-900">Apollo DQMS 2.0</h1>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-elevated p-8 border border-slate-200">
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-1">Welcome back</h2>
            <p className="text-sm text-slate-500 mb-6">Sign in to your account</p>

            {error && (
              <div className="mb-5 p-3 bg-emergency-50 border border-emergency-200 rounded-xl flex items-start gap-2 animate-fade-in">
                <AlertCircle className="text-emergency-500 flex-shrink-0 mt-0.5" size={16} />
                <p className="text-sm text-emergency-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all text-sm bg-slate-50 focus:bg-white"
                    placeholder="Enter your username"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all text-sm bg-slate-50 focus:bg-white"
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary py-3.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <RefreshIcon /> Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In <ArrowRight size={16} />
                  </span>
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-xs text-slate-400 text-center mb-3 font-semibold uppercase tracking-wider">Quick Demo Login</p>
              <div className="grid grid-cols-2 gap-2">
                {demoCredentials.map((cred) => (
                  <button
                    key={cred.role}
                    onClick={() => quickLogin(cred.user, cred.pass)}
                    className="p-2.5 bg-slate-50 rounded-xl hover:bg-medical-50 hover:border-medical-200 transition-all border border-slate-200 text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <cred.icon size={14} className="text-slate-400 group-hover:text-medical-500" />
                      <div>
                        <p className="font-semibold text-slate-700 text-xs">{cred.role}</p>
                        <p className="text-[10px] text-slate-400">{cred.user} / {cred.pass}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            © 2024 Apollo DQMS. Enterprise Healthcare Platform.
          </p>
        </div>
      </div>
    </div>
  );
}

function RefreshIcon() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
