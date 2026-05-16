import { useState, useEffect } from 'react';
import {
  Users,
  Monitor,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Shield,
  Building2,
  Activity,
  BarChart3,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowUpRight,
  Zap,
  Layers,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store';

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const kpis = [
    { label: 'Total Patients Today', value: 247, change: '+18%', up: true, icon: Users, color: 'medical' },
    { label: 'Active Stations', value: '18/22', change: '82%', up: true, icon: Monitor, color: 'health' },
    { label: 'Avg Wait Time', value: '14m', change: '-3m', up: true, icon: Clock, color: 'alert' },
    { label: 'Critical Alerts', value: 3, change: '+1', up: false, icon: AlertTriangle, color: 'emergency' },
  ];

  const departments = [
    { name: 'Radiology', patients: 42, stations: 5, active: 4, avgWait: 18, utilization: 88 },
    { name: 'Cardiology', patients: 28, stations: 3, active: 3, avgWait: 12, utilization: 75 },
    { name: 'Laboratory', patients: 65, stations: 8, active: 7, avgWait: 22, utilization: 92 },
    { name: 'Neurology', patients: 15, stations: 2, active: 2, avgWait: 8, utilization: 65 },
    { name: 'Orthopedics', patients: 35, stations: 4, active: 3, avgWait: 15, utilization: 78 },
  ];

  const staffOnDuty = [
    { name: 'Dr. Sharma', role: 'Cardiologist', status: 'on_duty', patients: 12 },
    { name: 'Dr. Patel', role: 'Radiologist', status: 'on_duty', patients: 8 },
    { name: 'Dr. Gupta', role: 'Neurologist', status: 'on_break', patients: 6 },
    { name: 'Tech. Ravi', role: 'X-Ray Tech', status: 'on_duty', patients: 15 },
    { name: 'Tech. Meera', role: 'Lab Tech', status: 'on_duty', patients: 22 },
    { name: 'Rec. Kavita', role: 'Receptionist', status: 'on_duty', patients: 45 },
  ];

  const recentAlerts = [
    { type: 'emergency', message: 'Station CT-01 queue exceeds 30 min threshold', time: '2m ago' },
    { type: 'warning', message: 'Lab Station 3 utilization at 95%', time: '8m ago' },
    { type: 'info', message: 'Dr. Gupta returned from break', time: '12m ago' },
    { type: 'warning', message: 'MRI Room maintenance due in 2 hours', time: '25m ago' },
  ];

  const hourlyData = [18, 35, 52, 48, 61, 55, 42, 38, 45, 52, 47, 39];
  const maxHourly = Math.max(...hourlyData);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar role={user?.role || 'hospital_admin'} />
      <div className="ml-[264px] transition-all duration-300">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900">Hospital Admin</h1>
              <p className="text-sm text-slate-500">Apollo Hospital — Central Branch</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="btn btn-ghost text-sm">
                <RefreshCw size={16} /> Refresh
              </button>
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
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-5">
            {kpis.map((k, i) => (
              <div key={k.label} className={`card p-5 stat-card-${k.color} animate-fade-in-up`} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{k.label}</p>
                    <p className="text-3xl font-display font-bold text-slate-900 mt-1">{k.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {k.up ? <TrendingUp size={14} className="text-health-500" /> : <TrendingDown size={14} className="text-emergency-500" />}
                      <span className={`text-xs font-semibold ${k.up ? 'text-health-600' : 'text-emergency-600'}`}>{k.change}</span>
                      <span className="text-xs text-slate-400">vs yesterday</span>
                    </div>
                  </div>
                  <div className={`w-11 h-11 bg-${k.color}-500 rounded-xl flex items-center justify-center shadow-md`}>
                    <k.icon className="text-white" size={20} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Department Overview */}
            <div className="col-span-8 card p-0 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-medical-500" />
                  <h2 className="font-display font-semibold text-slate-900">Department Overview</h2>
                </div>
              </div>
              <table className="w-full table-modern">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Patients</th>
                    <th>Stations</th>
                    <th>Avg Wait</th>
                    <th>Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((d) => (
                    <tr key={d.name}>
                      <td className="font-semibold text-slate-900">{d.name}</td>
                      <td>
                        <span className="font-semibold">{d.patients}</span>
                      </td>
                      <td>
                        <span className="text-health-600 font-medium">{d.active}</span>
                        <span className="text-slate-400">/{d.stations}</span>
                      </td>
                      <td>
                        <span className={`font-semibold ${d.avgWait > 20 ? 'text-emergency-600' : d.avgWait > 15 ? 'text-alert-600' : 'text-health-600'}`}>
                          {d.avgWait}m
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="utilization-bar flex-1">
                            <div
                              className={`utilization-bar-fill ${
                                d.utilization > 90 ? 'bg-emergency-500' :
                                d.utilization > 75 ? 'bg-alert-500' :
                                'bg-health-500'
                              }`}
                              style={{ width: `${d.utilization}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-600 w-8">{d.utilization}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Alerts */}
            <div className="col-span-4 card p-5 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
              <h2 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Zap size={16} className="text-alert-500" />
                Live Alerts
              </h2>
              <div className="space-y-3">
                {recentAlerts.map((a, i) => (
                  <div key={i} className={`p-3 rounded-xl border ${
                    a.type === 'emergency' ? 'border-emergency-200 bg-emergency-50/50' :
                    a.type === 'warning' ? 'border-alert-200 bg-alert-50/50' :
                    'border-slate-200 bg-slate-50/50'
                  }`}>
                    <div className="flex items-start gap-2">
                      {a.type === 'emergency' ? <AlertTriangle size={14} className="text-emergency-500 mt-0.5 flex-shrink-0" /> :
                       a.type === 'warning' ? <AlertTriangle size={14} className="text-alert-500 mt-0.5 flex-shrink-0" /> :
                       <Activity size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />}
                      <div>
                        <p className="text-xs font-medium text-slate-800">{a.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{a.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Hourly Patient Volume */}
            <div className="col-span-7 card p-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <h2 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-medical-500" />
                Hourly Patient Volume
              </h2>
              <div className="flex items-end gap-2 h-40">
                {hourlyData.map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-medium text-slate-500">{v}</span>
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        v === maxHourly ? 'gradient-medical' : 'bg-medical-200 hover:bg-medical-300'
                      }`}
                      style={{ height: `${(v / maxHourly) * 120}px` }}
                    />
                    <span className="text-[10px] text-slate-400">{8 + i}:00</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff on Duty */}
            <div className="col-span-5 card p-5 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
              <h2 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Shield size={16} className="text-medical-500" />
                Staff On Duty
              </h2>
              <div className="space-y-3">
                {staffOnDuty.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                    <div className="w-8 h-8 gradient-medical rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {s.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{s.name}</p>
                      <p className="text-[11px] text-slate-500">{s.role}</p>
                    </div>
                    <div className="text-right">
                      <div className={`status-dot ${s.status === 'on_duty' ? 'online' : 'busy'} inline-block mr-1`} />
                      <span className="text-xs text-slate-500">{s.patients} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
