import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle,
  Play,
  SkipForward,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { queueService, QueueEntry } from '../services/queue';
import { stationService } from '../services/station';
import { encounterService } from '../services/encounter';
import Button from '../components/Button';
import Card from '../components/Card';
import { cn, formatTime } from '../utils/helpers';

export default function QueueBoardPage() {
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: stations = [], refetch: refetchStations } = useQuery({
    queryKey: ['stations'],
    queryFn: () => stationService.getAll(),
  });

  const { data: queues = [], refetch: refetchQueues } = useQuery({
    queryKey: ['queues', selectedStation],
    queryFn: () => queueService.getAll(selectedStation || undefined),
    refetchInterval: autoRefresh ? 5000 : false, // Auto-refresh every 5 seconds
  });

  const { data: encounters = [] } = useQuery({
    queryKey: ['encounters'],
    queryFn: () => encounterService.getActive(),
  });

  // Group queues by station
  const queuesByStation = queues.reduce((acc, queue) => {
    if (!acc[queue.station_id]) {
      acc[queue.station_id] = [];
    }
    acc[queue.station_id].push(queue);
    return acc;
  }, {} as Record<number, QueueEntry[]>);

  const handleCallNext = async (queueId: number) => {
    try {
      await queueService.callNext(queueId);
      toast.success('Patient called! 📢');
      refetchQueues();
    } catch (error) {
      toast.error('Failed to call patient');
    }
  };

  const handleStartService = async (queueId: number) => {
    try {
      await queueService.startService(queueId);
      toast.success('Service started! ▶️');
      refetchQueues();
    } catch (error) {
      toast.error('Failed to start service');
    }
  };

  const handleCompleteService = async (queueId: number) => {
    try {
      await queueService.completeService(queueId);
      toast.success('Service completed! ✅');
      refetchQueues();
      refetchStations();
    } catch (error) {
      toast.error('Failed to complete service');
    }
  };

  const handleRecalculatePriorities = async () => {
    try {
      await queueService.recalculatePriorities();
      toast.success('Priorities recalculated! 🔄');
      refetchQueues();
    } catch (error) {
      toast.error('Failed to recalculate priorities');
    }
  };

  const getEncounterDetails = (encounterId: number) => {
    return encounters.find((e) => e.id === encounterId);
  };

  const getStationDetails = (stationId: number) => {
    return stations.find((s) => s.id === stationId);
  };

  const getPriorityColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-50';
    if (score >= 60) return 'text-orange-600 bg-orange-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getQueueStatus = (queue: QueueEntry) => {
    if (queue.completed_at) return { label: 'Completed', color: 'success' };
    if (queue.started_at) return { label: 'In Service', color: 'primary' };
    if (queue.called_at) return { label: 'Called', color: 'warning' };
    return { label: 'Waiting', color: 'gray' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Queue Board</h1>
            <p className="text-gray-600">Real-time queue monitoring and management</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant={autoRefresh ? 'primary' : 'secondary'}
              size="md"
              icon={<RefreshCw size={18} className={autoRefresh ? 'animate-spin' : ''} />}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={<Activity size={18} />}
              onClick={handleRecalculatePriorities}
            >
              Recalculate Priorities
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-gray-600 mb-1">Total in Queue</p>
            <p className="text-2xl font-bold text-primary-600">{queues.filter(q => !q.completed_at).length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600 mb-1">Waiting</p>
            <p className="text-2xl font-bold text-warning-600">
              {queues.filter(q => !q.called_at && !q.completed_at).length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600 mb-1">In Service</p>
            <p className="text-2xl font-bold text-success-600">
              {queues.filter(q => q.started_at && !q.completed_at).length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600 mb-1">Completed Today</p>
            <p className="text-2xl font-bold text-gray-600">{queues.filter(q => q.completed_at).length}</p>
          </Card>
        </div>
      </motion.div>

      {/* Station Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <label className="font-medium text-gray-700">Filter by Station:</label>
            <select
              value={selectedStation || ''}
              onChange={(e) => setSelectedStation(e.target.value ? Number(e.target.value) : null)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Stations</option>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name} - {station.department}
                </option>
              ))}
            </select>
          </div>
        </Card>
      </motion.div>

      {/* Queue List */}
      {queues.filter(q => !q.completed_at).length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-12 text-center">
            <Users className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No patients in queue</h3>
            <p className="text-gray-600">Queue is empty - all caught up! 🎉</p>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {queues
              .filter(q => !q.completed_at)
              .sort((a, b) => b.priority_score - a.priority_score)
              .map((queue, index) => {
                const encounter = getEncounterDetails(queue.encounter_id);
                const station = getStationDetails(queue.station_id);
                const status = getQueueStatus(queue);

                return (
                  <motion.div
                    key={queue.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card hover className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 flex-1">
                          {/* Position */}
                          <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                              {queue.queue_position}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Position</p>
                          </div>

                          {/* Details */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900 text-lg">
                                Encounter #{encounter?.encounter_id || queue.encounter_id}
                              </h3>
                              <span
                                className={cn(
                                  'px-2 py-1 rounded-full text-xs font-medium',
                                  `bg-${status.color}-100 text-${status.color}-700`
                                )}
                              >
                                {status.label}
                              </span>
                              <span
                                className={cn(
                                  'px-2 py-1 rounded-full text-xs font-medium',
                                  getPriorityColor(queue.priority_score)
                                )}
                              >
                                Priority: {queue.priority_score.toFixed(0)}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Station</p>
                                <p className="font-medium text-gray-900">{station?.name || 'Unknown'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Department</p>
                                <p className="font-medium text-gray-900">{encounter?.department || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Joined</p>
                                <p className="font-medium text-gray-900">{formatTime(queue.joined_at)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Est. Wait</p>
                                <p className="font-medium text-gray-900">
                                  {queue.estimated_wait_time || 0} min
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 ml-4">
                          {!queue.called_at && (
                            <Button
                              variant="primary"
                              size="sm"
                              icon={<SkipForward size={16} />}
                              onClick={() => handleCallNext(queue.id)}
                            >
                              Call
                            </Button>
                          )}
                          {queue.called_at && !queue.started_at && (
                            <Button
                              variant="success"
                              size="sm"
                              icon={<Play size={16} />}
                              onClick={() => handleStartService(queue.id)}
                            >
                              Start
                            </Button>
                          )}
                          {queue.started_at && !queue.completed_at && (
                            <Button
                              variant="success"
                              size="sm"
                              icon={<CheckCircle size={16} />}
                              onClick={() => handleCompleteService(queue.id)}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
