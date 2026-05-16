import { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  AlertTriangle,
  Monitor,
  RefreshCw,
  Filter,
  Maximize2,
  Bell,
  CheckCircle,
  XCircle,
  Pause,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store';

interface QueueItem {
  id: number;
  patientName: string;
  patientId: string;
  patientType: 'IP' | 'OP' | 'HC';
  priority: 'emergency' | 'urgent' | 'high' | 'normal' | 'low';
  station: string;
  department: string;
  queueNumber: number;
  waitTime: number;
  status: 'waiting' | 'in_progress' | 'delayed';
  estimatedTime: number;
}

interface StationStatus {
  id: number;
  name: string;
  department: string;
  status: 'available' | 'occupied' | 'maintenance' | 'offline';
  currentPatient: string | null;
  queueLength: number;
  avgWaitTime: number;
  utilization: number;
}

export default function FloorManagerDashboard() {
  const user = useAuthStore((state) => state.user);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => handleRefresh(), 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshing(false);
  };

  const stats = [
    { title: 'Total in Queue', value: 47, icon: Users, color: 'medical', trend: '+5', trendUp: true },
    { title: 'Active Stations', value: 18, icon: Monitor, color: 'health', trend: '2 offline', trendUp: false },
    { title: 'Avg Wait Time', value: '12m', icon: Clock, color: 'alert', trend: '-3 min', trendUp: true },
    { title: 'Bottlenecks', value: 3, icon: AlertTriangle, color: 'emergency', trend: '+1', trendUp: false },
  ];

  const queueData: QueueItem[] = [
    { id: 1, patientName: 'Rajesh Kumar', patientId: 'PAT004521', patientType: 'OP', priority: 'urgent', station: 'X-Ray Room 1', department: 'Radiology', queueNumber: 1, waitTime: 5, status: 'waiting', estimatedTime: 15 },
    { id: 2, patientName: 'Priya Sharma', patientId: 'PAT004522', patientType: 'IP', priority: 'emergency', station: 'ECG Room 2', department: 'Cardiology', queueNumber: 1, waitTime: 2, status: 'in_progress', estimatedTime: 10 },
    { id: 3, patientName: 'Mohammed Ali', patientId: 'PAT004523', patientType: 'HC', priority: 'normal', station: 'Lab Station 3', department: 'Laboratory', queueNumber: 3, waitTime: 18, status: 'delayed', estimatedTime: 20 },
    { id: 4, patientName: 'Ananya Reddy', patientId: 'PAT004524', patientType: 'OP', priority: 'high', station: 'Ultrasound Room 1', department: 'Radiology', queueNumber: 2, waitTime: 8, status: 'waiting', estimatedTime: 12 },
    { id: 5, patientName: 'Suresh Patel', patientId: 'PAT004525', patientType: 'OP', priority: 'normal', station: 'X-Ray Room 1', department: 'Radiology', queueNumber: 3, waitTime: 22, status: 'waiting', estimatedTime: 15 },
  ];

  const stations: StationStatus[] = [
    { id: 1, name: 'X-Ray Room 1', department: 'Radiology', status: 'occupied', currentPatient: 'PAT004521', queueLength: 4, avgWaitTime: 15, utilization: 88 },
    { id: 2, name: 'ECG Room 2', department: 'Cardiology', status: 'occupied', currentPatient: 'PAT004522', queueLength: 2, avgWaitTime: 8, utilization: 70 },
    { id: 3, name: 'Lab Station 3', department: 'Laboratory', status: 'available', currentPatient: null, queueLength: 5, avgWaitTime: 20, utilization: 92 },
    { id: 4, name: 'Ultrasound Room 1', department: 'Radiology', status: 'occupied', currentPatient: 'PAT004524', queueLength: 3, avgWaitTime: 12, utilization: 78 },
    { id: 5, name: 'CT Scan Room', department: 'Radiology', status: 'maintenance', currentPatient: null, queueLength: 0, avgWaitTime: 0, utilization: 0 },
    { id: 6, name: 'MRI Room', department: 'Radiology', status: 'offline', currentPatient: null, queueLength: 0, avgWaitTime: 0, utilization: 0 },
  ];

  const departments = ['all', 'Radiology', 'Cardiology', 'Laboratory', 'Neurology'];

  const filteredStations = selectedDepartment === 'all' ? stations : stations.filter(s => s.department === selectedDepartment);
  const filteredQueue = selectedDepartment === 'all' ? queueData : queueData.filter(q => q.department === selectedDepartment);

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'priority-emergency';
      case 'urgent': return 'priority-urgent';
      case 'high': return 'priority-high';
      case 'normal': return 'priority-normal';
      default: return 'priority-low';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-health-500';
      case 'occupied': return 'bg-alert-500';
      case 'maintenance': return 'bg-medical-500';
      case 'offline': return 'bg-emergency-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle size={14} />;
      case 'occupied': return <Users size={14} />;
      case 'maintenance': return <Pause size={14} />;
      case 'offline': return <XCircle size={14} />;
      default: return <Monitor size={14} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar role="floor_manager" />
      <div className="ml-[264px] transition-all duration-300">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900">Real-Time Queue Monitor</h1>
              <p className="text-sm text-slate-500">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  autoRefresh ? 'bg-health-100 text-health-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
              </button>
              <button onClick={handleRefresh} disabled={refreshing} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <RefreshCw size={18} className={refreshing ? 'animate-spin text-medical-500' : 'text-slate-500'} />
              </button>
              <div className="relative">
                <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <Bell size={18} className="text-slate-500" />
                </button>
                <span className="absolute top-1 right-1 w-2 h-2 bg-emergency-500 rounded-full animate-pulse" />
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
            {stats.map((stat, i) => (
              <div key={stat.title} className={`card p-5 stat-card-${stat.color} animate-fade-in-up`} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.title}</p>
                    <p className="text-3xl font-display font-bold text-slate-900 mt-1">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {stat.trendUp ? <TrendingUp size={14} className="text-health-500" /> : <TrendingDown size={14} className="text-emergency-500" />}
                      <span className={`text-xs font-semibold ${stat.trendUp ? 'text-health-600' : 'text-emergency-600'}`}>{stat.trend}</span>
                    </div>
                  </div>
                  <div className={`w-11 h-11 bg-${stat.color}-500 rounded-xl flex items-center justify-center shadow-md`}>
                    <stat.icon className="text-white" size={20} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <Filter size={16} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-600 mr-1">Department:</span>
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedDepartment === dept
                    ? 'bg-medical-500 text-white shadow-medical'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-medical-300'
                }`}
              >
                {dept === 'all' ? 'All' : dept}
              </button>
            ))}
          </div>

          {/* Station Status Grid */}
          <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="font-display font-semibold text-slate-900 mb-4">Station Status</h2>
            <div className="grid grid-cols-3 gap-4">
              {filteredStations.map((station) => (
                <div key={station.id} className="card-interactive p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">{station.name}</h3>
                      <p className="text-xs text-slate-500">{station.department}</p>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-white text-[10px] font-bold ${getStatusColor(station.status)}`}>
                      {getStatusIcon(station.status)}
                      <span className="capitalize">{station.status}</span>
                    </div>
                  </div>

                  {station.currentPatient && (
                    <div className="mb-3 p-2 bg-medical-50 rounded-lg text-xs">
                      <span className="text-slate-500">Serving: </span>
                      <span className="font-semibold text-slate-800">{station.currentPatient}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Queue</p>
                      <p className="text-lg font-bold text-slate-900">{station.queueLength}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Wait</p>
                      <p className="text-lg font-bold text-slate-900">{station.avgWaitTime}m</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Usage</p>
                      <p className="text-lg font-bold text-slate-900">{station.utilization}%</p>
                    </div>
                  </div>

                  <div className="mt-3 utilization-bar">
                    <div
                      className={`utilization-bar-fill ${
                        station.utilization > 90 ? 'bg-emergency-500' :
                        station.utilization > 70 ? 'bg-alert-500' :
                        'bg-health-500'
                      }`}
                      style={{ width: `${station.utilization}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Queue Table */}
          <div className="card p-0 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-alert-500" />
                <h2 className="font-display font-semibold text-slate-900">Live Queue</h2>
                {autoRefresh && <span className="status-dot online" />}
              </div>
            </div>
            <table className="w-full table-modern">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Patient</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Station</th>
                  <th>Wait Time</th>
                  <th>Est. Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredQueue.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-medical-100 text-medical-700 rounded-full font-bold text-xs">
                        {item.queueNumber}
                      </span>
                    </td>
                    <td>
                      <p className="font-semibold text-slate-900 text-sm">{item.patientName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{item.patientId}</p>
                    </td>
                    <td>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.patientType === 'IP' ? 'bg-medical-100 text-medical-700' :
                        item.patientType === 'OP' ? 'bg-health-100 text-health-700' :
                        'bg-alert-100 text-alert-700'
                      }`}>
                        {item.patientType}
                      </span>
                    </td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getPriorityStyle(item.priority)}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td>
                      <p className="text-sm font-medium text-slate-800">{item.station}</p>
                      <p className="text-[10px] text-slate-400">{item.department}</p>
                    </td>
                    <td>
                      <span className={`font-semibold ${
                        item.waitTime > 15 ? 'text-emergency-600' :
                        item.waitTime > 10 ? 'text-alert-600' :
                        'text-health-600'
                      }`}>
                        {item.waitTime}m
                      </span>
                    </td>
                    <td className="text-slate-500">{item.estimatedTime}m</td>
                    <td>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'in_progress' ? 'bg-health-100 text-health-700' :
                        item.status === 'delayed' ? 'bg-emergency-100 text-emergency-700' :
                        'bg-alert-100 text-alert-700'
                      }`}>
                        {item.status === 'in_progress' ? 'In Progress' :
                         item.status === 'delayed' ? 'Delayed' : 'Waiting'}
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
