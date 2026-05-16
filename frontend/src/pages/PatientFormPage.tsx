import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, User, Phone, Mail, MapPin, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { patientService, PatientCreate } from '../services/patient';
import { useAuthStore } from '../store';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';

export default function PatientFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useAuthStore((state) => state.user);
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PatientCreate>({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'male',
    phone: '',
    email: '',
    address: '',
    patient_type: 'op',
    emergency_contact: '',
    tenant_id: user?.tenant_id || 'default',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isEdit || !id) return;

    const fetchPatient = async () => {
      setLoading(true);
      try {
        const patient = await patientService.getById(Number(id));
        setFormData({
          first_name: patient.first_name || '',
          last_name: patient.last_name || '',
          date_of_birth: patient.date_of_birth || '',
          gender: (patient.gender || 'male') as 'male' | 'female' | 'other',
          phone: patient.phone || '',
          email: patient.email || '',
          address: patient.address || '',
          patient_type: (patient.patient_type || 'op') as string,
          emergency_contact: patient.emergency_contact || patient.emergency_contact_phone || '',
          tenant_id: patient.tenant_id || user?.tenant_id || 'default',
        });
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Failed to load patient');
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [id, isEdit, user?.tenant_id]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name) newErrors.first_name = 'First name is required';
    if (!formData.last_name) newErrors.last_name = 'Last name is required';
    if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (isEdit) {
        await patientService.update(Number(id), formData);
        toast.success('Patient updated successfully! 🎉');
      } else {
        await patientService.create(formData);
        toast.success('Patient created successfully! 🎉');
      }
      navigate('/receptionist/patients');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save patient');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof PatientCreate, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
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
            onClick={() => navigate('/receptionist/patients')}
            className="mb-4"
          >
            Back to Patients
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEdit ? 'Edit Patient' : 'New Patient'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update patient information' : 'Add a new patient to the system'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="text-primary-600" size={24} />
                <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="First Name *"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  error={errors.first_name}
                  placeholder="John"
                />

                <Input
                  label="Last Name *"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  error={errors.last_name}
                  placeholder="Doe"
                />

                <Input
                  label="Date of Birth *"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleChange('date_of_birth', e.target.value)}
                  error={errors.date_of_birth}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Gender *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-2 mb-6">
                <Phone className="text-primary-600" size={24} />
                <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Phone Number"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  icon={<Phone size={18} />}
                  placeholder="+1 (555) 123-4567"
                />

                <Input
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  error={errors.email}
                  icon={<Mail size={18} />}
                  placeholder="john.doe@example.com"
                />

                <div className="md:col-span-2">
                  <Input
                    label="Address"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    icon={<MapPin size={18} />}
                    placeholder="123 Main St, City, State, ZIP"
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Medical Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-2 mb-6">
                <AlertCircle className="text-primary-600" size={24} />
                <h2 className="text-xl font-semibold text-gray-900">Medical Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Patient Type *
                  </label>
                  <select
                    value={formData.patient_type}
                    onChange={(e) => handleChange('patient_type', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="ip">Inpatient (IP)</option>
                    <option value="op">Outpatient (OP)</option>
                    <option value="hc">Health Check (HC)</option>
                  </select>
                </div>

                <Input
                  label="Emergency Contact"
                  type="tel"
                  value={formData.emergency_contact}
                  onChange={(e) => handleChange('emergency_contact', e.target.value)}
                  icon={<Phone size={18} />}
                  placeholder="+1 (555) 987-6543"
                />
              </div>
            </Card>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex gap-4 justify-end"
          >
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => navigate('/receptionist/patients')}
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
              {isEdit ? 'Update Patient' : 'Create Patient'}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
