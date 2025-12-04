import { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';

const QRScanner = ({ onScan, onError, isActive = false, className = '' }) => {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Get available video devices
    const getVideoDevices = async () => {
      try {
        const cameras = await QrScanner.listCameras(true);
        setDevices(cameras);
        if (cameras.length > 0) {
          setSelectedDevice(cameras[0].id);
        }
      } catch (err) {
        console.error('Error getting video devices:', err);
        setError('Camera access denied or not available');
        onError?.('Camera access denied or not available');
      }
    };

    if (isActive) {
      getVideoDevices();
    }

    return () => {
      stopScanning();
    };
  }, [isActive]);

  const startScanning = async () => {
    if (!selectedDevice || !videoRef.current) return;
    
    try {
      setError('');
      setIsScanning(true);
      
      scannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          onScan?.(result.data);
          stopScanning();
        },
        {
          onDecodeError: (err) => {
            // Ignore decode errors, keep scanning
          },
          preferredCamera: selectedDevice,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );
      
      await scannerRef.current.start();
    } catch (err) {
      console.error('QR scan error:', err);
      setError('Failed to start camera');
      onError?.('Failed to start camera');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleDeviceChange = (deviceId) => {
    setSelectedDevice(deviceId);
    if (isScanning) {
      stopScanning();
    }
  };

  useEffect(() => {
    if (isActive && selectedDevice && !isScanning) {
      // Auto-start scanning when component becomes active
      const timer = setTimeout(() => {
        startScanning();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isActive, selectedDevice]);

  if (!isActive) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="material-symbols-outlined mr-2 text-blue-600">qr_code_scanner</span>
          Scan QR Code
        </h3>
        <p className="text-sm text-gray-600 mt-1">Point your camera at a QR code to scan</p>
      </div>

      {/* Camera Selection */}
      {devices.length > 1 && (
        <div className="px-4 py-3 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Camera:
          </label>
          <select
            value={selectedDevice}
            onChange={(e) => handleDeviceChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.label || `Camera ${devices.indexOf(device) + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Scanner Interface */}
      <div className="p-4">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <span className="material-symbols-outlined text-red-500 mr-2 text-sm">error</span>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Video Element */}
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full max-w-md mx-auto rounded-lg bg-gray-100"
            style={{ aspectRatio: '1/1' }}
            playsInline
            muted
          />
          
          {/* Scanning Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-blue-500 rounded-lg w-48 h-48 relative">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
            </div>
          </div>

          {/* Scanning Status */}
          {isScanning && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-2 rounded-full flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              <span className="text-sm">Scanning...</span>
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center mt-4 space-x-3">
          {!isScanning ? (
            <button
              onClick={startScanning}
              disabled={!selectedDevice}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              <span className="material-symbols-outlined mr-2 text-sm">play_arrow</span>
              Start Scanning
            </button>
          ) : (
            <button
              onClick={stopScanning}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
            >
              <span className="material-symbols-outlined mr-2 text-sm">stop</span>
              Stop Scanning
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 bg-gray-50 rounded-lg p-3">
          <div className="flex items-start">
            <span className="material-symbols-outlined text-gray-500 mr-2 mt-0.5 text-sm">info</span>
            <div className="text-xs text-gray-600">
              <p className="font-medium mb-1">Scanning Tips:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Ensure good lighting</li>
                <li>Hold camera steady</li>
                <li>Keep QR code within the frame</li>
                <li>Clean your camera lens if needed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;