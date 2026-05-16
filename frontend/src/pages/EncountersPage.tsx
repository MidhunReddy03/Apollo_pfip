import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { encounterService, Encounter } from '../services/encounter';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import { cn, formatDateTime } from '../utils/helpers';

export default function EncountersPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: encounters = [], isLoading, refetch } = useQuery({
    queryKey: ['encounters'],
    queryFn: () => encounterService.getAll(),
  });

  const filteredEncounters = encounters.filter((encounter) => {
    const matchesSearch = encounter.encounter_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || encounter.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const statusColors = {
    checked_in: 'bg-primary-100 text-primary-700',
    in_queue: 'bg-warning-100 text-warning-700',
    in_progress: 'bg-success-100 text-success-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-danger-100 text-danger-700',
    no_show: 'bg-gray-100 text-gray-500',
  };

  const statusLabels = {
    checked_in: 'Checked In',
    in_queue: 'In Queue',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
  };

  const priorityColors = {
    low: 'text-gray-600',
    normal: 'text-blue-600',
    high: 'text-orange-600',
    urgent: 'text-red-600',
    emergency: 'text-red-700 font-bold',
  };

  const handleCheckOut = async (id: number) => {
    try {
      await encounterService.checkOut(id);
      toast.success('Patient checked out successfully! 🎉');
      refetch();
    } catch (error) {
      toast.error('Failed to check out patient');
    }
  };

  const handleCancel = async (id: number) => {
    if (window.confirm('Are you sure you want to cancel this encounter?')) {
      try {
        await encounterService.cancel(id);
        toast.success('Encounter cancelled');
        refetch();
      } catch (error) {
        toast.error('Failed to cancel encounter');
      }
    }
  };

  const stats = [
    { label: 'Total Today', value: encounters.length, color: 'primary' },
    { label: 'Checked In', value: encounters.filter((e) => e.status === 'checked_in').length, color: 'warning' },
    { label: 'In Progress', value: encounters.filter((e) => e.status === 'in_progress').length, color: 'success' },
    { label: 'Completed', value: encounters.filter((e) => e.status === 'completed').length, color: 'primary' },
  ];

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Encounter Management</h1>
            <p className="text-gray-600">Track patient visits and check-ins</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            icon={<Plus size={20} />}
            onClick={() => navigate('/encounters/new')}
          >
            New Check-in
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-4">
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className={cn('text-2xl font-bold', `text-${stat.color}-600`)}>{stat.value}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by encounter ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search size={18} />}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="checked_in">Checked In</option>
              <option value="in_queue">In Queue</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </Card>
      </motion.div>

      {/* Encounters List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      ) : filteredEncounters.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-12 text-center">
            <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No encounters found</h3>
            <p className="text-gray-600 mb-6">Start by checking in a patient</p>
            <Button variant="primary" icon={<Plus size={20} />} onClick={() => navigate('/encounters/new')}>
              New Check-in
            </Button>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filteredEncounters.map((encounter, index) => (
            <motion.div
              key={encounter.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card hover className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                        <Activity className="text-white" size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{encounter.encounter_id}</h3>
                        <p className="text-sm text-gray-500">Patient ID: {encounter.patient_id}</p>
                      </div>
                      <span
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium',
                          statusColors[encounter.status]
                        )}
                      >
                        {statusLabels[encounter.status]}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Department</p>
                        <p className="font-medium text-gray-900">{encounter.department}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Priority</p>
                        <p className={cn('font-medium capitalize', priorityColors[encounter.priority])}>
                          {encounter.priority}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Check-in Time</p>
                        <p className="font-medium text-gray-900">{formatDateTime(encounter.check_in_time)}</p>
                      </div>
                      {encounter.check_out_time && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Check-out Time</p>
                          <p className="font-medium text-gray-900">{formatDateTime(encounter.check_out_time)}</p>
                        </div>
                      )}
                    </div>

                    {encounter.chief_complaint && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1">Chief Complaint</p>
                        <p className="text-sm text-gray-700">{encounter.chief_complaint}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {encounter.status !== 'completed' && encounter.status !== 'cancelled' && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          icon={<CheckCircle size={16} />}
                          onClick={() => handleCheckOut(encounter.id)}
                        >
                          Check Out
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<XCircle size={16} />}
                          onClick={() => handleCancel(encounter.id)}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
