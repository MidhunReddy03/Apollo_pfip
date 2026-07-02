import React from 'react';
import { DischargeStatus } from '../types';

interface DischargeProgressProps {
  dischargeStatus: DischargeStatus;
  patientName: string;
  encounterId: number;
  onExitPassGenerate?: () => void;
}

const DischargeProgress: React.FC<DischargeProgressProps> = ({
  dischargeStatus,
  patientName,
  encounterId,
  onExitPassGenerate
}) => {
  const getProgressPercentage = () => {
    if (dischargeStatus.gate_count === 0) return 0;
    return Math.round((dischargeStatus.completed_count / dischargeStatus.gate_count) * 100);
  };

  const getStatusBadge = () => {
    switch (dischargeStatus.status) {
      case 'COMPLETED':
        return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Ready for Discharge</span>;
      case 'IN_PROGRESS':
        return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">In Progress</span>;
      case 'NOT_STARTED':
        return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">Not Started</span>;
    }
  };

  const gates = [
    { type: 'lab', display: 'Lab Reports', status: dischargeStatus.gates.lab },
    { type: 'pharmacy', display: 'Pharmacy', status: dischargeStatus.gates.pharmacy },
    { type: 'clearance', display: 'Clearance', status: dischargeStatus.gates.clearance },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Discharge Progress</h2>
          <p className="text-gray-600 mt-1">Patient: {patientName}</p>
          <p className="text-sm text-gray-500 mt-1">Encounter ID: {encounterId}</p>
        </div>
        <div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Gates Completed</span>
          <span className="text-sm font-medium text-gray-700">{getProgressPercentage()}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-green-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
        <div className="text-right mt-1">
          <span className="text-sm text-gray-500">
            {dischargeStatus.completed_count} of {dischargeStatus.gate_count} gates complete
          </span>
        </div>
      </div>

      {/* Gate Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {gates.map((gate) => (
          <div 
            key={gate.type}
            className={`p-4 rounded-lg border ${gate.status?.status === 'COMPLETED' ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-full ${gate.status?.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                {gate.type === 'lab' && '🔬'}
                {gate.type === 'pharmacy' && '💊'}
                {gate.type === 'clearance' && '📋'}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{gate.display}</h3>
                <p className="text-xs text-gray-500">
                  {gate.type === 'lab' && 'Lab results check'}
                  {gate.type === 'pharmacy' && 'Medicines dispensed'}
                  {gate.type === 'clearance' && 'Billing clearance'}
                </p>
              </div>
            </div>
            
            <div className="mt-3">
              <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                gate.status?.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                gate.status?.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                gate.status?.status === 'PENDING' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'
              }`}>
                {gate.status?.status || 'PENDING'}
              </span>
              
              {gate.status?.completed_at && (
                <p className="text-xs text-gray-500 mt-2">
                  Completed: {new Date(gate.status.completed_at).toLocaleDateString()}
                </p>
              )}
            </div>

            {gate.status?.notes && (
              <p className="text-xs text-gray-600 mt-2 bg-white p-2 rounded">
                {gate.status.notes}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Exit Pass Section */}
      {dischargeStatus.ready_for_discharge && onExitPassGenerate && (
        <div className="mt-6 p-4 bg-green-50 border border-green-300 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-green-800">All Gates Completed! 🎉</h3>
              <p className="text-sm text-green-600 mt-1">
                Patient is ready for discharge. Generate exit pass to complete the process.
              </p>
            </div>
            <button
              onClick={onExitPassGenerate}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              Generate Exit Pass
            </button>
          </div>
        </div>
      )}

      {!dischargeStatus.ready_for_discharge && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-300 rounded-lg">
          <div className="flex items-center">
            <div className="mr-3 text-blue-500 text-xl">ℹ️</div>
            <div>
              <h3 className="font-bold text-blue-800">Discharge Process</h3>
              <p className="text-sm text-blue-600 mt-1">
                Complete all three gates (Lab, Pharmacy, Clearance) to make patient eligible for discharge.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Legend */}
      <div className="mt-8 pt-4 border-t">
        <h4 className="font-medium text-gray-700 mb-3">Status Legend</h4>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Cancelled</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DischargeProgress;