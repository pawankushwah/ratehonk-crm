import React from 'react';
import { ComponentRegistry } from '@/pages/(product)/forms/builder/StudioComponents';
import { type CanvasElement } from '@/pages/(product)/forms/builder/Presets';

interface StudioRendererProps {
  design: any;
  productData: any;
  preferredPage?: 'card' | 'view';
  className?: string;
}

/**
 * StudioRenderer: A responsive, percentage-based renderer for Design Studio boards.
 * It converts pixel-based design coordinates into percentages to ensure
 * perfect scaling across any container width.
 */
export const StudioRenderer: React.FC<StudioRendererProps> = ({ design, productData, preferredPage, className = "" }) => {
  if (!design) return null;

  // Migration/Fallback: If design is legacy (puck content), wrap it or return null
  const isLegacy = !design.pages && design.content;
  const pages = design.pages || (isLegacy ? { card: { elements: design.content, rootStyles: design.root?.props?.styles || {} } } : null);
  
  if (!pages) return null;

  // Render the requested page or fallback to design's active page
  const pageId = preferredPage || design.activePageId || 'card';
  const page = pages[pageId];
  if (!page) return null;

  const canvasWidth = page.width || 450;
  const elements = page.elements || [];
  const rootStyles = page.rootStyles || {};
  const currentTheme = rootStyles.theme || 'dark';
  const themeStyles = rootStyles[currentTheme] || {};

  const bgStyle = themeStyles.backgroundStyle || 'solid';

  return (
    <div 
      className={`relative w-full overflow-hidden transition-all duration-500 ${className}`}
      style={{
        aspectRatio: page.aspectRatio === 'square' ? '1/1' : (page.aspectRatio === 'portrait' ? '3/4' : (page.aspectRatio === 'landscape' ? '16/9' : 'auto')),
        backgroundColor: bgStyle === 'solid' ? (themeStyles.backgroundColor || (currentTheme === 'light' ? '#FFFFFF' : '#0A0A0B')) : 'transparent',
        backgroundImage: bgStyle === 'gradient' ? `linear-gradient(to bottom right, ${themeStyles.backgroundColor}, #000000)` : 'none',
        color: themeStyles.foregroundColor || (currentTheme === 'light' ? '#0F172A' : '#FFFFFF'),
        minHeight: page.aspectRatio === 'auto' ? '400px' : 'auto',
        borderRadius: themeStyles.borderRadius === 'rounded-4xl' ? '2rem' : (themeStyles.borderRadius === 'rounded-[3rem]' ? '3rem' : '1.5rem')
      }}
    >
      {bgStyle === 'glass' && (
        <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl" />
      )}
      <div className="absolute inset-0">
        {elements.sort((a: any, b: any) => (a.zIndex || 0) - (b.zIndex || 0)).map((el: CanvasElement) => {
          const Component = ComponentRegistry[el.type];
          if (!Component) return null;

          // Convert Pixels to Percentages for Responsiveness
          const style: React.CSSProperties = {
            position: 'absolute',
            left: `${(el.x / canvasWidth) * 100}%`,
            top: `${(el.y / (page.aspectRatio === 'auto' ? 850 : canvasWidth)) * 100}%`, // Approx height if auto
            width: `${(el.width / canvasWidth) * 100}%`,
            height: `${(el.height / (page.aspectRatio === 'auto' ? 850 : canvasWidth)) * 100}%`,
            transform: `rotate(${el.rotation || 0}deg)`,
            opacity: el.opacity ?? 1,
            zIndex: el.zIndex,
            ...el.style
          };

          // For 'auto' height, we might need a different vertical strategy if it's very long.
          // But for cards, this percentage approach is usually the most robust.

          return (
            <div key={el.id} style={style}>
              <Component 
                type={el.type}
                props={el.props} 
                style={el.style || {}}
                mockData={productData?.data || productData || {}} 
                isLight={currentTheme === 'light'}
                formFields={[]} // Not needed in renderer
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
