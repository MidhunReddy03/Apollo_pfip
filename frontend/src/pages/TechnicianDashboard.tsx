import { useState, useEffect } from 'react';
import {
  Monitor,
  Users,
  Clock,
  CheckCircle,
  Play,
  AlertTriangle,
  Activity,
  Pause,
  XCircle,
  RefreshCw,
  Zap,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store';

interface QueuePatient {
  id: number;
  name: string;
  mrn: string;
  type: 'IP' | 'OP' | 'HC';
  priority: 'emergency' | 'urgent' | 'high' | 'normal' | 'low';
  waitTime: number;
  test: string;
  status: 'waiting' | 'in_progress' | 'completed';
}

export default function TechnicianDashboard() {
  const user = useAuthStore((s) => s.user);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stationStatus, setStationStatus] = useState<'available' | 'occupied' | 'maintenance'>('occupied');

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const myStation = {
    name: 'X-Ray Room 1',
    department: 'Radiology',
    equipment: 'Digital X-Ray Machine — GE Revolution',
    currentPatient: 'Priya Sharma',
    currentMRN: 'MRN004522',
    currentTest: 'Chest X-Ray (PA View)',
    startedAt: '10:32 AM',
    estimatedDuration: 15,
    elapsed: 8,
  };

  const queue: QueuePatient[] = [
    { id: 1, name: 'Mohammed Ali', mrn: 'MRN004523', type: 'IP', priority: 'urgent', waitTime: 12, test: 'Lumbar Spine X-Ray', status: 'waiting' },
    { id: 2, name: 'Ananya Reddy', mrn: 'MRN004524', type: 'HC', priority: 'normal', waitTime: 18, test: 'Chest X-Ray (AP)', status: 'waiting' },
    { id: 3, name: 'Suresh Patel', mrn: 'MRN004525', type: 'OP', priority: 'high', waitTime: 22, test: 'Knee X-Ray (Both)', status: 'waiting' },
    { id: 4, name: 'Deepa Nair', mrn: 'MRN004526', type: 'OP', priority: 'normal', waitTime: 28, test: 'Hand X-Ray (Left)', status: 'waiting' },
  ];

  const completedToday = [
    { name: 'Rajesh Kumar', test: 'Chest X-Ray', time: '09:15 AM' },
    { name: 'Kavita Singh', test: 'Spine X-Ray', time: '09:42 AM' },
    { name: 'Arun Mehta', test: 'Ankle X-Ray', time: '10:05 AM' },
  ];

  const progressPercent = Math.min((myStation.elapsed / myStation.estimatedDuration) * 100, 100);

  const getPriorityStyle = (p: string) => {
    switch (p) {
      case 'emergency': return 'priority-emergency';
      case 'urgent': return 'priority-urgent';
      case 'high': return 'priority-high';
      case 'normal': return 'priority-normal';
      default: return 'priority-low';
    }
  };

  const getStatusColor = () => {
    switch (stationStatus) {
      case 'available': return 'bg-health-500';
      case 'occupied': return 'bg-alert-500';
      case 'maintenance': return 'bg-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar role="technician" />
      <div className="ml-[264px] transition-all duration-300">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900">Technician Dashboard</h1>
              <p className="text-sm text-slate-500">{myStation.name} — {myStation.department}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                stationStatus === 'available' ? 'bg-health-50 text-health-700' :
                stationStatus === 'occupied' ? 'bg-alert-50 text-alert-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()} ${stationStatus === 'occupied' ? 'animate-pulse' : ''}`} />
                <span className="text-sm font-semibold capitalize">{stationStatus}</span>
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
          {/* Current Service Card */}
          {stationStatus === 'occupied' && (
            <div className="card p-6 border-l-4 border-l-alert-500 animate-fade-in-up">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Activity size={16} className="text-alert-500 animate-pulse" />
                    <p className="text-xs font-bold uppercase text-alert-600 tracking-wider">Currently Serving</p>
                  </div>
                  <h2 className="text-xl font-display font-bold text-slate-900">{myStation.currentPatient}</h2>
                  <p className="text-sm text-slate-500">{myStation.currentMRN} · {myStation.currentTest}</p>
                  <p className="text-xs text-slate-400 mt-1">Started at {myStation.startedAt}</p>
                </div>
                <div className="flex gap-3">
                  <button className="btn btn-success">
                    <CheckCircle size={16} /> Complete
                  </button>
                  <button className="btn btn-ghost">
                    <Pause size={16} /> Pause
                  </button>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span>{myStation.elapsed} min elapsed</span>
                  <span>~{myStation.estimatedDuration - myStation.elapsed} min remaining</span>
                </div>
                <div className="utilization-bar">
                  <div
                    className="utilization-bar-fill bg-gradient-to-r from-alert-400 to-alert-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-12 gap-6">
            {/* Upcoming Queue */}
            <div className="col-span-7 card p-0 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-medical-500" />
                  <h2 className="font-display font-semibold text-slate-900">Upcoming Patients</h2>
                </div>
                <span className="text-xs font-semibold bg-medical-100 text-medical-700 px-2.5 py-1 rounded-full">
                  {queue.length} in queue
                </span>
              </div>
              <div className="divide-y divide-slate-50">
                {queue.map((p, i) => (
                  <div key={p.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 bg-medical-100 text-medical-700 rounded-full flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-slate-900">{p.name}</p>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${getPriorityStyle(p.priority)}`}>
                          {p.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{p.test}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${p.waitTime > 20 ? 'text-emergency-600' : p.waitTime > 10 ? 'text-alert-600' : 'text-health-600'}`}>
                        {p.waitTime}m
                      </p>
                      <p className="text-[10px] text-slate-400">waiting</p>
                    </div>
                    {i === 0 && (
                      <button className="btn btn-primary text-xs py-2 px-3">
                        <Play size={14} /> Call
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Side Panel */}
            <div className="col-span-5 space-y-5">
              {/* Station Info */}
              <div className="card p-5 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 gradient-medical rounded-xl flex items-center justify-center">
                    <Monitor size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{myStation.name}</h3>
                    <p className="text-xs text-slate-500">{myStation.equipment}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setStationStatus('available')}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      stationStatus === 'available' ? 'border-health-500 bg-health-50' : 'border-slate-200 hover:border-health-300'
                    }`}
                  >
                    <CheckCircle size={18} className="mx-auto text-health-500 mb-1" />
                    <p className="text-xs font-semibold text-slate-700">Available</p>
                  </button>
                  <button
                    onClick={() => setStationStatus('maintenance')}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      stationStatus === 'maintenance' ? 'border-slate-500 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Pause size={18} className="mx-auto text-slate-500 mb-1" />
                    <p className="text-xs font-semibold text-slate-700">Maintenance</p>
                  </button>
                </div>
              </div>

              {/* Completed Today */}
              <div className="card p-5 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle size={16} className="text-health-500" />
                  Completed Today
                </h3>
                <div className="space-y-3">
                  {completedToday.map((c, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.test}</p>
                      </div>
                      <span className="text-xs text-slate-400">{c.time}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                  <p className="text-2xl font-display font-bold text-health-600">{completedToday.length}</p>
                  <p className="text-xs text-slate-500">procedures completed</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
