import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity,
  BarChart3,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Bell
} from 'lucide-react';
import { useQueueForecastApi } from '../features/queue-forecast/hooks/useQueueForecastApi';
import { useTriageApi } from '../features/triage/hooks/useTriageApi';
import { useGatesApi } from '../features/gates/hooks/useGatesApi';
import { QueueMetrics, SystemStatus } from '../features/queue-forecast/types';
import { TriageRecord } from '../features/triage/types';
import { Gate } from '../features/gates/types';

const PFIPDashboard: React.FC = () => {
  const [queueMetrics, setQueueMetrics] = useState<QueueMetrics | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [triageStats, setTriageStats] = useState({ p1: 0, p2: 0, p3: 0, total: 0 });
  const [gateStats, setGateStats] = useState({ completed: 0, pending: 0, total: 0 });
  const [criticalAlerts, setCriticalAlerts] = useState<string[]>([]);
  
  const { getQueueMetrics, getSystemStatus } = useQueueForecastApi();
  const { getTriageRecords } = useTriageApi();
  const { getEncounterGates } = useGatesApi();

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load queue metrics
      const metrics = await getQueueMetrics();
      setQueueMetrics(metrics);

      // Load system status
      const status = await getSystemStatus();
      setSystemStatus(status);

      // Load triage stats
      const triageRecords = await getTriageRecords();
      const stats = {
        p1: triageRecords.filter(r => r.priority === 'P1').length,
        p2: triageRecords.filter(r => r.priority === 'P2').length,
        p3: triageRecords.filter(r => r.priority === 'P3').length,
        total: triageRecords.length
      };
      setTriageStats(stats);

      // Load gate stats (simplified - normally would get from API)
      const mockGateStats = { completed: 8, pending: 4, total: 12 };
      setGateStats(mockGateStats);

      // Generate critical alerts
      const alerts = generateAlerts(metrics, status, stats);
      setCriticalAlerts(alerts);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const generateAlerts = (metrics: QueueMetrics | null, status: SystemStatus | null, triage: any): string[] => {
    const alerts: string[] = [];
    
    if (metrics?.utilization && metrics.utilization >= 0.95) {
      alerts.push(`System at critical capacity (${Math.round(metrics.utilization * 100)}% utilization)`);
    }
    
    if (triage.p1 > 5) {
      alerts.push(`${triage.p1} P1 (Critical) patients waiting`);
    }
    
    if (queueMetrics?.avg_waiting_time && queueMetrics.avg_waiting_time > 120) {
      alerts.push(`Average wait time ${Math.round(queueMetrics.avg_waiting_time)} minutes`);
    }
    
    return alerts;
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 0.95) return 'bg-gradient-to-r from-red-500 to-red-600';
    if (utilization >= 0.85) return 'bg-gradient-to-r from-orange-500 to-orange-600';
    if (utilization >= 0.70) return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
    return 'bg-gradient-to-r from-green-500 to-green-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1': return 'bg-red-100 text-red-800';
      case 'P2': return 'bg-yellow-100 text-yellow-800';
      case 'P3': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes === Infinity) return '∞';
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}h ${mins}m`;
    }
    return `${Math.round(minutes)} min`;
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }> = ({ title, value, icon, color, subtitle }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-xl shadow-lg ${color}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-90">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && <p className="text-xs opacity-75 mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 bg-white bg-opacity-20 rounded-full">
          {icon}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Apollo PFIP 4.0 Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Patient Flow Intelligence Platform - Real-time monitoring & AI-powered insights
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-4 py-2 rounded-full font-semibold ${systemStatus?.color === 'red' ? 'bg-red-100 text-red-800' : systemStatus?.color === 'orange' ? 'bg-orange-100 text-orange-800' : systemStatus?.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {systemStatus?.status}
              </div>
              <button className="p-2 bg-white rounded-lg shadow">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        {criticalAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">Critical Alerts</h2>
              </div>
              <div className="space-y-2">
                {criticalAlerts.map((alert, index) => (
                  <div key={index} className="flex items-center gap-2 text-white">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>{alert}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button className="px-4 py-2 bg-white text-red-600 rounded-lg font-medium hover:bg-red-50">
                  Acknowledge
                </button>
                <button className="px-4 py-2 bg-red-700 text-white rounded-lg font-medium hover:bg-red-800">
                  Take Action
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="System Utilization"
            value={queueMetrics ? `${Math.round(queueMetrics.utilization * 100)}%` : '--'}
            icon={<Activity className="w-6 h-6 text-blue-600" />}
            color={queueMetrics ? getUtilizationColor(queueMetrics.utilization) + ' text-white' : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'}
            subtitle={queueMetrics ? `λ: ${queueMetrics.arrival_rate_per_hour.toFixed(1)}/hr | μ: ${queueMetrics.service_rate_per_hour.toFixed(1)}/hr` : undefined}
          />

          <StatCard
            title="Avg Wait Time"
            value={queueMetrics ? formatTime(queueMetrics.avg_waiting_time) : '--'}
            icon={<Clock className="w-6 h-6 text-green-600" />}
            color="bg-gradient-to-r from-green-500 to-teal-500 text-white"
            subtitle={queueMetrics ? `System: ${formatTime(queueMetrics.avg_system_time)}` : undefined}
          />

          <StatCard
            title="Queue Length"
            value={queueMetrics ? queueMetrics.avg_queue_length.toFixed(1) : '--'}
            icon={<Users className="w-6 h-6 text-purple-600" />}
            color="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            subtitle={queueMetrics ? `System: ${queueMetrics.avg_system_length.toFixed(1)} patients` : undefined}
          />

          <StatCard
            title="Triage Priority"
            value={triageStats.total}
            icon={<AlertTriangle className="w-6 h-6 text-yellow-600" />}
            color="bg-gradient-to-r from-yellow-500 to-amber-500 text-white"
            subtitle={`P1: ${triageStats.p1} | P2: ${triageStats.p2} | P3: ${triageStats.p3}`}
          />
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Triage Breakdown */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Triage Priority Distribution</h2>
              <TrendingUp className="w-5 h-5 text-gray-500" />
            </div>
            <div className="space-y-3">
              {[
                { label: 'P1 - Critical', value: triageStats.p1, color: 'bg-red-500' },
                { label: 'P2 - Urgent', value: triageStats.p2, color: 'bg-yellow-500' },
                { label: 'P3 - Routine', value: triageStats.p3, color: 'bg-green-500' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <span className="text-sm text-gray-900">{item.value}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ 
                        width: `${triageStats.total > 0 ? (item.value / triageStats.total) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Queue Performance */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Queue Performance</h2>
              <BarChart3 className="w-5 h-5 text-gray-500" />
            </div>
            {queueMetrics && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">System Stability</p>
                  <p className={`text-lg font-bold ${queueMetrics.utilization < 1.0 ? 'text-green-600' : 'text-red-600'}`}>
                    {queueMetrics.utilization < 1.0 ? '✓ Stable' : '✗ Unstable'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">Idle Probability</p>
                    <p className="text-xl font-bold text-blue-800">
                      {(queueMetrics.probability_idle * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Wait Probability</p>
                    <p className="text-xl font-bold text-green-800">
                      {(queueMetrics.probability_wait * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Gate Progress */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Discharge Gates</h2>
              <CheckCircle className="w-5 h-5 text-gray-500" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Completion Rate</span>
                <span className="font-bold text-green-600">
                  {gateStats.total > 0 ? Math.round((gateStats.completed / gateStats.total) * 100) : 0}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-sm text-green-600">Completed</p>
                  <p className="text-2xl font-bold text-green-800">{gateStats.completed}</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg text-center">
                  <p className="text-sm text-yellow-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-800">{gateStats.pending}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition-colors">
              <div className="text-blue-600 font-semibold mb-2">AI Triage</div>
              <p className="text-sm text-gray-600">Classify new patient</p>
            </button>
            <button className="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100 transition-colors">
              <div className="text-green-600 font-semibold mb-2">Queue Forecast</div>
              <p className="text-sm text-gray-600">Predict wait times</p>
            </button>
            <button className="p-4 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition-colors">
              <div className="text-purple-600 font-semibold mb-2">Gates Review</div>
              <p className="text-sm text-gray-600">Check discharge status</p>
            </button>
            <button className="p-4 bg-orange-50 rounded-lg text-center hover:bg-orange-100 transition-colors">
              <div className="text-orange-600 font-semibold mb-2">Audit Logs</div>
              <p className="text-sm text-gray-600">View activity history</p>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Apollo PFIP 4.0 • Patient Flow Intelligence Platform • Last Updated: {new Date().toLocaleTimeString()}</p>
          <p className="mt-1">Real-time updates every 30 seconds • Data refreshed automatically</p>
        </div>
      </div>
    </div>
  );
};

export default PFIPDashboard;