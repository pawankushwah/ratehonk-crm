import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Trash2, 
  Copy,
  Layers, 
  RotateCcw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize,
  ZoomIn,
  ZoomOut,
  MousePointer2,
  Navigation
} from 'lucide-react';
import { ComponentRegistry } from './StudioComponents';
import { type CanvasElement } from './Presets';

interface CanvasProps {
  elements: CanvasElement[];
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onRemoveElement: (id: string) => void;
  activeElementId: string | null;
  setActiveElementId: (id: string | null) => void;
  formFields: any[];
  mockData: Record<string, any>;
  isCardLight: boolean;
  isGlobalLight: boolean;
  styles: any;
  isPreviewMode?: boolean;
  zoom: number;
  setZoom: (zoom: number | ((z: number) => number)) => void;
  pan: { x: number; y: number };
  setPan: (pan: { x: number; y: number } | ((p: { x: number; y: number }) => { x: number; y: number })) => void;
  isHandTool: boolean;
  setIsHandTool: (is: boolean) => void;
  canvasWidth: number;
  setCanvasWidth: (w: number) => void;
  canvasHeight?: number;
  setCanvasHeight?: (h: number) => void;
  activePageId: 'card' | 'view';
  onLayerAction: (id: string, action: 'top' | 'bottom' | 'forward' | 'backward') => void;
  onAlignAction: (id: string, alignment: any) => void;
  onDragEnd?: () => void;
  rootStyles?: any;
  aspectRatio?: string;
}

const CANVAS_ASPECT_RATIOS: Record<string, string> = {
  "auto": "min-h-[850px]",
  "square": "aspect-square",
  "portrait": "aspect-[3/4]",
  "landscape": "aspect-[16/9]",
  "tall": "aspect-[2/3]"
};

