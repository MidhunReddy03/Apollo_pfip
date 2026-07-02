import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  AlertCircle, 
  Filter, 
  Download, 
  RefreshCw,
  Clock,
  User,
  Shield
} from 'lucide-react';
import { AuditLog, AuditStats } from '../types';
import { useAuditApi } from '../hooks/useAuditApi';

const AuditLogDashboard: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    resource: '',
    is_critical: false
  });
  
  const { getAuditEvents, getAuditStatistics, getCriticalEvents } = useAuditApi();

  useEffect(() => {
    loadAuditData();
  }, [filter]);

  const loadAuditData = async () => {
    setLoading(true);
    try {
      const [eventsData, statsData] = await Promise.all([
        getAuditEvents({
          resource: filter.resource || undefined,
          is_critical: filter.is_critical ? true : undefined,
          limit: 50
        }),
        getAuditStatistics(24)
      ]);
      setLogs(eventsData.events);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action?.toLowerCase()) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'login': return 'bg-purple-100 text-purple-800';
      case 'logout': return 'bg-gray-100 text-gray-800';
      case 'approve': return 'bg-emerald-100 text-emerald-800';
      case 'reject': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResourceColor = (resource: string) => {
    switch (resource?.toLowerCase()) {
      case 'patient': return 'bg-indigo-100 text-indigo-800';
      case 'encounter': return 'bg-cyan-100 text-cyan-800';
      case 'triage': return 'bg-yellow-100 text-yellow-800';
      case 'queue': return 'bg-pink-100 text-pink-800';
      case 'gate': return 'bg-amber-100 text-amber-800';
      case 'exit_pass': return 'bg-lime-100 text-lime-800';
      case 'authentication': return 'bg-rose-100 text-rose-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Audit Log Dashboard</h1>
              <p className="text-gray-600 mt-2">Comprehensive activity tracking and compliance monitoring</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadAuditData}
                className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Events</p>
                  <p className="text-2xl font-bold">{stats.total_events}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Critical Events</p>
                  <p className="text-2xl font-bold text-red-600">{stats.critical_events}</p>
                  <p className="text-xs text-gray-400">{stats.critical_percentage}% of total</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Users</p>
                  <p className="text-2xl font-bold">{stats.active_users}</p>
                </div>
                <User className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Time Period</p>
                  <p className="text-2xl font-bold">{stats.period_hours}h</p>
                </div>
                <Clock className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filter.resource}
              onChange={(e) => setFilter({ ...filter, resource: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">All Resources</option>
              <option value="patient">Patient</option>
              <option value="encounter">Encounter</option>
              <option value="triage">Triage</option>
              <option value="queue">Queue</option>
              <option value="gate">Gate</option>
              <option value="exit_pass">Exit Pass</option>
              <option value="authentication">Authentication</option>
            </select>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filter.is_critical}
                onChange={(e) => setFilter({ ...filter, is_critical: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">
                <Shield className="w-4 h-4 inline mr-1 text-red-500" />
                Critical only
              </span>
            </label>
          </div>
        </div>

        {/* Audit Logs List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="divide-y">
              {logs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 hover:bg-gray-50 ${log.is_critical ? 'bg-red-50' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${getResourceColor(log.resource)}`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{log.resource}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                          {log.is_critical && (
                            <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-800">
                              🔴 Critical
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>User: {log.user_id} • Resource ID: {log.resource_id}</p>
                          {log.new_value && (
                            <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-w-lg">
                              {JSON.stringify(log.new_value, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>IP: {log.ip_address || 'N/A'}</p>
                      <p className="mt-1 flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(log.timestamp)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {logs.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No audit logs found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Events by Action Chart */}
        {stats && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Events by Action</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.events_by_action).map(([action, count]) => (
                <div key={action} className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className={`text-lg font-bold ${getActionColor(action).split(' ')[1]}`}>
                    {count}
                  </p>
                  <p className="text-sm text-gray-600 capitalize">{action}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogDashboard;