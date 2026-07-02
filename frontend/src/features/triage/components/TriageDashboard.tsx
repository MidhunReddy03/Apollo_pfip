import React, { useState, useEffect } from 'react';
import TriageCard from './TriageCard';
import { TriageRecord, PriorityLevel } from '../types';
import { useTriageApi } from '../hooks/useTriageApi';

const TriageDashboard: React.FC = () => {
  const [records, setRecords] = useState<TriageRecord[]>([]);
  const [filter, setFilter] = useState<'all' | 'P1' | 'P2' | 'P3'>('all');
  const { getTriageRecords, updateTriagePriority } = useTriageApi();

  useEffect(() => {
    loadTriageRecords();
  }, []);

  const loadTriageRecords = async () => {
    try {
      const data = await getTriageRecords();
      setRecords(data);
    } catch (error) {
      console.error('Failed to load triage records:', error);
    }
  };

  const handlePriorityChange = async (recordId: number, newPriority: string) => {
    try {
      await updateTriagePriority(recordId, newPriority as PriorityLevel);
      await loadTriageRecords(); // Refresh the list
    } catch (error) {
      console.error('Failed to update priority:', error);
    }
  };

  const filteredRecords = filter === 'all' 
    ? records 
    : records.filter(r => r.priority === filter);

  const stats = {
    p1: records.filter(r => r.priority === 'P1').length,
    p2: records.filter(r => r.priority === 'P2').length,
    p3: records.filter(r => r.priority === 'P3').length,
    total: records.length,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI-Powered Triage Dashboard</h1>
          <p className="text-gray-600 mt-2">Real-time triage classification and priority management</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <div className="flex items-center">
              <div className="bg-red-100 p-2 rounded-full">
                <span className="text-red-600 text-2xl">🚨</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">P1 - Critical</p>
                <p className="text-2xl font-bold">{stats.p1}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-2 rounded-full">
                <span className="text-yellow-600 text-2xl">⚠️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">P2 - Urgent</p>
                <p className="text-2xl font-bold">{stats.p2}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-full">
                <span className="text-green-600 text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">P3 - Routine</p>
                <p className="text-2xl font-bold">{stats.p3}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-full">
                <span className="text-blue-600 text-2xl">🏥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Patients</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setFilter('all')}
            >
              All Patients ({stats.total})
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${filter === 'P1' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setFilter('P1')}
            >
              Critical ({stats.p1})
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${filter === 'P2' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setFilter('P2')}
            >
              Urgent ({stats.p2})
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${filter === 'P3' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setFilter('P3')}
            >
              Routine ({stats.p3})
            </button>
          </div>
        </div>

        {/* Triage Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.map((record) => (
            <TriageCard
              key={record.id}
              triage={record}
              onPriorityChange={(priority) => handlePriorityChange(record.id, priority)}
            />
          ))}
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏥</div>
            <p className="text-gray-500 text-lg">No triage records found</p>
            <p className="text-gray-400">All patients have been processed</p>
          </div>
        )}

        {/* AI Classification Panel */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">AI Classification Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Common Symptoms</h3>
              <div className="space-y-2">
                {[
                  { symptom: 'Chest Pain', count: 12, severity: 'P1' },
                  { symptom: 'Fever', count: 8, severity: 'P2' },
                  { symptom: 'Headache', count: 15, severity: 'P3' },
                  { symptom: 'Breathing Difficulty', count: 5, severity: 'P1' },
                ].map((item) => (
                  <div key={item.symptom} className="flex justify-between items-center">
                    <span>{item.symptom}</span>
                    <span className={`px-2 py-1 rounded text-xs ${item.severity === 'P1' ? 'bg-red-100 text-red-800' : item.severity === 'P2' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {item.count} cases
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Performance Metrics</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>AI Accuracy</span>
                    <span className="font-semibold">94%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Average Processing Time</span>
                    <span className="font-semibold">0:45</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Nurse Override Rate</span>
                    <span className="font-semibold">12%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '12%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TriageDashboard;