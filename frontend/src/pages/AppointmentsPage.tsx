import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  MapPin,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

interface Appointment {
  id: number;
  patientName: string;
  patientMRN: string;
  time: string;
  department: string;
  doctor: string;
  type: 'OP' | 'IP' | 'HC';
  status: 'confirmed' | 'checked_in' | 'completed' | 'no_show' | 'cancelled';
  phone: string;
}

export default function AppointmentsPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const appointments: Appointment[] = [
    { id: 1, patientName: 'Rajesh Kumar', patientMRN: 'MRN004521', time: '09:00 AM', department: 'Cardiology', doctor: 'Dr. Sharma', type: 'OP', status: 'completed', phone: '+91 98765 43210' },
    { id: 2, patientName: 'Priya Sharma', patientMRN: 'MRN004522', time: '09:30 AM', department: 'General Medicine', doctor: 'Dr. Patel', type: 'OP', status: 'completed', phone: '+91 87654 32109' },
    { id: 3, patientName: 'Mohammed Ali', patientMRN: 'MRN004523', time: '10:00 AM', department: 'Orthopedics', doctor: 'Dr. Gupta', type: 'IP', status: 'checked_in', phone: '+91 76543 21098' },
    { id: 4, patientName: 'Ananya Reddy', patientMRN: 'MRN004524', time: '10:30 AM', department: 'Radiology', doctor: 'Dr. Singh', type: 'HC', status: 'confirmed', phone: '+91 65432 10987' },
    { id: 5, patientName: 'Suresh Patel', patientMRN: 'MRN004525', time: '11:00 AM', department: 'Neurology', doctor: 'Dr. Reddy', type: 'OP', status: 'confirmed', phone: '+91 54321 09876' },
    { id: 6, patientName: 'Deepa Nair', patientMRN: 'MRN004526', time: '11:30 AM', department: 'Cardiology', doctor: 'Dr. Sharma', type: 'OP', status: 'no_show', phone: '+91 43210 98765' },
    { id: 7, patientName: 'Vikram Rao', patientMRN: 'MRN004527', time: '12:00 PM', department: 'General Medicine', doctor: 'Dr. Patel', type: 'HC', status: 'confirmed', phone: '+91 32109 87654' },
    { id: 8, patientName: 'Kavita Singh', patientMRN: 'MRN004528', time: '12:30 PM', department: 'Laboratory', doctor: 'Dr. Kumar', type: 'HC', status: 'cancelled', phone: '+91 21098 76543' },
  ];

  const stats = [
    { label: 'Total Today', value: appointments.length, icon: Calendar, color: 'medical' },
    { label: 'Checked In', value: appointments.filter(a => a.status === 'checked_in').length, icon: CheckCircle, color: 'health' },
    { label: 'Confirmed', value: appointments.filter(a => a.status === 'confirmed').length, icon: Clock, color: 'alert' },
    { label: 'No Shows', value: appointments.filter(a => a.status === 'no_show').length, icon: XCircle, color: 'emergency' },
  ];

  const statusFilters = ['all', 'confirmed', 'checked_in', 'completed', 'no_show', 'cancelled'];

  const filteredAppointments = appointments.filter(a => {
    const matchesSearch = a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.patientMRN.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || a.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-medical-100 text-medical-700 border border-medical-200';
      case 'checked_in': return 'bg-health-100 text-health-700 border border-health-200';
      case 'completed': return 'bg-slate-100 text-slate-600 border border-slate-200';
      case 'no_show': return 'bg-emergency-100 text-emergency-700 border border-emergency-200';
      case 'cancelled': return 'bg-slate-100 text-slate-400 border border-slate-200';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar role="receptionist" />
      <div className="ml-[264px] transition-all duration-300">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900">Today's Appointments</h1>
              <p className="text-sm text-slate-500">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search patient..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent w-56 text-sm"
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
        </header>

        <main className="p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-5">
            {stats.map((s, i) => (
              <div key={s.label} className={`card p-5 stat-card-${s.color} animate-fade-in-up`} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{s.label}</p>
                    <p className="text-3xl font-display font-bold text-slate-900 mt-1">{s.value}</p>
                  </div>
                  <div className={`w-11 h-11 bg-${s.color}-500 rounded-xl flex items-center justify-center shadow-md`}>
                    <s.icon className="text-white" size={20} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Filter size={16} className="text-slate-400" />
            {statusFilters.map(f => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterStatus === f
                    ? 'bg-medical-500 text-white shadow-medical'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-medical-300'
                }`}
              >
                {f === 'all' ? 'All' : getStatusLabel(f)}
              </button>
            ))}
          </div>

          {/* Appointments Table */}
          <div className="card p-0 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <table className="w-full table-modern">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Department</th>
                  <th>Doctor</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <span className="font-semibold text-slate-900">{a.time}</span>
                    </td>
                    <td>
                      <div>
                        <p className="font-semibold text-slate-900">{a.patientName}</p>
                        <p className="text-xs text-slate-500">{a.patientMRN}</p>
                      </div>
                    </td>
                    <td className="text-slate-600">{a.department}</td>
                    <td className="text-slate-600">{a.doctor}</td>
                    <td>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        a.type === 'IP' ? 'bg-medical-100 text-medical-700' :
                        a.type === 'OP' ? 'bg-health-100 text-health-700' :
                        'bg-alert-100 text-alert-700'
                      }`}>
                        {a.type}
                      </span>
                    </td>
                    <td>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadge(a.status)}`}>
                        {getStatusLabel(a.status)}
                      </span>
                    </td>
                    <td>
                      {a.status === 'confirmed' && (
                        <button className="btn btn-primary text-xs py-1.5 px-3">Check In</button>
                      )}
                      {a.status === 'no_show' && (
                        <button className="btn btn-ghost text-xs py-1.5 px-3">
                          <Phone size={12} /> Call
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAppointments.length === 0 && (
              <div className="py-12 text-center">
                <Calendar size={40} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No appointments match your filter</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
