import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, ArrowRight } from 'lucide-react';

interface JourneyStep {
  id: number;
  label: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  timestamp?: string;
}

interface PatientJourneyTrackerProps {
  encounterId: number;
  patientName: string;
  steps: JourneyStep[];
  onStepClick?: (stepId: number) => void;
}

const PatientJourneyTracker: React.FC<PatientJourneyTrackerProps> = ({
  encounterId,
  patientName,
  steps,
  onStepClick
}) => {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'current': return 'bg-blue-500 animate-pulse';
      case 'pending': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-6 h-6 text-white" />;
      case 'current': return <Clock className="w-6 h-6 text-white" />;
      case 'pending': return <Circle className="w-6 h-6 text-gray-500" />;
      default: return <Circle className="w-6 h-6 text-gray-500" />;
    }
  };

  const defaultSteps: JourneyStep[] = steps.length > 0 ? steps : [
    { id: 1, label: 'Registration', description: 'Patient registered', status: 'completed', timestamp: '09:00 AM' },
    { id: 2, label: 'Triage', description: 'AI classification complete', status: 'completed', timestamp: '09:15 AM' },
    { id: 3, label: 'Queue', description: 'Waiting for doctor', status: 'current' },
    { id: 4, label: 'Consultation', description: 'Doctor assessment', status: 'pending' },
    { id: 5, label: 'Treatment', description: 'Medical care', status: 'pending' },
    { id: 6, label: 'Discharge Gates', description: 'Lab, Pharmacy, Clearance', status: 'pending' },
    { id: 7, label: 'Exit Pass', description: 'Discharge complete', status: 'pending' },
  ];

  const currentStepIndex = defaultSteps.findIndex(s => s.status === 'current');
  const progressPercentage = defaultSteps.filter(s => s.status === 'completed').length / defaultSteps.length * 100;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Patient Journey</h2>
          <p className="text-gray-600">
            {patientName} • Encounter #{encounterId}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Progress</p>
          <p className="text-2xl font-bold text-blue-600">
            {Math.round(progressPercentage)}%
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {defaultSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-3 h-3 rounded-full ${
                  step.status === 'completed' ? 'bg-green-500' :
                  step.status === 'current' ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
              {index < defaultSteps.length - 1 && (
                <div className={`w-12 md:w-20 h-1 mx-1 ${
                  step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Journey Steps */}
      <div className="space-y-4">
        {defaultSteps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer ${
              step.status === 'current' 
                ? 'border-blue-500 bg-blue-50 shadow-md' 
                : step.status === 'completed'
                ? 'border-green-200 bg-green-50'
                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
            }`}
            onClick={() => onStepClick && onStepClick(step.id)}
            onMouseEnter={() => setHoveredStep(step.id)}
            onMouseLeave={() => setHoveredStep(null)}
          >
            {/* Connector Line */}
            {index < defaultSteps.length - 1 && (
              <div className="absolute left-7 top-16 w-0.5 h-8">
                <div className={`h-full ${
                  defaultSteps[index + 1].status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              </div>
            )}

            {/* Step Icon */}
            <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${getStepColor(step.status)}`}>
              {getStepIcon(step.status)}
            </div>

            {/* Step Content */}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{step.label}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
                <div className="text-right">
                  {step.timestamp && (
                    <p className="text-xs text-gray-500">{step.timestamp}</p>
                  )}
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                    step.status === 'completed' ? 'bg-green-100 text-green-800' :
                    step.status === 'current' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {step.status === 'completed' ? 'Completed' :
                     step.status === 'current' ? 'In Progress' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Arrow for Current Step */}
            {step.status === 'current' && (
              <motion.div
                initial={{ x: 0 }}
                animate={{ x: 5 }}
                transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
              >
                <ArrowRight className="w-5 h-5 text-blue-500" />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">
              {defaultSteps.filter(s => s.status === 'completed').length}
            </p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {defaultSteps.filter(s => s.status === 'current').length}
            </p>
            <p className="text-xs text-gray-500">In Progress</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-400">
              {defaultSteps.filter(s => s.status === 'pending').length}
            </p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientJourneyTracker;