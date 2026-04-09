import React, { useCallback } from 'react';
import { useDropzone, type Accept } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ImageUploadProps {
  label: string;
  description?: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  className?: string;
}

const accept: Accept = { 'image/*': [] };

export function ImageUpload({ label, description, value, onChange, className }: ImageUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: false
  });

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {value ? (
        <div className="relative group aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          <img src={value} alt={label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "aspect-video rounded-lg border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-4 text-center",
            isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 bg-gray-50"
          )}
        >
          <input {...getInputProps()} />
          <div className="p-3 rounded-full bg-white shadow-sm mb-3">
            <Upload className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900">Click or drag to upload</p>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
      )}
    </div>
  );
}
