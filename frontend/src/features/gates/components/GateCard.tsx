import React from 'react';
import { Gate, GateStatus, GateType } from '../types';

interface GateCardProps {
  gate: Gate;
  onStatusChange?: (status: GateStatus) => void;
  isActionable?: boolean;
}

const GateCard: React.FC<GateCardProps> = ({ gate, onStatusChange, isActionable = true }) => {
  const getStatusColor = (status: GateStatus) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-300';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'PENDING': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: GateStatus) => {
    switch (status) {
      case 'COMPLETED': return '✅';
      case 'IN_PROGRESS': return '🔄';
      case 'PENDING': return '⏳';
      case 'CANCELLED': return '❌';
      default: return 'ℹ️';
    }
  };

  const getGateIcon = (type: GateType) => {
    switch (type) {
      case 'LAB_REPORTS': return '🔬';
      case 'PHARMACY': return '💊';
      case 'CLEARANCE': return '📋';
      default: return '🚪';
    }
  };

  const getGateDisplayName = (type: GateType) => {
    switch (type) {
      case 'LAB_REPORTS': return 'Lab Reports';
      case 'PHARMACY': return 'Pharmacy';
      case 'CLEARANCE': return 'Clearance';
      default: return 'Gate';
    }
  };

  const getGateDescription = (type: GateType) => {
    switch (type) {
      case 'LAB_REPORTS': return 'Lab test results must be available';
      case 'PHARMACY': return 'All prescribed medicines dispensed';
      case 'CLEARANCE': return 'Administrative and billing clearance';
      default: return 'Discharge requirement';
    }
  };

  const getGateSpecificContent = () => {
    switch (gate.gate_type) {
      case 'LAB_REPORTS':
        return gate.lab_report_available !== undefined ? (
          <div className="mt-2">
            <span className="text-sm">
              Lab Reports: {gate.lab_report_available ? '✅ Available' : '⚠️ Pending'}
            </span>
          </div>
        ) : null;
      
      case 'PHARMACY':
        return gate.medicines_dispensed !== undefined ? (
          <div className="mt-2">
            <span className="text-sm">
              Medicines: {gate.medicines_dispensed ? '✅ Dispensed' : '⚠️ Pending'}
            </span>
          </div>
        ) : null;
      
      case 'CLEARANCE':
        return gate.clearance_amount !== undefined ? (
          <div className="mt-2">
            <span className="text-sm">
              Amount: ₹{gate.clearance_amount.toLocaleString()}
            </span>
          </div>
        ) : null;
      
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border">
      <div className="flex items-start gap-3">
        <div className="text-3xl">
          {getGateIcon(gate.gate_type)}
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-gray-900">{getGateDisplayName(gate.gate_type)}</h3>
              <p className="text-sm text-gray-500">{getGateDescription(gate.gate_type)}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(gate.gate_status)}`}>
                <span className="mr-1">{getStatusIcon(gate.gate_status)}</span>
                {gate.gate_status}
              </span>
            </div>
          </div>

          {gate.notes && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{gate.notes}</p>
            </div>
          )}

          {getGateSpecificContent()}

          {gate.completed_at && (
            <div className="mt-3 text-xs text-gray-500">
              Completed: {new Date(gate.completed_at).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {isActionable && onStatusChange && gate.gate_status !== 'COMPLETED' && (
        <div className="mt-4 pt-3 border-t">
          <div className="flex gap-2">
            {gate.gate_status === 'PENDING' && (
              <button
                className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                onClick={() => onStatusChange('IN_PROGRESS')}
              >
                Start Processing
              </button>
            )}
            
            {gate.gate_status === 'IN_PROGRESS' && (
              <>
                <button
                  className="flex-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                  onClick={() => onStatusChange('COMPLETED')}
                >
                  Complete Gate
                </button>
                <button
                  className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  onClick={() => onStatusChange('CANCELLED')}
                >
                  Cancel
                </button>
              </>
            )}
            
            {gate.gate_status === 'PENDING' && (
              <button
                className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                onClick={() => onStatusChange('CANCELLED')}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GateCard;