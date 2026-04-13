import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactCrop, { type PixelCrop, centerCrop, makeAspectCrop, type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Check, ArrowRight, Loader2, Scissors } from 'lucide-react';
import Button from './Button';
import getCroppedImg from '@/utils/getCroppedImg';
import { cn } from '@/utils/cn';

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: File[];
  onComplete: (results: { cropped: File, original: File }[]) => void;
  aspectRatio?: string; // e.g. "1:1", "16:9", "4:3", "Free"
}

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ 
  isOpen, 
  onClose, 
  files, 
  onComplete,
  aspectRatio = "1:1"
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [results, setResults] = useState<{ cropped: File, original: File }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalRatio, setOriginalRatio] = useState<number | undefined>(undefined);
  const [isCustom, setIsCustom] = useState(false);
  const [customW, setCustomW] = useState(1);
  const [customH, setCustomH] = useState(1);

  const getNumericAspect = useCallback((ratio: string) => {
    if (!ratio || ratio === "Free") return undefined;
    const parts = ratio.split(':');
    if (parts.length === 2) {
      const w = Number(parts[0].trim());
      const h = Number(parts[1].trim());
      if (!isNaN(w) && !isNaN(h) && h !== 0) return w / h;
    }
    return undefined;
  }, []);

  const [currentRatio, setCurrentRatio] = useState<number | undefined>(getNumericAspect(aspectRatio));

  // Sync currentRatio if prop changes
  useEffect(() => {
    setCurrentRatio(getNumericAspect(aspectRatio));
  }, [aspectRatio, getNumericAspect]);

  // Disable body scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'auto';
      };
    }
  }, [isOpen]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const ratio = width / height;
    setOriginalRatio(ratio);

    // Initial center crop
    const useAspect = currentRatio;
    const initialCrop = centerCrop(
      makeAspectCrop(
        { unit: '%', width: 90 },
        useAspect || 1,
        width,
        height
      ),
      width,
      height
    );
    setCrop(initialCrop);
  }, [currentRatio]);

  const QUICK_RATIOS = [
    { label: "1:1", value: 1 },
    { label: "4:5", value: 0.8 },
    { label: "16:9", value: 1.77 },
    { label: "3:2", value: 1.5 },
  ];

  if (originalRatio) {
    const originalLabel = "Original";
    if (!QUICK_RATIOS.find(r => r.label === originalLabel)) {
      QUICK_RATIOS.unshift({ label: originalLabel, value: originalRatio });
    }
  }

  const handleRatioChange = useCallback((value: number | undefined) => {
    setCurrentRatio(value);
    setIsCustom(false);
    
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      const newCrop = centerCrop(
        makeAspectCrop(
          { unit: '%', width: 90 },
          value || 1,
          width,
          height
        ),
        width,
        height
      );
      setCrop(newCrop);
    }
  }, []);

  const handleCustomRatioChange = useCallback(() => {
    if (customW > 0 && customH > 0) {
      const ratio = customW / customH;
      setCurrentRatio(ratio);
      if (imgRef.current) {
        const { width, height } = imgRef.current;
        const newCrop = centerCrop(
          makeAspectCrop({ unit: '%', width: 90 }, ratio, width, height),
          width,
          height
        );
        setCrop(newCrop);
      }
    }
  }, [customW, customH]);

  useEffect(() => {
    if (isCustom) handleCustomRatioChange();
  }, [handleCustomRatioChange, isCustom]);

  // Sync crop when currentRatio changes (e.g. via prop or quick-toggle)
  useEffect(() => {
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      const newCrop = centerCrop(
        makeAspectCrop(
          { unit: '%', width: 90 },
          currentRatio || 1,
          width,
          height
        ),
        width,
        height
      );
      setCrop(newCrop);
    }
  }, [currentRatio]);

  const handleNext = async () => {
    if (!completedCrop || !imgRef.current) return;

    setIsProcessing(true);
    try {
      const currentFile = files[currentIndex];
      const imageSrc = URL.createObjectURL(currentFile);
      const croppedFile = await getCroppedImg(
        imageSrc, 
        completedCrop, 
        `cropped_${currentIndex}_${currentFile.name}`
      );
      
      const newResult = { cropped: croppedFile, original: currentFile };
      const nextResults = [...results, newResult];
      setResults(nextResults);

      if (currentIndex < files.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setOriginalRatio(undefined);
      } else {
        onComplete(nextResults);
        handleClose();
      }
    } catch (err) {
      console.error('Cropping failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setCurrentIndex(0);
    setResults([]);
    setOriginalRatio(undefined);
    setIsCustom(false);
    onClose();
  };

  const currentImageUrl = useMemo(() => {
    if (files[currentIndex]) {
      return URL.createObjectURL(files[currentIndex]);
    }
    return '';
  }, [files, currentIndex]);

  useEffect(() => {
    return () => {
      if (currentImageUrl) {
        URL.revokeObjectURL(currentImageUrl);
      }
    };
  }, [currentImageUrl]);

  if (!isOpen || files.length === 0) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={handleClose} />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Scissors size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Crop Image</h3>
              <p className="text-xs text-slate-500 font-medium tracking-tight">Image {currentIndex + 1} of {files.length} • Mode: {aspectRatio}</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Cropper Container */}
        <div className="relative min-h-[400px] max-h-[60vh] bg-slate-100 dark:bg-slate-950 overflow-auto p-4 flex justify-center items-start">
          <ReactCrop
            crop={crop}
            onChange={(c: any) => setCrop(c)}
            onComplete={(c: any) => setCompletedCrop(c)}
            aspect={aspectRatio === "Free" ? (isCustom ? currentRatio : undefined) : currentRatio}
            className="max-w-full"
          >
            <img 
              ref={imgRef}
              src={currentImageUrl} 
              className="max-w-full h-auto block"
              onLoad={onImageLoad}
              alt="Crop source"
            />
          </ReactCrop>
        </div>

        {/* Controls */}
        <div className="p-8 space-y-8">
          <div className="flex flex-col gap-6">
            {aspectRatio === "Free" && (
              <div className="space-y-4">
                <div className="text-xs font-black uppercase tracking-widest text-slate-400 flex justify-between items-center">
                  <span>Aspect Ratio</span>
                  {isCustom && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
                      <input 
                        type="number" 
                        value={customW} 
                        onChange={(e) => setCustomW(Math.max(0.1, Number(e.target.value)))}
                        className="w-10 h-6 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-center rounded focus:outline-none focus:ring-1 focus:ring-primary border-none"
                      />
                      <span className="text-[10px]">:</span>
                      <input 
                        type="number" 
                        value={customH} 
                        onChange={(e) => setCustomH(Math.max(0.1, Number(e.target.value)))}
                        className="w-10 h-6 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-center rounded focus:outline-none focus:ring-1 focus:ring-primary border-none"
                      />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
                  {QUICK_RATIOS.map((ratio) => (
                    <button
                      key={ratio.label}
                      onClick={() => handleRatioChange(ratio.value)}
                      className={cn(
                        "px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                        !isCustom && currentRatio === ratio.value 
                          ? "bg-white dark:bg-slate-700 text-primary shadow-sm" 
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      {ratio.label}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                       setCurrentRatio(undefined);
                       setIsCustom(false);
                    }}
                    className={cn(
                      "px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                      !isCustom && currentRatio === undefined 
                        ? "bg-white dark:bg-slate-700 text-primary shadow-sm" 
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    Free
                  </button>
                  <button
                    onClick={() => setIsCustom(true)}
                    className={cn(
                      "px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                      isCustom 
                        ? "bg-white dark:bg-slate-700 text-primary shadow-sm" 
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    Custom
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-2">
              <Button
                variant="outline"
                className="flex-1 h-14 bg-slate-50 dark:bg-slate-800 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-14 shadow-xl shadow-primary/20"
                icon={isProcessing ? Loader2 : (currentIndex === files.length - 1 ? Check : ArrowRight)}
                onClick={handleNext}
                disabled={isProcessing || !crop}
              >
                {isProcessing ? 'Processing...' : (currentIndex === files.length - 1 ? 'Finish & Upload' : 'Next Image')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;
