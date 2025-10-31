'use client';

import { useCallback } from 'react';
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react';

interface DocumentUploadZoneProps {
  type: 'boardingPass' | 'delayProof';
  file: File | null;
  fileUrl?: string;
  isUploading: boolean;
  error?: string;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
}

export default function DocumentUploadZone({
  type,
  file,
  fileUrl,
  isUploading,
  error,
  onFileSelect,
  onFileRemove,
}: DocumentUploadZoneProps) {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        onFileSelect(droppedFile);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        onFileSelect(selectedFile);
      }
    },
    [onFileSelect]
  );

  const inputId = `file-upload-${type}`;

  return (
    <div className="space-y-2">
      {!file && !fileUrl && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-8
            transition-colors duration-200
            ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'}
            ${isUploading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
          `}
        >
          <input
            id={inputId}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileInput}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className={`p-4 rounded-full ${error ? 'bg-red-100' : 'bg-blue-100'}`}>
              {isUploading ? (
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
              ) : error ? (
                <AlertCircle className="h-8 w-8 text-red-600" />
              ) : (
                <Upload className="h-8 w-8 text-blue-600" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                {isUploading ? 'Uploading...' : 'Drop your file here or click to browse'}
              </p>
              <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG (max 5MB)</p>
            </div>
          </div>
        </div>
      )}

      {(file || fileUrl) && (
        <div
          className={`
            flex items-center justify-between p-4 rounded-lg border
            ${error ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}
          `}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded ${error ? 'bg-red-100' : 'bg-green-100'}`}>
              {error ? (
                <AlertCircle className="h-5 w-5 text-red-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file?.name || 'Uploaded document'}
              </p>
              {file && (
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onFileRemove}
            disabled={isUploading}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
            aria-label="Remove file"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
}

