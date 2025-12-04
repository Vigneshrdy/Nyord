import { useState, useRef } from 'react';
import QrScanner from 'qr-scanner';

const QRUploader = ({ onScan, onError, className = '' }) => {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [error, setError] = useState('');

  const processQRImage = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      onError?.('Please upload a valid image file');
      return;
    }

    setIsProcessing(true);
    setError('');
    
    try {
      // Create image preview
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);

      // Decode QR from image
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      
      if (result && result.data) {
        onScan?.(result.data);
      } else {
        throw new Error('No QR code found in image');
      }
    } catch (err) {
      console.error('QR decode error:', err);
      setError('No valid QR code found in the image. Please try another image.');
      onError?.('No valid QR code found in the image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processQRImage(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processQRImage(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    setUploadedImage(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="material-symbols-outlined mr-2 text-green-600">upload</span>
          Upload QR Code
        </h3>
        <p className="text-sm text-gray-600 mt-1">Upload an image containing a QR code</p>
      </div>

      <div className="p-4">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <span className="material-symbols-outlined text-red-500 mr-2 text-sm">error</span>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Upload Area */}
        {!uploadedImage && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={openFileDialog}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
              ${dragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-gray-500">
                  {dragOver ? 'file_download' : 'cloud_upload'}
                </span>
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {dragOver ? 'Drop image here' : 'Upload QR Code Image'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Drag and drop an image file, or click to select
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Choose File
                </button>
              </div>

              <div className="text-xs text-gray-500">
                Supports: JPG, PNG, GIF, WEBP
              </div>
            </div>

            {isProcessing && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-sm text-gray-700">Processing image...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Image Preview */}
        {uploadedImage && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">Uploaded Image</h4>
                <button
                  onClick={clearImage}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center"
                >
                  <span className="material-symbols-outlined text-sm mr-1">delete</span>
                  Remove
                </button>
              </div>
              
              <div className="relative">
                <img
                  src={uploadedImage}
                  alt="Uploaded QR Code"
                  className="max-w-full max-h-64 mx-auto rounded border"
                />
                
                {isProcessing && (
                  <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                      <span className="text-sm text-gray-700">Scanning...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={openFileDialog}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center"
              >
                <span className="material-symbols-outlined text-sm mr-2">swap_horiz</span>
                Upload Different Image
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 rounded-lg p-3">
          <div className="flex items-start">
            <span className="material-symbols-outlined text-blue-500 mr-2 mt-0.5 text-sm">lightbulb</span>
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">Upload Tips:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Ensure the QR code is clearly visible</li>
                <li>Avoid blurry or low-quality images</li>
                <li>Make sure the entire QR code is in the frame</li>
                <li>Good lighting improves detection accuracy</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRUploader;