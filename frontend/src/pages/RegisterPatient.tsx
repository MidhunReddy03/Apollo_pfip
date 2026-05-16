import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Phone, Heart, AlertCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { patientService } from '../services/patient';
import { useAuthStore } from '../store';

export default function RegisterPatient() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    patientType: 'op',
    bloodGroup: '',
    allergies: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    whatsappNumber: '',
    whatsappOptIn: 'yes',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.phone ||
      !formData.patientType ||
      !formData.dateOfBirth ||
      !formData.gender
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const tenantId = user?.tenant_id || localStorage.getItem('tenant_id') || 'default';
      const legacyEmergencyContact =
        formData.emergencyContactPhone || formData.emergencyContactName || undefined;

      const created = await patientService.create({
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender as 'male' | 'female' | 'other',
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        patient_type: formData.patientType as 'ip' | 'op' | 'hc',
        emergency_contact: legacyEmergencyContact,
        emergency_contact_name: formData.emergencyContactName.trim() || undefined,
        emergency_contact_phone: formData.emergencyContactPhone.trim() || undefined,
        blood_group: formData.bloodGroup || undefined,
        allergies: formData.allergies.trim() || undefined,
        whatsapp_number: formData.whatsappOptIn === 'yes' ? formData.whatsappNumber.trim() || undefined : undefined,
        whatsapp_opt_in: formData.whatsappOptIn as 'yes' | 'no',
        tenant_id: tenantId,
      });

      toast.success(`Patient registered successfully! ID: ${created.patient_id}`);
      navigate('/receptionist/dashboard');
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to register patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/receptionist/dashboard')}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">New Patient Registration</h1>
            <p className="text-sm text-neutral-500">Register a new patient in the system</p>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="p-6 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Classification */}
          <div className="bg-white rounded-xl shadow-card p-6 border border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Patient Classification</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: 'op', label: 'Out-Patient (OP)', desc: 'Regular consultation' },
                { value: 'ip', label: 'In-Patient (IP)', desc: 'Admitted patient' },
                { value: 'hc', label: 'Health Check (HC)', desc: 'Preventive checkup' },
              ].map((type) => (
                <label
                  key={type.value}
                  className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.patientType === type.value
                      ? 'border-medical-500 bg-medical-50'
                      : 'border-neutral-300 hover:border-medical-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="patientType"
                    value={type.value}
                    checked={formData.patientType === type.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="font-medium text-neutral-900 mb-1">{type.label}</span>
                  <span className="text-sm text-neutral-600">{type.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-card p-6 border border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <User size={20} className="text-medical-500" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  First Name <span className="text-emergency-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Last Name <span className="text-emergency-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-card p-6 border border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Phone size={20} className="text-medical-500" />
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Phone Number <span className="text-emergency-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500"
                />
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="bg-white rounded-xl shadow-card p-6 border border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Heart size={20} className="text-medical-500" />
              Medical Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Blood Group
                </label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500"
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Allergies
                </label>
                <input
                  type="text"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  placeholder="e.g., Penicillin, Peanuts"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-xl shadow-card p-6 border border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-medical-500" />
              Emergency Contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Contact Name
                </label>
                <input
                  type="text"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500"
                />
              </div>
            </div>
          </div>

          {/* WhatsApp Notifications */}
          <div className="bg-health-50 rounded-xl p-6 border border-health-200">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="whatsappOptIn"
                checked={formData.whatsappOptIn === 'yes'}
                onChange={(e) => setFormData({ ...formData, whatsappOptIn: e.target.checked ? 'yes' : 'no' })}
                className="mt-1 w-5 h-5 text-health-600 rounded focus:ring-health-500"
              />
              <div className="flex-1">
                <label className="block font-medium text-neutral-900 mb-1">
                  Enable WhatsApp Notifications
                </label>
                <p className="text-sm text-neutral-600 mb-3">
                  Receive real-time updates about queue position, wait times, and test results via WhatsApp
                </p>
                {formData.whatsappOptIn === 'yes' && (
                  <input
                    type="tel"
                    name="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={handleChange}
                    placeholder="WhatsApp Number (with country code)"
                    className="w-full px-4 py-2 border border-health-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-health-500"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/receptionist/dashboard')}
              className="px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-medical-500 text-white rounded-lg hover:bg-medical-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={20} />
              {loading ? 'Registering...' : 'Register Patient'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
