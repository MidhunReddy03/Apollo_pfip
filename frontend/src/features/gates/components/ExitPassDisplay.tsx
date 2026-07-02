import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Printer, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { ExitPass } from '../types';

interface ExitPassDisplayProps {
  exitPass: ExitPass;
  patientName: string;
  onPrint?: () => void;
}

const ExitPassDisplay: React.FC<ExitPassDisplayProps> = ({ 
  exitPass, 
  patientName,
  onPrint 
}) => {
  const qrRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (qrRef.current) {
      generateQRCode(exitPass.qr_code, qrRef.current);
    }
  }, [exitPass.qr_code]);

  const generateQRCode = (text: string, canvas: HTMLCanvasElement) => {
    // Simplified QR code generation placeholder
    // In production, use a library like qrcode.js or react-qr-code
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 220;
    canvas.width = size;
    canvas.height = size;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QR Code', size / 2, 20);
    ctx.font = '8px monospace';
    ctx.fillText(text.substring(0, 30) + '...', size / 2, size - 15);

    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 25; j++) {
        if (Math.random() > 0.5 && !(i > 20 || i < 3 || j < 3 || j > 20)) {
          ctx.fillRect(i * 8 - 15, j * 8 - 10, 7, 7);
        }
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-300';
      case 'USED': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'EXPIRED': return 'bg-red-100 text-red-800 border-red-300';
      case 'CANCELLED': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="w-4 h-4" />;
      case 'USED': return <CheckCircle className="w-4 h-4" />;
      case 'EXPIRED': return <Clock className="w-4 h-4" />;
      case 'CANCELLED': return <AlertTriangle className="w-4 h-4" />;
      default: return null;
    }
  };

  const isExpired = new Date(exitPass.valid_until) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">Exit Pass</h2>
            <p className="text-blue-100 mt-1">Apollo Hospital</p>
          </div>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20`}>
            {getStatusIcon(exitPass.status)}
            {exitPass.status}
          </div>
        </div>
      </div>

      {/* QR Code */}
      <div className="p-6 flex justify-center">
        <div className="relative">
          <canvas 
            ref={qrRef}
            className="border-4 border-gray-100 rounded-lg shadow-md"
          ></canvas>
          <div className="absolute bottom-2 left-0 right-0 text-center">
            <span className="text-xs bg-white px-2 py-1 rounded shadow-sm">
              Scan for digital pass
            </span>
          </div>
        </div>
      </div>

      {/* Pass Details */}
      <div className="px-6 pb-6">
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Pass Code</p>
              <p className="font-mono font-semibold">{exitPass.pass_code}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Patient</p>
              <p className="font-semibold">{patientName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Encounter ID</p>
              <p className="font-mono">{exitPass.encounter_id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Issued</p>
              <p className="text-sm">
                {new Date(exitPass.issued_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Validity */}
        <div className={`p-4 rounded-lg mb-4 ${
          isExpired ? 'bg-red-50 border border-red-200' : 'bg-green-50'
        }`}>
          <div className="flex items-center gap-3">
            <Clock className={`w-5 h-5 ${isExpired ? 'text-red-500' : 'text-green-500'}`} />
            <div>
              <p className="text-sm font-medium">
                {isExpired ? 'Expired' : 'Valid Until'}
              </p>
              <p className={`text-xs ${isExpired ? 'text-red-600' : 'text-green-700'}`}>
                {new Date(exitPass.valid_until).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Discharge Summary */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2 text-gray-800">Discharge Summary</h3>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            {exitPass.discharge_summary}
          </p>
        </div>

        {/* Follow-up Instructions */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2 text-gray-800">Follow-up Instructions</h3>
          <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            {exitPass.follow_up_instructions}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onPrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={() => {
              const link = document.createElement('a');
              link.download = `exit-pass-${exitPass.pass_code}.png`;
              if (qrRef.current) {
                link.href = qrRef.current.toDataURL('image/png');
                link.click();
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Download className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-3 text-center">
        <p className="text-xs text-gray-500">
          Present this pass at the exit gate. This is an official discharge document.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          QR Code: {exitPass.qr_code}
        </p>
      </div>
    </motion.div>
  );
};

export default ExitPassDisplay;