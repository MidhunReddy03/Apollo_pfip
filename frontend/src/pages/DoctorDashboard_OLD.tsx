import { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  ClipboardCheck,
  AlertTriangle,
  Stethoscope,
  Play,
  CheckCircle,
  ChevronRight,
  Activity,
  Heart,
  FileText,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store';

interface PatientQueueItem {
  id: number;
  name: string;
  age: number;
  gender: string;
  mrn: string;
  type: 'IP' | 'OP' | 'HC';
  priority: 'emergency' | 'urgent' | 'high' | 'normal' | 'low';
  complaint: string;
  waitTime: number;
  status: 'waiting' | 'in_progress' | 'completed';
  vitals?: { bp: string; pulse: number; temp: string };
}

export default function DoctorDashboard() {
  const user = useAuthStore((s) => s.user);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activePatient, setActivePatient] = useState<number | null>(2);
  const [queue, setQueue] = useState<PatientQueueItem[]>([
    { id: 1, name: 'Rajesh Kumar', age: 45, gender: 'M', mrn: 'MRN004521', type: 'OP', priority: 'emergency', complaint: 'Chest pain, shortness of breath', waitTime: 3, status: 'waiting', vitals: { bp: '160/95', pulse: 110, temp: '98.6°F' } },
    { id: 2, name: 'Priya Sharma', age: 32, gender: 'F', mrn: 'MRN004522', type: 'OP', priority: 'normal', complaint: 'Follow-up for thyroid medication', waitTime: 0, status: 'in_progress', vitals: { bp: '120/80', pulse: 72, temp: '98.4°F' } },
    { id: 3, name: 'Mohammed Ali', age: 58, gender: 'M', mrn: 'MRN004523', type: 'IP', priority: 'urgent', complaint: 'Post-surgical wound review', waitTime: 12, status: 'waiting', vitals: { bp: '140/88', pulse: 85, temp: '99.2°F' } },
    { id: 4, name: 'Ananya Reddy', age: 28, gender: 'F', mrn: 'MRN004524', type: 'HC', priority: 'normal', complaint: 'Annual health checkup', waitTime: 18, status: 'waiting', vitals: { bp: '118/76', pulse: 68, temp: '98.2°F' } },
    { id: 5, name: 'Suresh Patel', age: 67, gender: 'M', mrn: 'MRN004525', type: 'OP', priority: 'high', complaint: 'Diabetic neuropathy, foot ulcer', waitTime: 22, status: 'waiting', vitals: { bp: '145/90', pulse: 78, temp: '98.8°F' } },
  ]);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const stats = [
    { label: 'In Queue', value: queue.filter(q => q.status === 'waiting').length, icon: Users, color: 'medical', accent: 'bg-medical-500' },
    { label: 'Seen Today', value: 23, icon: CheckCircle, color: 'health', accent: 'bg-health-500' },
    { label: 'Avg. Consult', value: '12m', icon: Clock, color: 'alert', accent: 'bg-alert-500' },
    { label: 'Critical', value: queue.filter(q => q.priority === 'emergency').length, icon: AlertTriangle, color: 'emergency', accent: 'bg-emergency-500' },
  ];

  const currentPatient = queue.find((p) => p.id === activePatient);

  const handleStartConsultation = () => {
    if (!currentPatient) return;
    setQueue(queue.map(p => 
      p.id === currentPatient.id ? { ...p, status: 'in_progress' } : p
    ));
    toast.success(`Started consultation with ${currentPatient.name}`);
  };

  const handleCompleteConsultation = () => {
    if (!currentPatient) return;
    setQueue(queue.map(p => 
      p.id === currentPatient.id ? { ...p, status: 'completed' } : p
    ));
    setActivePatient(null);
    toast.success(`Consultation completed for ${currentPatient.name}`);
  };

  const handleOrderTests = () => {
    if (!currentPatient) return;
    toast.success(`Test order initiated for ${currentPatient.name}`);
  };

  const handlePrescribe = () => {
    if (!currentPatient) return;
    toast.success(`Prescription form opened for ${currentPatient.name}`);
  };

  const handleRefer = () => {
    if (!currentPatient) return;
    toast.success(`Referral initiated for ${currentPatient.name}`);
  };

  const handleNotes = () => {
    if (!currentPatient) return;
    toast.success(`Notes opened for ${currentPatient.name}`);
  };

  const getPriorityStyle = (p: string) => {
    switch (p) {
      case 'emergency': return 'priority-emergency';
      case 'urgent': return 'priority-urgent';
      case 'high': return 'priority-high';
      case 'normal': return 'priority-normal';
      default: return 'priority-low';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar role="doctor" />
      <div className="ml-[264px] transition-all duration-300">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900">
                Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 17 ? 'Afternoon' : 'Evening'}, Dr. {user?.full_name?.split(' ').pop() || 'Doctor'}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
                <div className="status-dot online" />
                <span className="text-sm font-medium text-slate-700">On Duty</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
                <Clock size={16} className="text-slate-500" />
                <span className="text-sm font-semibold text-slate-800">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-5">
            {stats.map((s, i) => (
              <div key={s.label} className={`card p-5 animate-fade-in-up`} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{s.label}</p>
                    <p className="text-3xl font-display font-bold text-slate-900 mt-1">{s.value}</p>
                  </div>
                  <div className={`w-11 h-11 ${s.accent} rounded-xl flex items-center justify-center shadow-md`}>
                    <s.icon className="text-white" size={20} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Patient Queue */}
            <div className="col-span-5 card p-0 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-display font-semibold text-slate-900">Patient Queue</h2>
                <span className="text-xs font-semibold bg-medical-100 text-medical-700 px-2.5 py-1 rounded-full">
                  {queue.filter(q => q.status === 'waiting').length} waiting
                </span>
              </div>
              <div className="divide-y divide-slate-50 max-h-[520px] overflow-y-auto">
                {queue.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActivePatient(p.id)}
                    className={`w-full text-left px-5 py-4 transition-all hover:bg-slate-50 ${
                      activePatient === p.id ? 'bg-medical-50/50 border-l-[3px] border-l-medical-500' : 'border-l-[3px] border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 text-sm">{p.name}</p>
                          {p.status === 'in_progress' && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-health-600 bg-health-50 px-1.5 py-0.5 rounded-full">
                              <Activity size={10} /> ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{p.complaint}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getPriorityStyle(p.priority)}`}>
                          {p.priority}
                        </span>
                        {p.waitTime > 0 && (
                          <span className="text-[10px] text-slate-400">{p.waitTime}m wait</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                      <span>{p.age}{p.gender === 'M' ? 'M' : 'F'}</span>
                      <span>·</span>
                      <span>{p.mrn}</span>
                      <span>·</span>
                      <span className={`font-medium ${p.type === 'IP' ? 'text-medical-600' : p.type === 'OP' ? 'text-health-600' : 'text-alert-600'}`}>
                        {p.type}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Patient Detail Panel */}
            <div className="col-span-7 space-y-5">
              {currentPatient ? (
                <>
                  {/* Patient Header */}
                  <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 gradient-medical rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-medical">
                          {currentPatient.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-xl font-display font-bold text-slate-900">{currentPatient.name}</h3>
                          <p className="text-sm text-slate-500">{currentPatient.age} yrs · {currentPatient.gender === 'M' ? 'Male' : 'Female'} · {currentPatient.mrn}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getPriorityStyle(currentPatient.priority)}`}>
                              {currentPatient.priority}
                            </span>
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-xs text-slate-500">{currentPatient.complaint}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {currentPatient.status === 'waiting' && (
                          <button onClick={handleStartConsultation} className="btn btn-primary text-sm">
                            <Play size={16} /> Start Consultation
                          </button>
                        )}
                        {currentPatient.status === 'in_progress' && (
                          <button onClick={handleCompleteConsultation} className="btn btn-success text-sm">
                            <CheckCircle size={16} /> Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Vitals */}
                  {currentPatient.vitals && (
                    <div className="grid grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                      <div className="card p-4 stat-card-emergency">
                        <div className="flex items-center gap-2 mb-1">
                          <Heart size={14} className="text-emergency-500" />
                          <p className="text-xs font-semibold text-slate-400 uppercase">Blood Pressure</p>
                        </div>
                        <p className="text-2xl font-display font-bold text-slate-900">{currentPatient.vitals.bp}</p>
                        <p className="text-xs text-slate-500">mmHg</p>
                      </div>
                      <div className="card p-4 stat-card-medical">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity size={14} className="text-medical-500" />
                          <p className="text-xs font-semibold text-slate-400 uppercase">Pulse</p>
                        </div>
                        <p className="text-2xl font-display font-bold text-slate-900">{currentPatient.vitals.pulse}</p>
                        <p className="text-xs text-slate-500">bpm</p>
                      </div>
                      <div className="card p-4 stat-card-health">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp size={14} className="text-health-500" />
                          <p className="text-xs font-semibold text-slate-400 uppercase">Temperature</p>
                        </div>
                        <p className="text-2xl font-display font-bold text-slate-900">{currentPatient.vitals.temp}</p>
                        <p className="text-xs text-slate-500">Fahrenheit</p>
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="card p-5 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
                    <h3 className="font-semibold text-slate-900 mb-3">Quick Actions</h3>
                    <div className="grid grid-cols-4 gap-3">
                      <button onClick={handleOrderTests} className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all bg-medical-50 text-medical-600 hover:bg-medical-100 active:scale-95">
                        <ClipboardCheck size={22} />
                        <span className="text-xs font-medium">Order Tests</span>
                      </button>
                      <button onClick={handlePrescribe} className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all bg-health-50 text-health-600 hover:bg-health-100 active:scale-95">
                        <FileText size={22} />
                        <span className="text-xs font-medium">Prescribe</span>
                      </button>
                      <button onClick={handleRefer} className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all bg-alert-50 text-alert-600 hover:bg-alert-100 active:scale-95">
                        <ChevronRight size={22} />
                        <span className="text-xs font-medium">Refer</span>
                      </button>
                      <button onClick={handleNotes} className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all bg-slate-50 text-slate-600 hover:bg-slate-100 active:scale-95">
                        <Stethoscope size={22} />
                        <span className="text-xs font-medium">Notes</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="card p-12 text-center animate-fade-in">
                  <Stethoscope size={48} className="text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700">Select a Patient</h3>
                  <p className="text-sm text-slate-500 mt-1">Choose a patient from the queue to view details</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
