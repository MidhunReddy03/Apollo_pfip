import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Filter,
  Download,
  User,
  Phone,
  Mail,
  Calendar,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { patientService } from '../services/patient';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import { cn, formatDate } from '../utils/helpers';

export default function PatientsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const { data: patients = [], isLoading, refetch } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientService.getAll(),
  });

  const filteredPatients = patients.filter((patient) => {
    const normalizedType = (patient.patient_type || '').toUpperCase();
    const matchesSearch =
      patient.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.patient_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterType === 'all' || normalizedType === filterType;

    return matchesSearch && matchesFilter;
  });

  const patientTypeColors: Record<string, string> = {
    IP: 'bg-primary-100 text-primary-700',
    OP: 'bg-success-100 text-success-700',
    HC: 'bg-warning-100 text-warning-700',
    EMERGENCY: 'bg-danger-100 text-danger-700',
  };

  const patientTypeLabels: Record<string, string> = {
    IP: 'Inpatient',
    OP: 'Outpatient',
    HC: 'Health Check',
    EMERGENCY: 'Emergency',
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await patientService.delete(id);
        toast.success('Patient deleted successfully');
        refetch();
      } catch (error) {
        toast.error('Failed to delete patient');
      }
    }
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Management</h1>
            <p className="text-gray-600">Manage and track all patient records</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            icon={<Plus size={20} />}
            onClick={() => navigate('/receptionist/patients/new')}
          >
            New Patient
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Patients', value: patients.length, color: 'primary' },
            { label: 'Inpatients', value: patients.filter((p) => (p.patient_type || '').toUpperCase() === 'IP').length, color: 'success' },
            { label: 'Outpatients', value: patients.filter((p) => (p.patient_type || '').toUpperCase() === 'OP').length, color: 'warning' },
            { label: 'Emergency', value: patients.filter((p) => (p.patient_type || '').toUpperCase() === 'EMERGENCY').length, color: 'danger' },
          ].map((stat, index) => (
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

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, ID, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search size={18} />}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Types</option>
                <option value="IP">Inpatient</option>
                <option value="OP">Outpatient</option>
                <option value="HC">Health Check</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
              <Button variant="secondary" icon={<Filter size={18} />}>
                Filters
              </Button>
              <Button variant="secondary" icon={<Download size={18} />}>
                Export
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Patient List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      ) : filteredPatients.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-12 text-center">
            <User className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first patient</p>
            <Button variant="primary" icon={<Plus size={20} />} onClick={() => navigate('/receptionist/patients/new')}>
              Add Patient
            </Button>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPatients.map((patient, index) => (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card hover className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {patient.first_name[0]}
                      {patient.last_name[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {patient.first_name} {patient.last_name}
                      </h3>
                      <p className="text-sm text-gray-500">{patient.patient_id}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      patientTypeColors[(patient.patient_type || '').toUpperCase()] || 'bg-gray-100 text-gray-700'
                    )}
                  >
                    {patientTypeLabels[(patient.patient_type || '').toUpperCase()] || patient.patient_type}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {patient.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} />
                      <span>{patient.phone}</span>
                    </div>
                  )}
                  {patient.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={14} />
                      <span className="truncate">{patient.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={14} />
                    <span>DOB: {formatDate(patient.date_of_birth)}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Eye size={16} />}
                    onClick={() => navigate(`/receptionist/patients/${patient.id}`)}
                    className="flex-1"
                  >
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Edit size={16} />}
                    onClick={() => navigate(`/receptionist/patients/${patient.id}/edit`)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={16} />}
                    onClick={() => handleDelete(patient.id)}
                    className="text-danger-600 hover:bg-danger-50"
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
