import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Clock,
  ClipboardCheck,
  AlertTriangle,
  Stethoscope,
  Play,
  CheckCircle,
  ChevronRight,
  Activity,
  Heart,
  FileText,
  TrendingUp,
  AlertCircle,
  Loader,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store';
import { encounterService, Encounter } from '../services/encounter';
import { patientService, Patient } from '../services/patient';

export default function DoctorDashboard() {
  const user = useAuthStore((s) => s.user);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activePatientId, setActivePatientId] = useState<number | null>(null);
  const [patients, setPatients] = useState<{ [key: number]: Patient }>({});

  // Fetch encounters (real data from backend)
  const { data: encounters = [], isLoading, error, refetch } = useQuery({
    queryKey: ['encounters'],
    queryFn: () => encounterService.getAll(),
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  // Fetch all patients for mapping
  useEffect(() => {
    patientService.getAll().then((patientsData) => {
      const patientMap = patientsData.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {} as { [key: number]: Patient });
      setPatients(patientMap);
    });
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Calculate age from DOB
  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Map encounters to display format
  const queue = encounters
    .filter((e) => e.status === 'checked_in' || e.status === 'in_progress')
    .sort((a, b) => {
      const priorityOrder = { emergency: 0, urgent: 1, high: 2, normal: 3, low: 4 };
      return (priorityOrder[a.priority as keyof typeof priorityOrder] || 5) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 5);
    })
    .map((encounter) => {
      const patient = patients[encounter.patient_id];
      const waitMinutes = encounter.check_in_time
        ? Math.floor((Date.now() - new Date(encounter.check_in_time).getTime()) / 60000)
        : 0;

      return {
        id: encounter.id,
        encounterId: encounter.encounter_id,
        name: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown',
        age: patient ? calculateAge(patient.date_of_birth) : 0,
        gender: patient?.gender?.charAt(0).toUpperCase() || 'U',
        mrn: patient?.mrn || 'N/A',
        type: (patient?.patient_type?.toUpperCase() || 'OP') as 'IP' | 'OP' | 'HC',
        priority: encounter.priority as any,
        complaint: encounter.chief_complaint || 'No complaint specified',
        department: encounter.department,
        waitTime: waitMinutes,
        status: encounter.status as 'checked_in' | 'in_progress' | 'completed',
      };
    });

  const stats = [
    { label: 'In Queue', value: queue.filter((q) => q.status === 'checked_in').length, icon: Users, color: 'medical', accent: 'bg-medical-500' },
    { label: 'In Consultation', value: queue.filter((q) => q.status === 'in_progress').length, icon: Activity, color: 'health', accent: 'bg-health-500' },
    { label: 'Avg Wait Time', value: queue.length > 0 ? `${Math.round(queue.reduce((a, b) => a + b.waitTime, 0) / queue.length)}m` : '0m', icon: Clock, color: 'alert', accent: 'bg-alert-500' },
    { label: 'Critical', value: queue.filter((q) => q.priority === 'emergency').length, icon: AlertTriangle, color: 'emergency', accent: 'bg-emergency-500' },
  ];

  const currentPatient = activePatientId ? queue.find((p) => p.id === activePatientId) : queue[0];

  const handleStartConsultation = async () => {
    if (!currentPatient) return;
    try {
      await encounterService.update(currentPatient.id, { status: 'in_progress' as any });
      refetch();
      toast.success(`Started consultation with ${currentPatient.name}`);
    } catch (err) {
      toast.error('Failed to start consultation');
    }
  };

  const handleCompleteConsultation = async () => {
    if (!currentPatient) return;
    try {
      await encounterService.checkOut(currentPatient.id);
      refetch();
      setActivePatientId(null);
      toast.success(`Consultation completed for ${currentPatient.name}`);
    } catch (err) {
      toast.error('Failed to complete consultation');
    }
  };

  const handleOrderTests = () => {
    if (!currentPatient) return;
    toast.success(`Test order initiated for ${currentPatient.name}`);
  };

  const handlePrescribe = () => {
    if (!currentPatient) return;
    toast.success(`Prescription form opened for ${currentPatient.name}`);
  };

  const handleRefer = () => {
    if (!currentPatient) return;
    toast.success(`Referral initiated for ${currentPatient.name}`);
  };

  const handleNotes = () => {
    if (!currentPatient) return;
    toast.success(`Notes opened for ${currentPatient.name}`);
  };

  const getPriorityStyle = (p: string) => {
    switch (p) {
      case 'emergency': return 'priority-emergency';
      case 'urgent': return 'priority-urgent';
      case 'high': return 'priority-high';
      case 'normal': return 'priority-normal';
      default: return 'priority-low';
    }
  };

  const getPriorityBgColor = (p: string) => {
    switch (p) {
      case 'emergency': return 'bg-emergency-50 border-emergency-200';
      case 'urgent': return 'bg-alert-50 border-alert-200';
      case 'high': return 'bg-medical-50 border-medical-200';
      default: return 'bg-health-50 border-health-200';
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar role="doctor" />
        <div className="ml-[264px] p-8">
          <div className="card p-8 text-center">
            <AlertCircle size={48} className="mx-auto text-emergency-500 mb-4" />
            <p className="text-slate-600">Failed to load encounters</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar role="doctor" />
      <div className="ml-[264px] transition-all duration-300">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900">
                Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 17 ? 'Afternoon' : 'Evening'}, Dr. {user?.full_name?.split(' ').pop() || 'Doctor'}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
                <div className="status-dot online" />
                <span className="text-sm font-medium text-slate-700">On Duty</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
                <Clock size={16} className="text-slate-500" />
                <span className="text-sm font-semibold text-slate-800">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-5">
            {stats.map((s, i) => (
              <div key={s.label} className="card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{s.label}</p>
                    <p className="text-3xl font-display font-bold text-slate-900 mt-1">{s.value}</p>
                  </div>
                  <div className={`w-11 h-11 ${s.accent} rounded-xl flex items-center justify-center shadow-md`}>
                    <s.icon className="text-white" size={20} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-3 gap-6">
            {/* Current Patient */}
            <div className="col-span-2 space-y-6">
              {isLoading ? (
                <div className="card p-8 flex items-center justify-center gap-3">
                  <Loader size={20} className="animate-spin text-medical-500" />
                  <span className="text-slate-600">Loading encounters...</span>
                </div>
              ) : currentPatient ? (
                <>
                  {/* Current Patient Card */}
                  <div className={`card p-6 border-2 ${getPriorityBgColor(currentPatient.priority)}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-medical-100 rounded-full flex items-center justify-center">
                            <Users size={24} className="text-medical-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">{currentPatient.name}</h3>
                            <p className="text-sm text-slate-500">{currentPatient.mrn}</p>
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${getPriorityStyle(currentPatient.priority)}`}>
                        {currentPatient.priority.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-6 pb-6 border-b border-slate-200">
                      <div>
                        <p className="text-xs text-slate-500 font-semibold">Age</p>
                        <p className="text-lg font-bold text-slate-900">{currentPatient.age}y {currentPatient.gender}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold">Type</p>
                        <p className="text-lg font-bold text-slate-900">{currentPatient.type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold">Wait Time</p>
                        <p className="text-lg font-bold text-slate-900">{currentPatient.waitTime}m</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold">Department</p>
                        <p className="text-lg font-bold text-slate-900">{currentPatient.department}</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-sm font-semibold text-slate-700 mb-2">Chief Complaint:</p>
                      <p className="text-sm text-slate-600">{currentPatient.complaint}</p>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={handleStartConsultation} className="btn btn-primary flex items-center justify-center gap-2">
                        <Play size={16} />
                        Start Consultation
                      </button>
                      <button onClick={handleCompleteConsultation} className="btn btn-success flex items-center justify-center gap-2">
                        <CheckCircle size={16} />
                        Complete Consultation
                      </button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-3 gap-3">
                    <button onClick={handleOrderTests} className="card p-4 hover:shadow-lg transition-all flex flex-col items-center gap-2 group">
                      <div className="w-10 h-10 bg-medical-100 rounded-lg flex items-center justify-center group-hover:bg-medical-200">
                        <ClipboardCheck size={20} className="text-medical-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">Order Tests</span>
                    </button>
                    <button onClick={handlePrescribe} className="card p-4 hover:shadow-lg transition-all flex flex-col items-center gap-2 group">
                      <div className="w-10 h-10 bg-health-100 rounded-lg flex items-center justify-center group-hover:bg-health-200">
                        <FileText size={20} className="text-health-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">Prescribe</span>
                    </button>
                    <button onClick={handleRefer} className="card p-4 hover:shadow-lg transition-all flex flex-col items-center gap-2 group">
                      <div className="w-10 h-10 bg-alert-100 rounded-lg flex items-center justify-center group-hover:bg-alert-200">
                        <Stethoscope size={20} className="text-alert-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">Refer</span>
                    </button>
                  </div>

                  <button onClick={handleNotes} className="card p-4 w-full hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3">
                      <Activity size={20} className="text-slate-500" />
                      <span className="font-medium text-slate-700">Add Notes</span>
                      <ChevronRight size={16} className="ml-auto text-slate-400" />
                    </div>
                  </button>
                </>
              ) : (
                <div className="card p-8 text-center">
                  <p className="text-slate-600">No patients in queue</p>
                </div>
              )}
            </div>

            {/* Queue List */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Users size={20} />
                Patient Queue
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {queue.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No patients waiting</p>
                ) : (
                  queue.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => setActivePatientId(patient.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        patient.id === activePatientId ? 'bg-medical-100 border border-medical-300' : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{patient.name}</p>
                          <p className="text-xs text-slate-500">{patient.mrn}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold text-white flex-shrink-0 ml-2 ${getPriorityStyle(patient.priority)}`}>
                          {patient.priority[0].toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
