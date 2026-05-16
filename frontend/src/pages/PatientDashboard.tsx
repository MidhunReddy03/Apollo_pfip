import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  LogOut,
  RefreshCw,
  Bell,
  ChevronRight,
  Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { patientPortalService } from '../services/patientPortalService';
import { useAuthStore } from '../store';

interface DashboardData {
  patient: {
    id: number;
    name: string;
    mrn: string;
    patient_type: string;
    registered_at: string;
  };
  active_encounter: {
    id: number;
    status: string;
    department: string;
    chief_complaint: string;
    priority: string;
    check_in_time: string;
  } | null;
  journey: Array<{
    status: string;
    department: string;
    timestamp: string;
  }>;
  next_steps: {
    action: string;
    location: string;
    estimated_time: string;
  } | null;
}

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await patientPortalService.getDashboard();
      setDashboard(data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboard();
    toast.success('Updated');
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/patient-login');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency':
        return 'bg-emergency-100 text-emergency-700 border-emergency-300';
      case 'urgent':
        return 'bg-alert-100 text-alert-700 border-alert-300';
      case 'high':
        return 'bg-medical-100 text-medical-700 border-medical-300';
      default:
        return 'bg-health-100 text-health-700 border-health-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-health-600" size={20} />;
      case 'in_progress':
        return <Activity className="text-medical-600 animate-pulse" size={20} />;
      default:
        return <Clock className="text-slate-400" size={20} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto text-medical-500 animate-spin mb-4" size={40} />
          <p className="text-slate-600 font-semibold">Loading your hospital journey...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto text-emergency-500 mb-4" size={40} />
          <p className="text-slate-600 font-semibold">Unable to load your information</p>
        </div>
      </div>
    );
  }

  const { patient, active_encounter, journey, next_steps } = dashboard;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-medical-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">Your Hospital Journey</h1>
            <p className="text-sm text-slate-500 mt-0.5">{patient.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-50"
            >
              <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-all relative"
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-emergency-500 rounded-full"></span>
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-emergency-500 text-white rounded-xl hover:bg-emergency-600 transition-all flex items-center gap-2 text-sm font-semibold"
            >
              <LogOut size={16} /> Exit
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Current Status Card */}
        <div className="card p-6 mb-8 bg-gradient-to-r from-medical-500 to-medical-600 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-medical-100 text-sm font-semibold uppercase">Current Status</p>
              <h2 className="text-3xl font-display font-bold mt-1">
                {active_encounter ? active_encounter.department : 'Completed'}
              </h2>
            </div>
            <div className={`p-3 rounded-xl ${active_encounter ? 'bg-white/20' : 'bg-white/20'}`}>
              {active_encounter ? (
                <Activity size={32} className="text-white animate-pulse" />
              ) : (
                <CheckCircle size={32} className="text-white" />
              )}
            </div>
          </div>

          {active_encounter && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-medical-100 text-xs">Chief Complaint</p>
                <p className="font-semibold mt-1">{active_encounter.chief_complaint}</p>
              </div>
              <div>
                <p className="text-medical-100 text-xs">Priority</p>
                <p className="font-semibold mt-1 uppercase tracking-wide">
                  {active_encounter.priority}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Journey Timeline */}
            <div className="card p-6">
              <h3 className="font-display font-bold text-slate-900 mb-6 flex items-center gap-2">
                <MapPin size={24} className="text-medical-500" />
                Your Journey
              </h3>

              <div className="space-y-4">
                {journey.length === 0 ? (
                  <p className="text-slate-500 text-center py-6">No journey history yet</p>
                ) : (
                  journey.map((step, idx) => (
                    <div key={idx} className="relative flex gap-4 pb-4 border-b border-slate-100 last:border-0">
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center">
                        <div className="flex-shrink-0">{getStatusIcon(step.status)}</div>
                        {idx < journey.length - 1 && (
                          <div className="w-1 h-8 bg-slate-200 mt-2"></div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="pt-1 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{step.department}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {step.status.replace(/_/g, ' ').toUpperCase()}
                            </p>
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(step.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Instructions */}
            {next_steps && (
              <div className="card p-6 bg-gradient-to-br from-health-50 to-slate-50 border-2 border-health-200">
                <h3 className="font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <ChevronRight size={24} className="text-health-600" />
                  Next Steps
                </h3>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-health-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{next_steps.action}</p>
                      <p className="text-sm text-slate-600 mt-0.5">{next_steps.location}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-health-200 text-health-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      ⏱
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Estimated Time</p>
                      <p className="text-sm text-slate-600 mt-0.5">{next_steps.estimated_time}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Patient Info Card */}
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Your Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Patient ID</p>
                  <p className="text-lg font-mono font-bold text-medical-600 mt-1">{patient.id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">MRN</p>
                  <p className="text-sm font-mono text-slate-700 mt-1">{patient.mrn}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Type</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1 uppercase">
                    {patient.patient_type}
                  </p>
                </div>
              </div>
            </div>

            {/* Active Encounter Card */}
            {active_encounter && (
              <div className={`card p-6 border-2 ${getPriorityColor(active_encounter.priority)}`}>
                <p className="text-xs font-semibold uppercase opacity-75 mb-2">Active Encounter</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-slate-500">Department</p>
                    <p className="font-bold mt-0.5">{active_encounter.department}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Priority</p>
                    <p className="font-bold mt-0.5 uppercase tracking-wide">{active_encounter.priority}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Help Card */}
            <div className="card p-6 bg-slate-50">
              <h3 className="font-semibold text-slate-900 mb-3">Need Help?</h3>
              <ul className="text-sm space-y-2 text-slate-600">
                <li>✓ Ask any staff member</li>
                <li>✓ Call extension 100</li>
                <li>✓ Use the hospital app</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
