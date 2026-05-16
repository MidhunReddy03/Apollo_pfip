import { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  Hash,
  ChevronRight,
  CheckCircle,
  Activity,
  Heart,
  FileText,
  Calendar,
  Navigation,
  Bell,
  Star,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '../store';

export default function PatientPortal() {
  const user = useAuthStore((s) => s.user);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const visit = {
    tokenNumber: 'T-047',
    status: 'in_queue',
    department: 'Radiology',
    currentStation: 'X-Ray Room 1',
    queuePosition: 3,
    estimatedWait: 12,
    checkedInAt: '10:15 AM',
    doctorName: 'Dr. Sharma',
    tests: [
      { name: 'Blood Test (CBC)', status: 'completed', time: '10:25 AM', station: 'Lab 2' },
      { name: 'Chest X-Ray', status: 'current', time: 'Waiting', station: 'X-Ray Room 1' },
      { name: 'ECG', status: 'upcoming', time: 'Pending', station: 'ECG Room 1' },
      { name: 'Doctor Consultation', status: 'upcoming', time: 'Pending', station: 'Consultation 3' },
    ],
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return { bg: 'bg-health-100', text: 'text-health-700', icon: <CheckCircle size={16} className="text-health-500" />, dot: 'bg-health-500' };
      case 'current': return { bg: 'bg-medical-100', text: 'text-medical-700', icon: <Activity size={16} className="text-medical-500 animate-pulse" />, dot: 'bg-medical-500 animate-pulse' };
      case 'upcoming': return { bg: 'bg-slate-100', text: 'text-slate-500', icon: <Clock size={16} className="text-slate-400" />, dot: 'bg-slate-300' };
      default: return { bg: 'bg-slate-100', text: 'text-slate-500', icon: <Clock size={16} />, dot: 'bg-slate-300' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-medical-50/30 to-slate-50">
      {/* Mobile-friendly header - no sidebar for patient view */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-medical rounded-xl flex items-center justify-center shadow-medical">
                <Activity className="text-white" size={20} />
              </div>
              <div>
                <h1 className="font-display font-bold text-slate-900">Apollo DQMS</h1>
                <p className="text-[11px] text-slate-500">Patient Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
              <Clock size={14} className="text-slate-500" />
              <span className="text-sm font-semibold text-slate-800">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-6 space-y-5">
        {/* Welcome Card */}
        <div className="gradient-hero rounded-2xl p-6 text-white animate-fade-in-up shadow-lg">
          <p className="text-sm text-blue-200 mb-1">Welcome back,</p>
          <h2 className="text-2xl font-display font-bold">{user?.full_name || 'Patient'}</h2>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-4 py-2">
              <Hash size={16} />
              <span className="font-bold text-lg">{visit.tokenNumber}</span>
            </div>
            <div className="text-sm">
              <p className="text-blue-200">Checked in at</p>
              <p className="font-semibold">{visit.checkedInAt}</p>
            </div>
          </div>
        </div>

        {/* Queue Status */}
        <div className="card p-5 animate-fade-in-up border-l-4 border-l-medical-500" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="status-dot online" />
            <p className="text-xs font-bold uppercase text-health-600 tracking-wider">Your Queue Status</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-display font-bold text-medical-600">{visit.queuePosition}</p>
              <p className="text-xs text-slate-500 mt-1">Position</p>
            </div>
            <div>
              <p className="text-3xl font-display font-bold text-alert-600">~{visit.estimatedWait}m</p>
              <p className="text-xs text-slate-500 mt-1">Est. Wait</p>
            </div>
            <div>
              <p className="text-lg font-display font-bold text-slate-800 mt-1">{visit.currentStation}</p>
              <p className="text-xs text-slate-500 mt-1">Next Station</p>
            </div>
          </div>
          {/* Progress indicator */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm text-medical-600">
              <Navigation size={14} />
              <span className="font-medium">Head to {visit.currentStation} — {visit.department}</span>
              <ChevronRight size={14} className="ml-auto" />
            </div>
          </div>
        </div>

        {/* Journey Timeline */}
        <div className="card p-5 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <h3 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin size={16} className="text-medical-500" />
            Your Journey
          </h3>
          <div className="space-y-0">
            {visit.tests.map((test, i) => {
              const style = getStatusStyle(test.status);
              return (
                <div key={i} className="flex gap-4">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-4 h-4 rounded-full ${style.dot} flex-shrink-0 mt-1 border-2 border-white shadow-sm`} />
                    {i < visit.tests.length - 1 && (
                      <div className={`w-0.5 flex-1 my-1 ${test.status === 'completed' ? 'bg-health-300' : 'bg-slate-200'}`} />
                    )}
                  </div>
                  {/* Content */}
                  <div className={`flex-1 pb-5 ${i === visit.tests.length - 1 ? 'pb-0' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-semibold text-sm ${test.status === 'upcoming' ? 'text-slate-400' : 'text-slate-900'}`}>
                          {test.name}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={10} /> {test.station}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${style.bg} ${style.text}`}>
                          {style.icon}
                          {test.status === 'current' ? 'In Progress' : test.status}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">{test.time}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2 mb-2">
              <Heart size={14} className="text-emergency-500" />
              <p className="text-xs font-semibold text-slate-400 uppercase">Doctor</p>
            </div>
            <p className="font-semibold text-slate-900">{visit.doctorName}</p>
            <p className="text-xs text-slate-500">General Medicine</p>
          </div>
          <div className="card p-4 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} className="text-medical-500" />
              <p className="text-xs font-semibold text-slate-400 uppercase">Visit Type</p>
            </div>
            <p className="font-semibold text-slate-900">Outpatient (OP)</p>
            <p className="text-xs text-slate-500">Health Checkup</p>
          </div>
        </div>

        {/* Notification Banner */}
        <div className="bg-medical-50 border border-medical-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="w-10 h-10 bg-medical-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Bell size={18} className="text-medical-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-medical-800">You'll be notified</p>
            <p className="text-xs text-medical-600">We'll send you an alert when it's your turn. No need to wait in the lobby.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-slate-400">© 2024 Apollo DQMS · Need help? Ask at the reception desk</p>
        </div>
      </main>
    </div>
  );
}
