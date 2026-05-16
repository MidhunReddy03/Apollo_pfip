import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Building2,
  Activity,
  Wrench,
  Power,
  Edit,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { stationService, Station } from '../services/station';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import { cn } from '../utils/helpers';

export default function StationsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: stations = [], isLoading, refetch } = useQuery({
    queryKey: ['stations'],
    queryFn: () => stationService.getAll(),
  });

  const filteredStations = stations.filter((station) => {
    const matchesSearch =
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.station_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || station.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const statusColors = {
    free: 'bg-success-100 text-success-700 border-success-200',
    occupied: 'bg-warning-100 text-warning-700 border-warning-200',
    maintenance: 'bg-danger-100 text-danger-700 border-danger-200',
    offline: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const statusIcons = {
    free: Activity,
    occupied: Building2,
    maintenance: Wrench,
    offline: Power,
  };

  const stationTypeLabels = {
    xray: 'X-Ray',
    ecg: 'ECG',
    ultrasound: 'Ultrasound',
    treadmill: 'Treadmill',
    vital_check: 'Vital Check',
    blood_test: 'Blood Test',
    consultation: 'Consultation',
    other: 'Other',
  };

  const handleStatusChange = async (id: number, newStatus: any) => {
    try {
      await stationService.updateStatus(id, newStatus);
      toast.success('Station status updated! ✅');
      refetch();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this station?')) {
      try {
        await stationService.delete(id);
        toast.success('Station deleted successfully');
        refetch();
      } catch (error) {
        toast.error('Failed to delete station');
      }
    }
  };

  const stats = [
    { label: 'Total Stations', value: stations.length, color: 'primary' },
    { label: 'Available', value: stations.filter((s) => s.status === 'free').length, color: 'success' },
    { label: 'Occupied', value: stations.filter((s) => s.status === 'occupied').length, color: 'warning' },
    { label: 'Maintenance', value: stations.filter((s) => s.status === 'maintenance').length, color: 'danger' },
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Station Management</h1>
            <p className="text-gray-600">Monitor and manage equipment stations</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            icon={<Plus size={20} />}
            onClick={() => navigate('/stations/new')}
          >
            New Station
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
                placeholder="Search stations..."
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
              <option value="free">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </Card>
      </motion.div>

      {/* Stations Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      ) : filteredStations.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-12 text-center">
            <Building2 className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No stations found</h3>
            <p className="text-gray-600 mb-6">Add your first station to get started</p>
            <Button variant="primary" icon={<Plus size={20} />} onClick={() => navigate('/stations/new')}>
              Add Station
            </Button>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStations.map((station, index) => {
            const StatusIcon = statusIcons[station.status];
            return (
              <motion.div
                key={station.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-3 rounded-xl', statusColors[station.status].replace('text-', 'bg-').replace('700', '100'))}>
                        <StatusIcon className={statusColors[station.status].split(' ')[1]} size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{station.name}</h3>
                        <p className="text-sm text-gray-500">{station.station_id}</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium border',
                        statusColors[station.status]
                      )}
                    >
                      {station.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium text-gray-900">
                        {stationTypeLabels[station.station_type]}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium text-gray-900">{station.department}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-medium text-gray-900">
                        {station.current_occupancy} / {station.capacity}
                      </span>
                    </div>
                    {station.floor && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium text-gray-900">
                          Floor {station.floor} {station.room_number && `- Room ${station.room_number}`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex gap-2 mb-3">
                      <select
                        value={station.status}
                        onChange={(e) => handleStatusChange(station.id, e.target.value)}
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="free">Available</option>
                        <option value="occupied">Occupied</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="offline">Offline</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Edit size={16} />}
                        onClick={() => navigate(`/stations/${station.id}/edit`)}
                        className="flex-1"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={16} />}
                        onClick={() => handleDelete(station.id)}
                        className="text-danger-600 hover:bg-danger-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
