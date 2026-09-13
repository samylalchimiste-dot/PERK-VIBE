import React, { useState, useRef } from 'react';
import { UploadCloud, X, Star, CheckCircle, AlertCircle, Image as ImageIcon, Loader2 } from 'lucide-react';
import { ProfilePhoto } from '../../types';
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE_MB, MAX_FILE_SIZE_BYTES } from '../../services/firebase/storage';

export interface PendingPhoto {
  id: string;
  file?: File;
  previewUrl: string;
  existingPhoto?: ProfilePhoto;
  isPrimary: boolean;
  order: number;
  uploadProgress?: number;
  error?: string;
}

interface Props {
  photos: PendingPhoto[];
  onChange: (photos: PendingPhoto[]) => void;
  disabled?: boolean;
}

export const PhotoUploader: React.FC<Props> = ({ photos, onChange, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (fileList: FileList | File[]) => {
    setErrorMessage(null);
    const newItems: PendingPhoto[] = [];

    Array.from(fileList).forEach((file, idx) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setErrorMessage(`Format ignoré pour ${file.name} (seuls JPG, PNG, WEBP sont autorisés).`);
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setErrorMessage(`${file.name} dépasse la taille max (${MAX_FILE_SIZE_MB} Mo).`);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      const isFirst = photos.length === 0 && idx === 0;

      newItems.push({
        id: `pending-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl,
        isPrimary: isFirst,
        order: photos.length + idx,
        uploadProgress: 0,
      });
    });

    if (newItems.length > 0) {
      const updated = [...photos, ...newItems];
      // Ensure at least one is primary
      if (!updated.some(p => p.isPrimary) && updated.length > 0) {
        updated[0].isPrimary = true;
      }
      onChange(updated);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSetPrimary = (index: number) => {
    if (disabled) return;
    const updated = photos.map((p, idx) => ({
      ...p,
      isPrimary: idx === index,
    }));
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    if (disabled) return;
    const itemToRemove = photos[index];
    if (itemToRemove.previewUrl && !itemToRemove.existingPhoto) {
      URL.revokeObjectURL(itemToRemove.previewUrl);
    }

    const updated = photos.filter((_, idx) => idx !== index).map((p, idx) => ({
      ...p,
      order: idx,
    }));

    // If we removed the primary photo, assign primary to first remaining
    if (itemToRemove.isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }

    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
            Galerie Photos (Firebase Storage)
          </label>
          <p className="text-xs text-slate-400">
            JPG, PNG, WEBP (Max {MAX_FILE_SIZE_MB} Mo par photo). Définissez une photo principale avec l'étoile.
          </p>
        </div>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/50">
          {photos.length} photo{photos.length > 1 ? 's' : ''}
        </span>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Drag and drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
          isDragging
            ? 'border-cyan-400 bg-cyan-500/10'
            : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/40'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-cyan-400 border border-slate-800 shadow-inner">
          <UploadCloud className="w-6 h-6" />
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-200">
            Glissez-déposez vos photos ici, ou <span className="text-cyan-400 underline">parcourez</span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Stockées sous <code className="text-slate-400">profiles/&#123;id&#125;/original/</code>
          </p>
        </div>
      </div>

      {/* Previews Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
          {photos.map((item, idx) => (
            <div
              key={item.id}
              className={`relative group aspect-square rounded-xl overflow-hidden bg-slate-950 border-2 transition ${
                item.isPrimary ? 'border-amber-400 shadow-lg shadow-amber-500/10' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <img
                src={item.previewUrl}
                alt={`Photo ${idx + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />

              {/* Upload Progress Overlay */}
              {item.uploadProgress !== undefined && item.uploadProgress > 0 && item.uploadProgress < 100 && (
                <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center p-2">
                  <Loader2 className="w-6 h-6 text-cyan-400 animate-spin mb-1" />
                  <span className="text-xs font-mono font-bold text-white">{item.uploadProgress}%</span>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="bg-cyan-400 h-full transition-all duration-150"
                      style={{ width: `${item.uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Badges */}
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetPrimary(idx);
                  }}
                  disabled={disabled}
                  className={`pointer-events-auto p-1.5 rounded-lg text-xs font-semibold backdrop-blur-md transition ${
                    item.isPrimary
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-950/70 text-slate-300 hover:text-amber-400 hover:bg-slate-900'
                  }`}
                  title={item.isPrimary ? 'Photo principale' : 'Définir comme photo principale'}
                >
                  <Star className={`w-3.5 h-3.5 ${item.isPrimary ? 'fill-slate-950' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(idx);
                  }}
                  disabled={disabled}
                  className="pointer-events-auto p-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-600 text-white backdrop-blur-md transition shadow-md"
                  title="Supprimer cette photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {item.isPrimary && (
                <div className="absolute bottom-2 left-2 right-2">
                  <span className="block text-center text-[10px] font-bold bg-amber-500/90 text-slate-950 rounded py-0.5 backdrop-blur-md">
                    Principale
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
