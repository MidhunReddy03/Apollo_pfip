import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Users,
  ClipboardCheck,
  Clock,
  Search,
  Activity,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store';

export default function ReceptionistDashboard() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = [
    { title: "Today's Registrations", value: 45, icon: UserPlus, color: 'medical', change: '+12%', up: true },
    { title: 'Checked In', value: 38, icon: ClipboardCheck, color: 'health', change: '+8%', up: true },
    { title: 'In Queue', value: 23, icon: Users, color: 'alert', change: '-5%', up: true },
    { title: 'Avg Wait Time', value: '15m', icon: Clock, color: 'emergency', change: '-10%', up: true },
  ];

  const recentPatients = [
    { id: 1, name: 'Rajesh Kumar', mrn: 'MRN004521', type: 'OP', time: '10:30 AM', status: 'Checked In', priority: 'normal' },
    { id: 2, name: 'Priya Sharma', mrn: 'MRN004522', type: 'IP', time: '10:45 AM', status: 'In Queue', priority: 'urgent' },
    { id: 3, name: 'Mohammed Ali', mrn: 'MRN004523', type: 'HC', time: '11:00 AM', status: 'Registered', priority: 'normal' },
    { id: 4, name: 'Ananya Reddy', mrn: 'MRN004524', type: 'OP', time: '11:15 AM', status: 'Checked In', priority: 'high' },
    { id: 5, name: 'Suresh Patel', mrn: 'MRN004525', type: 'OP', time: '11:30 AM', status: 'In Queue', priority: 'emergency' },
  ];

  const quickActions = [
    { title: 'Register Patient', description: 'New patient registration', icon: UserPlus, color: 'medical', action: () => navigate('/receptionist/register-patient') },
    { title: 'Quick Check-In', description: 'Check-in existing patient', icon: ClipboardCheck, color: 'health', action: () => navigate('/receptionist/check-in') },
    { title: 'All Patients', description: 'Browse patient records', icon: Users, color: 'alert', action: () => navigate('/receptionist/patients') },
    { title: 'Appointments', description: 'View scheduled visits', icon: Calendar, color: 'medical', action: () => navigate('/receptionist/appointments') },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Checked In': return 'bg-health-100 text-health-700';
      case 'In Queue': return 'bg-alert-100 text-alert-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar role="receptionist" />
      <div className="ml-[264px] transition-all duration-300">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-display font-bold text-slate-900">
                  Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.full_name?.split(' ')[0] || 'Receptionist'}
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent w-64 text-sm bg-white"
                  />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
                  <Clock size={16} className="text-slate-500" />
                  <span className="text-sm font-semibold text-slate-800">
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-8 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-5">
            {stats.map((stat, i) => (
              <div
                key={stat.title}
                className={`card p-5 stat-card-${stat.color} animate-fade-in-up`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.title}</p>
                    <p className="text-3xl font-display font-bold text-slate-900 mt-1">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {stat.up ? <TrendingUp size={14} className="text-health-500" /> : <TrendingDown size={14} className="text-emergency-500" />}
                      <span className={`text-xs font-semibold ${stat.up ? 'text-health-600' : 'text-emergency-600'}`}>{stat.change}</span>
                    </div>
                  </div>
                  <div className={`w-11 h-11 bg-${stat.color}-500 rounded-xl flex items-center justify-center shadow-md`}>
                    <stat.icon className="text-white" size={20} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="font-display font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  onClick={action.action}
                  className="card-interactive p-5 text-left group"
                >
                  <div className={`w-12 h-12 bg-${action.color}-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <action.icon className={`text-${action.color}-600`} size={24} />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm">{action.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{action.description}</p>
                  <ArrowRight size={14} className="text-slate-300 mt-2 group-hover:text-medical-500 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>

          {/* Recent Patients */}
          <div className="card p-0 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-display font-semibold text-slate-900">Recent Patients</h2>
              <button
                onClick={() => navigate('/receptionist/patients')}
                className="text-sm text-medical-600 hover:text-medical-700 font-semibold flex items-center gap-1"
              >
                View All <ArrowRight size={14} />
              </button>
            </div>
            <table className="w-full table-modern">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>MRN</th>
                  <th>Type</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPatients.map((patient) => (
                  <tr key={patient.id}>
                    <td className="font-semibold text-slate-900">{patient.name}</td>
                    <td className="text-slate-500 font-mono text-xs">{patient.mrn}</td>
                    <td>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        patient.type === 'IP' ? 'bg-medical-100 text-medical-700' :
                        patient.type === 'OP' ? 'bg-health-100 text-health-700' :
                        'bg-alert-100 text-alert-700'
                      }`}>
                        {patient.type}
                      </span>
                    </td>
                    <td className="text-slate-500">{patient.time}</td>
                    <td>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadge(patient.status)}`}>
                        {patient.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
