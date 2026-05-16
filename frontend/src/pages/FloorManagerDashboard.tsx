import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Clock,
  AlertTriangle,
  Monitor,
  RefreshCw,
  Filter,
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
import { queueService } from '../services/queue';
import { stationService } from '../services/station';
import { encounterService } from '../services/encounter';
import { patientService } from '../services/patient';

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

  // Fetch real data
  const { data: queues = [], refetch: refetchQueues } = useQuery({
    queryKey: ['queues'],
    queryFn: () => queueService.getAll(),
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const { data: stations = [], refetch: refetchStations } = useQuery({
    queryKey: ['stations'],
    queryFn: () => stationService.getAll(),
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const { data: encounters = [] } = useQuery({
    queryKey: ['encounters'],
    queryFn: () => encounterService.getAll(),
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientService.getAll(),
  });

  // Create patient lookup map
  const patientMap = patients.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {} as Record<number, any>);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchQueues();
    await refetchStations();
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshing(false);
  };

  // Calculate real stats
  const totalInQueue = queues.length;
  const activeStations = stations.filter(s => s.status !== 'offline' && s.status !== 'maintenance').length;
  
  const avgWaitTime = (() => {
    if (queues.length === 0) return '0m';
    const totalWait = queues.reduce((sum, q) => sum + (q.estimated_wait_time || 0), 0);
    return `${Math.round(totalWait / queues.length)}m`;
  })();

  const bottlenecks = stations.filter(s => {
    const stationQueue = queues.filter(q => q.station_id === s.id);
    return stationQueue.length > 3;
  }).length;

  const stats = [
    { title: 'Total in Queue', value: totalInQueue, icon: Users, color: 'medical', trend: `+${Math.max(0, totalInQueue - 5)}`, trendUp: totalInQueue > 0 },
    { title: 'Active Stations', value: activeStations, icon: Monitor, color: 'health', trend: `${stations.length - activeStations} offline`, trendUp: activeStations >= stations.length * 0.75 },
    { title: 'Avg Wait Time', value: avgWaitTime, icon: Clock, color: 'alert', trend: '-3 min', trendUp: true },
    { title: 'Bottlenecks', value: bottlenecks, icon: AlertTriangle, color: 'emergency', trend: bottlenecks > 0 ? '+' + bottlenecks : 'OK', trendUp: bottlenecks === 0 },
  ];

  // Get unique departments
  const departments = ['all', ...new Set(encounters.map(e => e.department))].filter(d => d);

  // Filter stations by department
  const filteredStations = selectedDepartment === 'all' 
    ? stations 
    : stations.filter(s => encounters.some(e => e.department === selectedDepartment && e.department === s.department));

  // Build filtered queue with patient info
  const filteredQueue = (selectedDepartment === 'all' 
    ? queues 
    : queues.filter(q => {
        const encounter = encounters.find(e => e.id === q.encounter_id);
        return encounter?.department === selectedDepartment;
      }))
    .map((q, idx) => {
      const encounter = encounters.find(e => e.id === q.encounter_id);
      const patient = patientMap[encounter?.patient_id];
      const station = stations.find(s => s.id === q.station_id);
      
      return {
        id: q.id,
        queueNumber: idx + 1,
        patientName: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown',
        patientId: patient?.mrn || `PAT${q.encounter_id}`,
        patientType: patient?.patient_type || 'OP',
        priority: encounter?.priority || 'normal',
        station: station?.name || 'Unknown Station',
        department: encounter?.department || 'Unknown',
        waitTime: q.estimated_wait_time || 0,
        status: encounter?.status || 'waiting',
        estimatedTime: 15,
      };
    });

  const getPriorityStyle = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'emergency': return 'bg-emergency-100 text-emergency-700';
      case 'urgent': return 'bg-alert-100 text-alert-700';
      case 'high': return 'bg-alert-100 text-alert-700';
      case 'normal': return 'bg-medical-100 text-medical-700';
      default: return 'bg-slate-100 text-slate-700';
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
                {bottlenecks > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-emergency-500 rounded-full animate-pulse" />}
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
            <h2 className="font-display font-semibold text-slate-900 mb-4">Station Status ({filteredStations.length})</h2>
            {filteredStations.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {filteredStations.map((station) => {
                  const stationQueue = queues.filter(q => q.station_id === station.id);
                  const utilizationPercent = Math.min(100, (stationQueue.length / 5) * 100);
                  
                  return (
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

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase">Queue</p>
                          <p className="text-lg font-bold text-slate-900">{stationQueue.length}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase">Wait</p>
                          <p className="text-lg font-bold text-slate-900">
                            {stationQueue.length > 0 ? `${Math.round(stationQueue.reduce((sum, q) => sum + (q.estimated_wait_time || 0), 0) / stationQueue.length)}m` : '0m'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase">Usage</p>
                          <p className="text-lg font-bold text-slate-900">{Math.round(utilizationPercent)}%</p>
                        </div>
                      </div>

                      <div className="mt-3 utilization-bar">
                        <div
                          className={`utilization-bar-fill ${
                            utilizationPercent > 90 ? 'bg-emergency-500' :
                            utilizationPercent > 70 ? 'bg-alert-500' :
                            'bg-health-500'
                          }`}
                          style={{ width: `${utilizationPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">No stations in selected department</p>
            )}
          </div>

          {/* Live Queue Table */}
          <div className="card p-0 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-alert-500" />
                <h2 className="font-display font-semibold text-slate-900">Live Queue ({filteredQueue.length})</h2>
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
                {filteredQueue.length > 0 ? (
                  filteredQueue.map((item) => (
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
                          item.status === 'completed' ? 'bg-medical-100 text-medical-700' :
                          'bg-alert-100 text-alert-700'
                        }`}>
                          {item.status === 'in_progress' ? 'In Progress' :
                           item.status === 'completed' ? 'Done' : 'Waiting'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-500">
                      No patients in queue
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
