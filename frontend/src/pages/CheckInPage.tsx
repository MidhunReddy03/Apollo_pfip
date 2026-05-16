import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, User, Calendar, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { encounterService, EncounterCreate } from '../services/encounter';
import { patientService } from '../services/patient';
import { useAuthStore } from '../store';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';

export default function CheckInPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const [formData, setFormData] = useState<EncounterCreate>({
    patient_id: 0,
    department: '',
    priority: 'normal',
    chief_complaint: '',
    notes: '',
    tenant_id: user?.tenant_id || 'default',
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientService.getAll(),
  });

  const filteredPatients = patients.filter(
    (p) =>
      p.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patient_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
    setFormData({ ...formData, patient_id: patient.id });
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patient_id) {
      toast.error('Please select a patient');
      return;
    }

    if (!formData.department) {
      toast.error('Please select a department');
      return;
    }

    setLoading(true);
    try {
      await encounterService.create(formData);
      toast.success('Patient checked in successfully! 🎉');
      navigate('/encounters');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to check in patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={18} />}
            onClick={() => navigate('/encounters')}
            className="mb-4"
          >
            Back to Encounters
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Check-in</h1>
          <p className="text-gray-600">Register a new patient visit</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Patient Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="text-primary-600" size={24} />
                <h2 className="text-xl font-semibold text-gray-900">Select Patient</h2>
              </div>

              {!selectedPatient ? (
                <>
                  <Input
                    label="Search Patient"
                    placeholder="Search by name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<User size={18} />}
                  />

                  {searchQuery && (
                    <div className="mt-4 max-h-64 overflow-y-auto space-y-2">
                      {filteredPatients.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No patients found</p>
                      ) : (
                        filteredPatients.map((patient) => (
                          <motion.button
                            key={patient.id}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            onClick={() => handleSelectPatient(patient)}
                            className="w-full p-4 bg-gray-50 hover:bg-primary-50 rounded-lg text-left transition-colors"
                          >
                            <p className="font-medium text-gray-900">
                              {patient.first_name} {patient.last_name}
                            </p>
                            <p className="text-sm text-gray-500">{patient.patient_id}</p>
                          </motion.button>
                        ))
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{selectedPatient.patient_id}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedPatient(null);
                      setFormData({ ...formData, patient_id: 0 });
                    }}
                  >
                    Change
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Visit Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="text-primary-600" size={24} />
                <h2 className="text-xl font-semibold text-gray-900">Visit Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Department *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Radiology">Radiology</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Priority *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <Input
                    label="Chief Complaint"
                    placeholder="Main reason for visit..."
                    value={formData.chief_complaint}
                    onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-4 justify-end"
          >
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => navigate('/encounters')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              icon={!loading && <Save size={20} />}
            >
              Check In Patient
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
