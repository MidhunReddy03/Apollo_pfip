import React from 'react';
import { TriageRecord } from '../types';

interface TriageCardProps {
  triage: TriageRecord;
  onPriorityChange?: (priority: string) => void;
}

const TriageCard: React.FC<TriageCardProps> = ({ triage, onPriorityChange }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1': return 'bg-red-100 text-red-800 border-red-300';
      case 'P2': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'P3': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'P1': return '🚨';
      case 'P2': return '⚠️';
      case 'P3': return '✅';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{getPriorityIcon(triage.priority)}</span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(triage.priority)}`}>
              {triage.priority}
              {triage.ai_confidence_score && (
                <span className="ml-2 text-xs opacity-75">
                  ({Math.round(triage.ai_confidence_score * 100)}%)
                </span>
              )}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{triage.chief_complaint}</h3>
          <p className="text-sm text-gray-600 mt-1">{triage.patient_name}</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-500">{triage.arrival_time}</span>
          <div className="mt-2 text-sm">
            <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded">
              Department: {triage.suggested_department}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
        <div>
          <p className="text-gray-500 text-xs">Age/Gender</p>
          <p className="font-medium">{triage.age} / {triage.gender}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Vital Signs</p>
          <p className="font-medium">
            {triage.vital_signs?.heart_rate || '--'} BPM
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Symptoms</p>
          <p className="font-medium truncate">
            {triage.symptoms?.slice(0, 2).join(', ') || 'Not specified'}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Wait Time</p>
          <p className="font-medium">{triage.wait_time_estimate}</p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t">
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            AI Confidence: <strong>{Math.round(triage.ai_confidence_score * 100)}%</strong>
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              onClick={() => onPriorityChange && onPriorityChange('P1')}
            >
              P1
            </button>
            <button
              className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
              onClick={() => onPriorityChange && onPriorityChange('P2')}
            >
              P2
            </button>
            <button
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
              onClick={() => onPriorityChange && onPriorityChange('P3')}
            >
              P3
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TriageCard;