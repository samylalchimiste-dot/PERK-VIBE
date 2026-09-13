import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { ProfilePhoto } from '../../types';

interface Props {
  photos: ProfilePhoto[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const PhotoGalleryModal: React.FC<Props> = ({ photos, initialIndex = 0, isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, photos.length]);

  if (!isOpen || photos.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const currentPhoto = photos[currentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-4 animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between z-10 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span>{currentIndex + 1} / {photos.length}</span>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 rounded-full border border-slate-800 transition"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image Stage */}
      <div className="relative flex-1 flex items-center justify-center max-w-4xl mx-auto w-full my-4 overflow-hidden">
        {photos.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 z-10 p-3 text-white bg-slate-900/80 hover:bg-slate-800 rounded-full border border-slate-700/60 shadow-xl transition active:scale-95"
            aria-label="Photo précédente"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <img
          src={currentPhoto.url}
          alt={`Photo ${currentIndex + 1}`}
          referrerPolicy="no-referrer"
          className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl transition-all duration-300"
        />

        {photos.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-2 z-10 p-3 text-white bg-slate-900/80 hover:bg-slate-800 rounded-full border border-slate-700/60 shadow-xl transition active:scale-95"
            aria-label="Photo suivante"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Thumbnails list */}
      {photos.length > 1 && (
        <div className="flex items-center justify-center gap-2 overflow-x-auto max-w-4xl mx-auto w-full py-2">
          {photos.map((photo, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                idx === currentIndex ? 'border-cyan-400 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={photo.url}
                alt={`Miniature ${idx + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
