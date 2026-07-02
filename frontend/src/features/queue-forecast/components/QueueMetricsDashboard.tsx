import React, { useState, useEffect } from 'react';
import { QueueMetrics } from '../types';
import { useQueueForecastApi } from '../hooks/useQueueForecastApi';

const QueueMetricsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<QueueMetrics | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { getQueueMetrics, getSystemStatus } = useQueueForecastApi();

  useEffect(() => {
    loadMetrics();
  }, [departmentFilter]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await getQueueMetrics(departmentFilter || undefined);
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load queue metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 0.95) return 'text-red-600 bg-red-50 border-red-200';
    if (utilization >= 0.85) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (utilization >= 0.70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getSystemStatusColor = (status: string) => {
    switch (status) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MODERATE': return 'bg-yellow-100 text-yellow-800';
      case 'NORMAL': return 'bg-green-100 text-green-800';
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

  if (loading && !metrics) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📊</div>
        <p className="text-gray-500 text-lg">No queue metrics available</p>
        <p className="text-gray-400">Queue data will appear as patients arrive</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Queue Forecasting Dashboard</h1>
              <p className="text-gray-600 mt-2">M/M/1 Queue Theory Analysis & Wait Time Predictions</p>
            </div>
            <div className="flex gap-4">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-white"
              >
                <option value="">All Departments</option>
                <option value="Emergency">Emergency</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="General Medicine">General Medicine</option>
              </select>
              <button
                onClick={loadMetrics}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* System Overview Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-lg shadow border ${getUtilizationColor(metrics.utilization)}`}>
            <div className="flex items-center">
              <div className="mr-4 text-3xl">📈</div>
              <div>
                <p className="text-sm opacity-75">System Utilization (ρ)</p>
                <p className="text-3xl font-bold">{Math.round(metrics.utilization * 100)}%</p>
                <p className="text-sm mt-1">
                  λ: {metrics.arrival_rate_per_hour.toFixed(1)}/hr • 
                  μ: {metrics.service_rate_per_hour.toFixed(1)}/hr
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${
                    metrics.utilization >= 0.95 ? 'bg-red-600' :
                    metrics.utilization >= 0.85 ? 'bg-orange-600' :
                    metrics.utilization >= 0.70 ? 'bg-yellow-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(metrics.utilization * 100, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className={metrics.utilization < 0.7 ? 'font-semibold' : ''}>Optimal ({metrics.utilization < 0.7 ? '✓' : ''})</span>
                <span className={metrics.utilization >= 0.7 && metrics.utilization < 0.95 ? 'font-semibold' : ''}>
                  {metrics.utilization >= 0.7 && metrics.utilization < 0.95 ? '⚠️ Monitor' : ''}
                </span>
                <span className={metrics.utilization >= 0.95 ? 'font-semibold' : ''}>
                  {metrics.utilization >= 0.95 ? '🚨 Critical' : ''}
                </span>
              </div>
              <p className={`text-sm mt-3 ${metrics.utilization >= 0.95 ? 'text-red-600' : metrics.utilization >= 0.85 ? 'text-orange-600' : ''}`}>
                {metrics.utilization >= 1.0 ? 'System unstable - infinite queue forming' :
                 metrics.utilization >= 0.95 ? 'Critical utilization - consider diversion' :
                 metrics.utilization >= 0.85 ? 'High utilization - expect delays' :
                 metrics.utilization >= 0.70 ? 'Moderate utilization - monitor closely' :
                 'System operating within capacity'}
              </p>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow border">
            <div className="flex items-center">
              <div className="mr-4 text-3xl">⏱️</div>
              <div>
                <p className="text-sm text-gray-500">Average Wait Time</p>
                <p className="text-3xl font-bold">{formatTime(metrics.avg_waiting_time)}</p>
                <p className="text-sm text-gray-500 mt-1">
                  System Time: {formatTime(metrics.avg_system_time)} (wait + service)
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {metrics.avg_waiting_time > 120 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-700">
                    🚨 Excessive wait times! Consider adding temporary staff.
                  </p>
                </div>
              )}
              {metrics.avg_waiting_time > 60 && metrics.avg_waiting_time <= 120 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-700">
                    ⚠️ Long wait times. Prepare for patient dissatisfaction.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow border">
            <div className="flex items-center">
              <div className="mr-4 text-3xl">👥</div>
              <div>
                <p className="text-sm text-gray-500">Queue Statistics</p>
                <p className="text-3xl font-bold">{metrics.avg_queue_length.toFixed(1)}</p>
                <p className="text-sm text-gray-500 mt-1">
                  System Length: {metrics.avg_system_length.toFixed(1)} patients
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Probability patient waits</p>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${metrics.probability_wait * 100}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 font-semibold">
                    {(metrics.probability_wait * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">System idle probability</p>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${metrics.probability_idle * 100}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 font-semibold">
                    {(metrics.probability_idle * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Queue Theory Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-6">M/M/1 Queue Theory Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-4 text-gray-700">Queue Parameters</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Arrival Rate (λ)</span>
                  <span className="font-mono font-bold">{metrics.arrival_rate_per_hour.toFixed(2)} patients/hour</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Rate (μ)</span>
                  <span className="font-mono font-bold">{metrics.service_rate_per_hour.toFixed(2)} patients/hour</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Utilization (ρ = λ/μ)</span>
                  <span className="font-mono font-bold">{metrics.utilization.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">System Stability</span>
                  <span className={metrics.utilization < 1.0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {metrics.utilization < 1.0 ? '✓ Stable' : '✗ Unstable'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-gray-700">Performance Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Waiting Time (Wq)</span>
                  <span className="font-mono font-bold">{formatTime(metrics.avg_waiting_time)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average System Time (W)</span>
                  <span className="font-mono font-bold">{formatTime(metrics.avg_system_time)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Queue Length (Lq)</span>
                  <span className="font-mono font-bold">{metrics.avg_queue_length.toFixed(2)} patients</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average System Length (L)</span>
                  <span className="font-mono font-bold">{metrics.avg_system_length.toFixed(2)} patients</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Predictions and Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold mb-4 text-gray-800">Immediate Predictions</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                <span>Next 1 hour arrival estimate</span>
                <span className="font-bold">{(metrics.arrival_rate_per_hour).toFixed(0)} patients</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                <span>Next 1 hour service capacity</span>
                <span className="font-bold">{(metrics.service_rate_per_hour).toFixed(0)} patients</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                <span>Current queue clearance time</span>
                <span className="font-bold">{formatTime(metrics.avg_queue_length * (60 / metrics.service_rate_per_hour))}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold mb-4 text-gray-800">Operational Recommendations</h3>
            <div className="space-y-3">
              {metrics.utilization >= 0.95 && (
                <div className="p-3 bg-red-100 border-l-4 border-red-500">
                  <p className="font-semibold text-red-800">🚨 Critical Alert</p>
                  <p className="text-sm text-red-700 mt-1">
                    System at capacity. Consider: 1) Patient diversion, 2) Temporary staff, 3) Extended hours
                  </p>
                </div>
              )}
              {metrics.utilization >= 0.85 && metrics.utilization < 0.95 && (
                <div className="p-3 bg-orange-100 border-l-4 border-orange-500">
                  <p className="font-semibold text-orange-800">⚠️ High Alert</p>
                  <p className="text-sm text-orange-700 mt-1">
                    Approaching capacity. Monitor closely and prepare for delays.
                  </p>
                </div>
              )}
              {metrics.utilization >= 0.70 && metrics.utilization < 0.85 && (
                <div className="p-3 bg-yellow-100 border-l-4 border-yellow-500">
                  <p className="font-semibold text-yellow-800">📊 System Busy</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Optimal performance zone. Queue management required.
                  </p>
                </div>
              )}
              {metrics.utilization < 0.70 && (
                <div className="p-3 bg-green-100 border-l-4 border-green-500">
                  <p className="font-semibold text-green-800">✅ Optimal Operation</p>
                  <p className="text-sm text-green-700 mt-1">
                    System operating efficiently. Consider scheduling follow-ups.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueMetricsDashboard;