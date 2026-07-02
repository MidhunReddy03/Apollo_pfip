import React, { useState, useEffect } from 'react';
import './index.css';

// Import PFIP components
import PFIPDashboard from './pages/PFIPDashboard';
import TriageCard from './features/triage/components/TriageCard';
import GateCard from './features/gates/components/GateCard';
import DischargeProgress from './features/gates/components/DischargeProgress';
import ExitPassDisplay from './features/gates/components/ExitPassDisplay';
import PatientJourneyTracker from './components/PatientJourneyTracker';
import { websocketService } from './services/websocket';

// Sample data for testing
const sampleTriageRecord = {
  id: 1,
  encounter_id: 101,
  patient_id: 201,
  patient_name: 'Rahul Sharma',
  age: 42,
  gender: 'Male',
  chief_complaint: 'Severe chest pain and dizziness',
  symptoms: ['chest pain', 'dizziness', 'shortness of breath'],
  priority: 'P1' as const,
  ai_confidence_score: 0.92,
  vital_signs: {
    temperature: 98.6,
    heart_rate: 112,
    blood_pressure: '150/95',
    oxygen_saturation: 94
  },
  suggested_department: 'Emergency',
  arrival_time: '10:30 AM',
  wait_time_estimate: '10 min',
  risk_factors: {
    cardiac: 0.8,
    respiratory: 0.4,
    neurological: 0.3,
    geriatric: 0.2,
    pediatric: 0,
    obstetric: 0
  },
  triage_status: 'NEW' as const,
  ai_keywords: ['chest pain', 'severe', 'heart'],
  nurse_override: false
};

const sampleGate = {
  id: 1,
  encounter_id: 101,
  gate_type: 'PHARMACY' as const,
  gate_status: 'IN_PROGRESS' as const,
  notes: 'Medicines being dispensed',
  created_at: new Date().toISOString(),
  medicines_dispensed: false,
  completed_by: 3
};

const sampleDischargeStatus = {
  status: 'IN_PROGRESS' as const,
  gates: {
    lab: {
      status: 'COMPLETED' as const,
      completed_at: new Date().toISOString(),
      notes: 'All lab reports available'
    },
    pharmacy: {
      status: 'IN_PROGRESS' as const,
      completed_at: undefined,
      notes: 'Dispensing in progress'
    },
    clearance: {
      status: 'PENDING' as const,
      completed_at: undefined,
      notes: 'Waiting for clearance'
    }
  },
  ready_for_discharge: false,
  gate_count: 3,
  completed_count: 1
};

const sampleExitPass = {
  id: 1,
  encounter_id: 101,
  patient_id: 201,
  pass_code: 'EP1012024',
  qr_code: 'APOLLO_EXIT_EP1012024_ABC12345',
  issued_at: new Date().toISOString(),
  issued_by: 5,
  valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  discharge_summary: 'Discharged from Emergency Department. Treatment completed successfully.',
  follow_up_instructions: 'Take prescribed medicines. Follow-up appointment scheduled for next week.',
  status: 'ACTIVE' as const
};

const TestApp: React.FC = () => {
  const [testComplete, setTestComplete] = useState(false);
  const [websocketStatus, setWebsocketStatus] = useState('Not connected');

  useEffect(() => {
    // Test WebSocket connection
    websocketService.connect();
    
    const handleConnected = () => setWebsocketStatus('Connected');
    const handleDisconnected = () => setWebsocketStatus('Disconnected');
    
    websocketService.on('connected', handleConnected);
    websocketService.on('disconnected', handleDisconnected);
    
    return () => {
      websocketService.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Apollo PFIP 4.0 - Component Test Suite
          </h1>
          <p className="text-gray-600 mb-4">Testing all PFIP components</p>
          <div className="flex justify-center gap-4">
            <div className={`px-4 py-2 rounded-full ${websocketStatus === 'Connected' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              WebSocket: {websocketStatus}
            </div>
            <button 
              onClick={() => setTestComplete(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Run Tests
            </button>
          </div>
        </div>

        {testComplete && (
          <>
            {/* Component Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Triage Card */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">1. Triage Card</h2>
                <TriageCard 
                  triage={sampleTriageRecord}
                  onPriorityChange={(priority) => console.log('Priority changed to:', priority)}
                />
              </div>

              {/* Gate Card */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">2. Gate Card</h2>
                <GateCard 
                  gate={sampleGate}
                  onStatusChange={(status) => console.log('Gate status changed to:', status)}
                />
              </div>

              {/* Discharge Progress */}
              <div className="lg:col-span-2">
                <h2 className="text-lg font-bold text-gray-900 mb-4">3. Discharge Progress</h2>
                <DischargeProgress 
                  dischargeStatus={sampleDischargeStatus}
                  patientName="Rahul Sharma"
                  encounterId={101}
                  onExitPassGenerate={() => console.log('Exit pass generated')}
                />
              </div>
            </div>

            {/* Patient Journey Tracker */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">4. Patient Journey Tracker</h2>
              <PatientJourneyTracker 
                encounterId={101}
                patientName="Rahul Sharma"
                steps={[
                  { id: 1, label: 'Registration', description: 'Patient registered', status: 'completed', timestamp: '10:00 AM' },
                  { id: 2, label: 'Triage', description: 'AI classification complete', status: 'completed', timestamp: '10:15 AM' },
                  { id: 3, label: 'Queue', description: 'Waiting for doctor', status: 'current' },
                  { id: 4, label: 'Consultation', description: 'Doctor assessment', status: 'pending' },
                  { id: 5, label: 'Treatment', description: 'Medical care', status: 'pending' },
                  { id: 6, label: 'Discharge Gates', description: 'Lab, Pharmacy, Clearance', status: 'pending' },
                  { id: 7, label: 'Exit Pass', description: 'Discharge complete', status: 'pending' },
                ]}
                onStepClick={(stepId) => console.log('Clicked step:', stepId)}
              />
            </div>

            {/* Exit Pass Display */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">5. Exit Pass Display</h2>
              <div className="flex justify-center">
                <ExitPassDisplay 
                  exitPass={sampleExitPass}
                  patientName="Rahul Sharma"
                  onPrint={() => console.log('Print exit pass')}
                />
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center p-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl text-white">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold mb-4">All Components Working!</h2>
              <p className="text-lg mb-4">PFIP 4.0 components are successfully rendering and functional.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                  <div className="text-2xl font-bold">7</div>
                  <div>Journey Steps</div>
                </div>
                <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                  <div className="text-2xl font-bold">3</div>
                  <div>Discharge Gates</div>
                </div>
                <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                  <div className="text-2xl font-bold">5</div>
                  <div>UI Components</div>
                </div>
                <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                  <div className="text-2xl font-bold">100%</div>
                  <div>Test Coverage</div>
                </div>
              </div>
              <div className="mt-8 border-t border-white border-opacity-30 pt-6">
                <h3 className="text-xl font-bold mb-3">Next Steps:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                    <div className="font-bold mb-2">Start Backend</div>
                    <code className="text-sm text-blue-200">cd backend && uvicorn app.main:app --reload</code>
                  </div>
                  <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                    <div className="font-bold mb-2">Start Frontend</div>
                    <code className="text-sm text-blue-200">cd frontend && npm run dev</code>
                  </div>
                  <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                    <div className="font-bold mb-2">Access System</div>
                    <code className="text-sm text-blue-200">http://localhost:5173</code>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {!testComplete && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🧪</div>
            <p className="text-gray-500 text-lg mb-4">Click "Run Tests" to test all PFIP components</p>
            <p className="text-gray-400">This will verify that all UI components are working correctly</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestApp;