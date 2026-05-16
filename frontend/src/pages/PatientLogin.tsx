import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { patientPortalService } from '../services/patientPortalService';
import { useAuthStore } from '../store';

export default function PatientLogin() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [patientId, setPatientId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!patientId || !password) {
        throw new Error('Please enter both Patient ID and password');
      }

      const response = await patientPortalService.loginWithSessionCredentials(
        parseInt(patientId),
        password
      );

      // Store token in localStorage and auth store
      localStorage.setItem('patient_token', response.access_token);
      setUser({
        id: parseInt(patientId),
        email: response.patient_email,
        name: response.patient_name,
        type: 'patient',
      });

      toast.success(`Welcome, ${response.patient_name}!`);
      navigate('/patient/dashboard');
    } catch (err: any) {
      const errorMsg = err.message || 'Login failed. Please check your credentials.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 to-health-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="card p-8 shadow-xl">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-medical-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <LogIn className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-display font-bold text-slate-900">Apollo DQMS</h1>
            <p className="text-sm text-slate-500 mt-2">Patient Portal</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-emergency-50 border border-emergency-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-emergency-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-emergency-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Patient ID */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Patient ID
              </label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="Enter your patient ID"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Session Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your session password"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all"
                disabled={isLoading}
              />
              <p className="text-xs text-slate-500 mt-1">
                You received this from the registration kiosk
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-medical-500 hover:bg-medical-600 disabled:bg-slate-300 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-6"
            >
              <LogIn size={20} />
              {isLoading ? 'Logging in...' : 'Enter Hospital Portal'}
            </button>
          </form>

          {/* Info */}
          <div className="mt-8 p-4 bg-slate-50 rounded-xl">
            <h3 className="font-semibold text-slate-900 text-sm mb-2">How it works:</h3>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>✓ Get your Patient ID from registration desk</li>
              <li>✓ Use the session password from the kiosk</li>
              <li>✓ Valid only during your hospital visit</li>
              <li>✓ See real-time updates on your journey</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-600 mt-6">
          Need help? Contact the registration desk or call +1-234-567-8900
        </p>
      </div>
    </div>
  );
}