export const StudioCanvas: React.FC<CanvasProps> = ({ 
  elements, 
  onUpdateElement, 
  onRemoveElement, 
  activeElementId, 
  setActiveElementId, 
  formFields, 
  mockData, 
  isCardLight, 
  isGlobalLight, 
  styles, 
  isPreviewMode, 
  zoom, 
  setZoom, 
  pan, 
  setPan, 
  isHandTool, 
  canvasWidth,
  canvasHeight,
  onLayerAction,
  onAlignAction,
  onDragEnd,
  aspectRatio
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isEditingId, setIsEditingId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{ id: string; type: 'move' | 'resize' | 'rotate'; startX: number; startY: number; startVal: any; handle?: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const [guides, setGuides] = useState<{ x?: number[]; y?: number[] }>({});


  const handleFitToScreen = useCallback(() => {
    if (!boardRef.current) return;
    const board = boardRef.current.getBoundingClientRect();
    const margin = 80;
    const availableW = board.width - margin * 2;
    const availableH = board.height - margin * 2;
    const scale = Math.min(availableW / canvasWidth, availableH / (canvasHeight || 850)) * 100;
    setZoom(Math.floor(scale));
    setPan({ x: 0, y: 0 });
  }, [canvasWidth, setZoom, setPan]);

  useEffect(() => {
    handleFitToScreen();
  }, []);

  const handleZoom = useCallback((delta: number) => setZoom(prev => Math.min(Math.max(10, prev + delta), 300)), [setZoom]);

  const renderElement = (el: CanvasElement) => {
    const Component = ComponentRegistry[el.type] || ComponentRegistry['TitleSection'];
    const isActive = activeElementId === el.id;

    const elementStyle: React.CSSProperties = {
      position: 'absolute',
      left: el.x,
      top: el.y,
      width: el.width,
      height: el.height,
      zIndex: el.zIndex,
      transform: `rotate(${el.rotation}deg)`,
      pointerEvents: isHandTool ? 'none' : 'auto',
      opacity: el.opacity !== undefined ? el.opacity : 1
    };

    return (
      <div 
        key={el.id}
        style={elementStyle}
        className={`group transition-shadow duration-300 ${isActive ? 'ring-2 ring-primary ring-offset-2' : ''} ${isPreviewMode ? '' : 'cursor-move'}`}
        onMouseDown={(e) => {
          if (isPreviewMode || isHandTool || isEditingId === el.id) return;
          e.stopPropagation();
          setActiveElementId(el.id);
          if (e.button === 0) setDragState({ id: el.id, type: 'move', startX: e.clientX, startY: e.clientY, startVal: { x: el.x, y: el.y } });
        }}
        onDoubleClick={(e) => {
          if (isPreviewMode || el.type !== 'Text') return;
          e.stopPropagation();
          setIsEditingId(el.id);
        }}
        onContextMenu={(e) => {
          if (isPreviewMode) return;
          e.preventDefault();
          e.stopPropagation();
          setActiveElementId(el.id);
          setContextMenu({ x: e.clientX, y: e.clientY, id: el.id });
        }}
      >
        <div className="w-full h-full pointer-events-none select-none overflow-hidden">
          {isEditingId === el.id ? (
            <textarea
              autoFocus
              className="w-full h-full bg-transparent border-none outline-none resize-none p-0 m-0 pointer-events-auto select-text font-inherit text-inherit leading-inherit"
              style={{ 
                fontSize: `${el.props.fontSize}px`, 
                fontWeight: el.props.fontWeight,
                textAlign: el.props.textAlign as any, 
                color: el.props.color === 'inherit' ? (isCardLight ? '#0F172A' : '#F1F5F9') : el.props.color
              }}
              value={el.props.content}
              onChange={(e) => onUpdateElement(el.id, { props: { ...el.props, content: e.target.value } })}
              onBlur={() => setIsEditingId(null)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsEditingId(null);
                e.stopPropagation();
              }}
            />
          ) : (
            <Component 
              type={el.type} 
              props={el.props} 
              style={el.style || {}}
              formFields={formFields} 
              mockData={mockData}
              isLight={isCardLight}
            />
          )}
        </div>

        {!isPreviewMode && isActive && !el.locked && (
          <div className="absolute inset-0 border-2 border-primary pointer-events-none z-999 shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-pulse shadow-primary/20">
            <div className="absolute -top-3 -left-3 w-6 h-6 bg-white border-2 border-primary rounded-full cursor-nwse-resize pointer-events-auto" onMouseDown={(e) => { e.stopPropagation(); setDragState({ id: el.id, type: 'resize', handle: 'nw', startX: e.clientX, startY: e.clientY, startVal: { x: el.x, y: el.y, w: el.width, h: el.height } }); }} />
            <div className="absolute -top-3 -right-3 w-6 h-6 bg-white border-2 border-primary rounded-full cursor-nesw-resize pointer-events-auto" onMouseDown={(e) => { e.stopPropagation(); setDragState({ id: el.id, type: 'resize', handle: 'ne', startX: e.clientX, startY: e.clientY, startVal: { x: el.x, y: el.y, w: el.width, h: el.height } }); }} />
            <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-white border-2 border-primary rounded-full cursor-nesw-resize pointer-events-auto" onMouseDown={(e) => { e.stopPropagation(); setDragState({ id: el.id, type: 'resize', handle: 'sw', startX: e.clientX, startY: e.clientY, startVal: { x: el.x, y: el.y, w: el.width, h: el.height } }); }} />
            <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-white border-2 border-primary rounded-full cursor-nwse-resize pointer-events-auto" onMouseDown={(e) => { e.stopPropagation(); setDragState({ id: el.id, type: 'resize', handle: 'se', startX: e.clientX, startY: e.clientY, startVal: { x: el.x, y: el.y, w: el.width, h: el.height } }); }} />
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-8 h-8 bg-white border-2 border-primary rounded-full cursor-crosshair flex items-center justify-center pointer-events-auto group/rot shadow-lg" onMouseDown={(e) => { e.stopPropagation(); setDragState({ id: el.id, type: 'rotate', startX: e.clientX, startY: e.clientY, startVal: el.rotation }); }}>
              <Navigation size={12} className="text-primary group-hover/rot:scale-125 transition-transform" />
            </div>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const handleNativeWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        handleZoom(e.deltaY > 0 ? -5 : 5);
      } else {
        setPan(prev => ({
          x: e.shiftKey ? prev.x - e.deltaY : prev.x,
          y: e.shiftKey ? prev.y : prev.y - e.deltaY
        }));
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleNativeWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleNativeWheel);
    }
  }, [handleZoom, setPan]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        setPan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
        return;
      }

      if (dragState) {
        const dx = (e.clientX - dragState.startX) / (zoom / 100);
        const dy = (e.clientY - dragState.startY) / (zoom / 100);

        if (dragState.type === 'move') {
        let newX = dragState.startVal.x + dx;
        let newY = dragState.startVal.y + dy;

        // --- MAGNETIC SNAPPING ---
        const SNAP_THRESHOLD = 5;
        const activeEl = elements.find(el => el.id === dragState.id)!;
        const otherEls = elements.filter(el => el.id !== dragState.id);
        const newGuides: { x?: number[]; y?: number[] } = { x: [], y: [] };

        const checkSnapX = (val: number, target: number) => Math.abs(val - target) < SNAP_THRESHOLD;
        const checkSnapY = (val: number, target: number) => Math.abs(val - target) < SNAP_THRESHOLD;

        // Snapping Targets (Page boundaries & Centers)
        const targetsX = [0, canvasWidth / 2, canvasWidth];
        const targetsY = [0, (canvasHeight || 850) / 2, (canvasHeight || 850)]; // Page height approx

        otherEls.forEach(el => {
          targetsX.push(el.x, el.x + el.width / 2, el.x + el.width);
          targetsY.push(el.y, el.y + el.height / 2, el.y + el.height);
        });

        // Snap X
        let snappedX = false;
        [newX, newX + activeEl.width / 2, newX + activeEl.width].forEach((edge, i) => {
          if (snappedX) return;
          targetsX.forEach(t => {
            if (checkSnapX(edge, t)) {
              newX = t - (i === 0 ? 0 : (i === 1 ? activeEl.width / 2 : activeEl.width));
              newGuides.x!.push(t);
              snappedX = true;
            }
          });
        });

        // Snap Y
        let snappedY = false;
        [newY, newY + activeEl.height / 2, newY + activeEl.height].forEach((edge, i) => {
          if (snappedY) return;
          targetsY.forEach(t => {
            if (checkSnapY(edge, t)) {
              newY = t - (i === 0 ? 0 : (i === 1 ? activeEl.height / 2 : activeEl.height));
              newGuides.y!.push(t);
              snappedY = true;
            }
          });
        });

        setGuides(newGuides);
        onUpdateElement(dragState.id, { x: Math.round(newX), y: Math.round(newY) });
      } else if (dragState.type === 'resize') {
          const { x, y, w, h } = dragState.startVal;
          const updates: any = {};
          if (dragState.handle?.includes('e')) updates.width = Math.max(20, w + dx);
          if (dragState.handle?.includes('w')) { updates.width = Math.max(20, w - dx); updates.x = x + dx; }
          if (dragState.handle?.includes('s')) updates.height = Math.max(20, h + dy);
          if (dragState.handle?.includes('n')) { updates.height = Math.max(20, h - dy); updates.y = y + dy; }
          onUpdateElement(dragState.id, updates);
        } else if (dragState.type === 'rotate') {
          const deltaX = (e.clientX - dragState.startX);
          const angle = deltaX * 0.5;
          onUpdateElement(dragState.id, { rotation: dragState.startVal + angle });
        }
      }
    };

    const handleMouseUp = () => {
      if (dragState) {
        setGuides({});
        if (onDragEnd) onDragEnd();
      }
      setDragState(null);
      setIsPanning(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, isPanning, zoom, onUpdateElement, setPan]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isHandTool || e.button === 1) setIsPanning(true);
    else if (e.target === canvasRef.current || e.target === boardRef.current) {
      setActiveElementId(null);
      setContextMenu(null);
    }
  };

  return (
    <div 
       ref={canvasRef}
       className={`flex-1 h-full relative overflow-hidden transition-colors duration-700 bg-grid ${isGlobalLight ? 'bg-[#E1E2E5]' : 'bg-[#040405]'} ${isHandTool ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
       onMouseDown={handleMouseDown}
    >
      <div 
        ref={boardRef}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
          transition: (isPanning || dragState) ? 'none' : 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)', 
        }}
      >
        <div 
          ref={pageRef}
          className={`relative pointer-events-auto transition-all shadow-[0_60px_120px_-30px_rgba(0,0,0,0.3)] ${styles?.borderRadius || 'rounded-[4rem]'} ${CANVAS_ASPECT_RATIOS[aspectRatio || 'auto']}`}
          style={{ 
            width: `${canvasWidth}px`,
            minHeight: canvasHeight ? `${canvasHeight}px` : undefined,
            backgroundColor: styles?.backgroundColor || (isCardLight ? '#FFFFFF' : '#0A0A0B'),
            color: styles?.foregroundColor || (isCardLight ? '#0F172A' : '#FFFFFF'),
            border: styles?.backgroundColor ? 'none' : (isCardLight ? '1px solid #FFFFFF' : '1px solid rgba(255,255,255,0.05)')
          }}
        >
          <div className="absolute inset-0 select-none">
             {(elements || []).sort((a, b) => a.zIndex - b.zIndex).map(renderElement)}
          </div>
          {(!elements || elements.length === 0) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 text-center space-y-4">
               <MousePointer2 size={48} className="animate-pulse" />
               <p className="text-xs font-black uppercase tracking-widest">Board Empty — Drop Elements to Begin</p>
            </div>
          )}

          {/* MAGNETIC GUIDES OVERLAY (Inside page to follow coordinates) */}
          {guides.x?.map((gx, i) => (
            <div key={`gx-${i}`} className="absolute top-[-2000px] bottom-[-2000px] w-[1.5px] bg-primary z-2000 pointer-events-none" style={{ left: gx }} />
          ))}
          {guides.y?.map((gy, i) => (
            <div key={`gy-${i}`} className="absolute left-[-2000px] right-[-2000px] h-[1.5px] bg-primary z-2000 pointer-events-none" style={{ top: gy }} />
          ))}
        </div>
      </div>

      {contextMenu && (
        <div 
          className={`fixed z-[999] w-56 rounded-2xl border p-2 shadow-2xl backdrop-blur-3xl animate-in zoom-in-95 duration-200 ${isGlobalLight ? 'bg-white/90 border-slate-200' : 'bg-[#121214]/90 border-white/10 text-white'}`}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
            <MenuAction icon={<Copy size={14}/>} label="Duplicate" onClick={() => {}} />
            <div className="h-px bg-white/10 my-2" />
            <MenuAction icon={<AlignLeft size={14}/>} label="Align Left" onClick={() => onAlignAction(contextMenu.id, 'left')} />
            <MenuAction icon={<AlignCenter size={14}/>} label="Align Center" onClick={() => onAlignAction(contextMenu.id, 'center')} />
            <MenuAction icon={<AlignRight size={14}/>} label="Align Right" onClick={() => onAlignAction(contextMenu.id, 'right')} />
            <div className="h-px bg-white/10 my-2" />
            <MenuAction icon={<Layers size={14} className="rotate-180"/>} label="Bring to Front" onClick={() => onLayerAction(contextMenu.id, 'top')} />
            <MenuAction icon={<Layers size={14}/>} label="Send to Back" onClick={() => onLayerAction(contextMenu.id, 'bottom')} />
            <div className="h-px bg-white/10 my-2" />
            <MenuAction icon={<Trash2 size={14} className="text-red-400"/>} label="Delete" onClick={() => onRemoveElement(contextMenu.id)} className="text-red-400 hover:bg-red-500/10" />
        </div>
      )}

      {!isPreviewMode && (
        <div className={`absolute bottom-0 left-0 right-0 h-10 border-t flex items-center justify-between px-6 z-50 backdrop-blur-md transition-all ${isGlobalLight ? 'bg-white/80 border-slate-200' : 'bg-[#0B0B0C]/80 border-white/5'}`}>
           <div className="flex items-center gap-4">
              <button 
                onClick={handleFitToScreen}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isGlobalLight ? 'bg-slate-100 hover:bg-primary hover:text-white' : 'bg-white/5 hover:bg-primary hover:text-white'}`}
              >
                 <Maximize size={10} /> Fit to Screen
              </button>
           </div>
           
           <div className="flex items-center gap-3">
              <button onClick={() => handleZoom(-10)} className="p-1 opacity-40 hover:opacity-100 transition-all"><ZoomOut size={14} /></button>
              <div className="relative w-32 h-1.5 bg-current/10 rounded-full overflow-hidden">
                 <div className="absolute top-0 left-0 h-full bg-primary" style={{ width: `${(zoom / 300) * 100}%` }} />
              </div>
              <button onClick={() => handleZoom(10)} className="p-1 opacity-40 hover:opacity-100 transition-all"><ZoomIn size={14} /></button>
              <span className={`text-[10px] font-black w-10 text-center tabular-nums opacity-60`}>{zoom}%</span>
              <div className="w-px h-4 bg-current/10 mx-2" />
              <button onClick={() => { setZoom(100); setPan({ x: 0, y: 0 }); }} className="p-1 opacity-40 hover:opacity-100 transition-all" title="Reset View"><RotateCcw size={14} /></button>
           </div>
        </div>
      )}

      <style>{`
        .bg-grid { background-size: 40px 40px; background-image: radial-gradient(circle, ${isGlobalLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.03)'} 1px, transparent 1px); }
      `}</style>
    </div>
  );
};

// const Handle = ({ pos, onDragStart }: { pos: string; onDragStart: (e: React.MouseEvent) => void }) => {
//   const cursors: any = { n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize', ne: 'nesw-resize', sw: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize' };
//   const styles: any = {
//     n: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-2',
//     s: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-8 h-2',
//     e: 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-2 h-8',
//     w: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-8',
//     nw: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-4 h-4',
//     ne: 'top-0 right-0 translate-x-1/2 -translate-y-1/2 w-4 h-4',
//     sw: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-4 h-4',
//     se: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-4 h-4'
//   };

//   return (
//     <div 
//       className={`absolute bg-white border-2 border-primary rounded-full z-[100] hover:scale-125 transition-transform shadow-lg ${styles[pos]}`}
//       style={{ cursor: cursors[pos] }}
//       onMouseDown={onDragStart}
//     />
//   );
// };

const MenuAction = ({ icon, label, onClick, className = "" }: any) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`w-full flex items-center gap-3 px-4 py-2 text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors ${className}`}
  >
    {icon} {label}
  </button>
);
