import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import ReactCrop, { type PixelCrop, centerCrop, makeAspectCrop, type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Check, ArrowRight, Loader2, Scissors, Plus, Minus, ZoomIn } from 'lucide-react';
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
  const [zoom, setZoom] = useState(1);
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

  const handleSelectAll = useCallback(() => {
    setIsCustom(false);
    setCurrentRatio(undefined);
    
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop({
        unit: '%',
        x: 0,
        y: 0,
        width: 100,
        height: 100
      });
      setCompletedCrop({
        unit: 'px',
        x: 0,
        y: 0,
        width: width,
        height: height
      });
    }
  }, []);

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
    setZoom(1);
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl p-0 border-none bg-transparent shadow-none z-[9999]">
        <DialogTitle className="sr-only">Crop Image</DialogTitle>
        <div className="relative w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Scissors size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Crop Image</h3>
                <p className="text-[10px] text-slate-500 font-medium tracking-tight">Image {currentIndex + 1} of {files.length}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 text-[10px] font-bold border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-9 px-6 text-[10px] font-bold shadow-lg shadow-primary/20"
                icon={isProcessing ? Loader2 : (currentIndex === files.length - 1 ? Check : ArrowRight)}
                onClick={handleNext}
                disabled={isProcessing || !crop}
              >
                {isProcessing ? 'Saving...' : (currentIndex === files.length - 1 ? 'Finish & Upload' : 'Next')}
              </Button>
            </div>
          </div>

          {/* Cropper Container */}
          <div className="relative flex-1 bg-slate-100 dark:bg-slate-950 flex overflow-hidden min-h-[400px]">
            {/* Zoom Slider Sidebar */}
            <div className="flex flex-col items-center gap-4 p-4 border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10">
              <button 
                onClick={() => setZoom(z => Math.min(3, z + 0.2))}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary transition-all active:scale-90"
                title="Zoom In"
              >
                <Plus size={16} />
              </button>
              
              <div className="flex-1 w-12 relative flex items-center justify-center py-2">
                <input 
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="h-full w-1 accent-primary cursor-ns-resize"
                  style={{ 
                    writingMode: 'bt-lr',
                    WebkitAppearance: 'slider-vertical',
                    height: '100%'
                  } as any}
                />
              </div>

              <button 
                onClick={() => setZoom(z => Math.max(1, z - 0.2))}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary transition-all active:scale-90"
                title="Zoom Out"
              >
                <Minus size={16} />
              </button>
              
              <div className="flex flex-col items-center gap-1">
                <ZoomIn size={14} className="text-slate-400" />
                <span className="text-[10px] font-black text-slate-500">{Math.round(zoom * 100)}%</span>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-8 flex justify-center items-start custom-scrollbar">
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
                  className="max-w-full h-auto block transition-transform duration-200 ease-out origin-top-left"
                  style={{ transform: `scale(${zoom})` }}
                  onLoad={onImageLoad}
                  alt="Crop source"
                />
              </ReactCrop>
            </div>
          </div>

          {/* Controls - only show if there are ratio controls */}
          {aspectRatio === "Free" && (
            <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex justify-between items-center">
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
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Whole Image
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
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropperModal;
