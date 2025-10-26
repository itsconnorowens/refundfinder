'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, X, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface MobileFileUploadProps {
  onFileUploaded: (file: File, url: string) => void;
  accept?: string;
  maxSize?: number;
  label?: string;
  description?: string;
  type: 'boardingPass' | 'delayProof';
  initialFile?: File | null;
  existingUrl?: string;
}

export function MobileFileUpload({ 
  onFileUploaded, 
  accept = 'image/*,.pdf', 
  maxSize = 5 * 1024 * 1024,
  label,
  description,
  type,
  initialFile,
  existingUrl
}: MobileFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | undefined>(existingUrl);
  const [uploadedFile, setUploadedFile] = useState<File | null>(initialFile || null);

  const handleFile = async (file: File) => {
    // Validate file size
    if (file.size > maxSize) {
      alert(`File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    setIsUploading(true);
    
    // Show preview if image
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }

    // Upload to API
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', type);

    try {
      const response = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const result = await response.json();
      
      setUploadedFile(file);
      setUploadedUrl(result.url);
      onFileUploaded(file, result.url);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setUploadedUrl(undefined);
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      {label && (
        <div>
          <Label className="text-sm font-medium">
            {label}
          </Label>
          {description && (
            <p className="text-xs text-slate-500 mt-1">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="relative rounded-lg overflow-hidden border-2 border-[#00D9B5]">
          <img src={preview} alt="Preview" className="w-full h-auto" />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Uploaded file info */}
      {uploadedFile && !preview && (
        <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-lg border border-slate-700">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-[#00D9B5]/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#00D9B5]" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">
              {uploadedFile.name}
            </p>
            <p className="text-xs text-slate-500">
              {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          {uploadedUrl && (
            <div className="flex-shrink-0">
              <Check className="w-5 h-5 text-green-500" />
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Upload buttons */}
      {!uploadedFile && (
        <div className="grid grid-cols-2 gap-3">
          {/* Camera Capture */}
          <Button
            type="button"
            variant="outline"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isUploading}
            className="flex flex-col items-center justify-center h-24 border-2 border-dashed hover:border-[#00D9B5] transition-colors"
          >
            {isUploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00D9B5]" />
            ) : (
              <>
                <Camera className="w-6 h-6 mb-2 text-[#00D9B5]" />
                <span className="text-xs font-medium">Take Photo</span>
              </>
            )}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </Button>

          {/* File Upload */}
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex flex-col items-center justify-center h-24 border-2 border-dashed hover:border-[#00D9B5] transition-colors"
          >
            {isUploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00D9B5]" />
            ) : (
              <>
                <Upload className="w-6 h-6 mb-2 text-[#00D9B5]" />
                <span className="text-xs font-medium">Choose File</span>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </Button>
        </div>
      )}

      {/* Drag and drop zone for desktop */}
      {!uploadedFile && !isUploading && (
        <div className="hidden md:flex items-center justify-center min-h-[100px] border-2 border-dashed border-slate-700 rounded-lg hover:border-[#00D9B5] transition-colors cursor-pointer">
          <div className="text-center">
            <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400">
              Drag and drop or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[#00D9B5] hover:underline"
              >
                browse files
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

