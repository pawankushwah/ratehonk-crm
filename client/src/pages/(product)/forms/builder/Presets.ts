export type ElementType = 
  | 'ProductImage'
  | 'TitleSection'
  | 'PriceDisplay'
  | 'ActionButtons'
  | 'Text'
  | 'Shape'
  | 'Image'
  | 'Icon'
  | 'ProductCarousel'
  | 'DataTable'
  | 'DataGrid';

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  opacity?: number;
  locked?: boolean;
  props: any;
  style?: any;
}

export interface ThemeStyles {
  backgroundColor: string;
  foregroundColor: string;
  borderRadius: string;
  backgroundStyle?: 'solid' | 'gradient' | 'glass';
}

export interface CanvasPageData {
  elements: CanvasElement[];
  rootStyles: {
    theme: 'light' | 'dark';
    light: ThemeStyles;
    dark: ThemeStyles;
    aspectRatio?: string;
    width?: number;
    height?: number;
  };
}

export interface StudioDesign {
  pages: Record<string, CanvasPageData>;
  activePageId: string;
}

export interface CanvasPreset {
  id: string;
  name: string;
  description: string;
  type: 'card' | 'view';
  data: CanvasPageData;
}

const DEFAULT_LIGHT: ThemeStyles = {
  backgroundColor: '#FFFFFF',
  foregroundColor: '#0F172A',
  borderRadius: 'rounded-[3rem]',
  backgroundStyle: 'solid'
};

const DEFAULT_DARK: ThemeStyles = {
  backgroundColor: '#0A0A0B',
  foregroundColor: '#FFFFFF',
  borderRadius: 'rounded-[3rem]',
  backgroundStyle: 'solid'
};

export const PRESETS: CanvasPreset[] = [
  // --- CARDS ---
  {
    id: 'retail-pro',
    name: 'Retail Pro (Freeform)',
    description: 'Balanced industrial layout with floating elements.',
    type: 'card',
    data: {
      elements: [
        { 
          id: 'img-1', type: 'ProductImage', 
          x: 0, y: 0, width: 450, height: 450, rotation: 0, zIndex: 1,
          props: { aspectRatio: 'aspect-square', overlay: true, overlayPos: 'bottom-left' }, 
          style: { padding: 0 } 
        },
        { 
          id: 'title-1', type: 'TitleSection', 
          x: 40, y: 480, width: 370, height: 120, rotation: 0, zIndex: 2,
          props: { alignment: 'text-left', fontSize: 'text-4xl' }, 
          style: { padding: 0 } 
        },
        { 
          id: 'price-1', type: 'PriceDisplay', 
          x: 40, y: 600, width: 200, height: 60, rotation: 0, zIndex: 3,
          props: { size: 'text-4xl' }, 
          style: { padding: 0 } 
        },
        { 
          id: 'action-1', type: 'ActionButtons', 
          x: 40, y: 720, width: 370, height: 80, rotation: 0, zIndex: 4,
          props: { layout: 'between' }, 
          style: { padding: 0 } 
        }
      ],
      rootStyles: { 
        theme: 'dark', 
        aspectRatio: 'portrait',
        light: { ...DEFAULT_LIGHT, borderRadius: 'rounded-[3.5rem]' },
        dark: { ...DEFAULT_DARK, borderRadius: 'rounded-[3.5rem]' }
      }
    }
  },
  {
    id: 'product-classic',
    name: 'Product Classic View',
    description: 'Split-canvas design with absolute mapping.',
    type: 'view',
    data: {
      elements: [
        { 
          id: 'img-c1', type: 'ProductImage', 
          x: 40, y: 40, width: 450, height: 450, rotation: 0, zIndex: 1,
          props: { aspectRatio: 'aspect-square' }, style: { padding: 0 } 
        },
        { 
          id: 'title-c1', type: 'TitleSection', 
          x: 540, y: 40, width: 420, height: 100, rotation: 0, zIndex: 3,
          props: { fontSize: 'text-5xl' }, style: { padding: 0 } 
        },
        { 
          id: 'price-c1', type: 'PriceDisplay', 
          x: 540, y: 160, width: 250, height: 60, rotation: 0, zIndex: 4,
          props: { size: 'text-5xl' }, style: { padding: 0 } 
        },
        { 
          id: 'action-c1', type: 'ActionButtons', 
          x: 540, y: 260, width: 420, height: 80, rotation: 0, zIndex: 5,
          props: { layout: 'left' }, style: { padding: 0 } 
        },
        { 
          id: 'table-c1', type: 'DataTable', 
          x: 540, y: 380, width: 420, height: 400, rotation: 0, zIndex: 6,
          props: { title: 'Technical Blueprint' }, style: { padding: 0 } 
        }
      ],
      rootStyles: { 
        theme: 'light', 
        aspectRatio: 'landscape',
        light: { ...DEFAULT_LIGHT },
        dark: { ...DEFAULT_DARK }
      }
    }
  },
  {
    id: 'interactive-card',
    name: 'Interactive Card',
    description: 'Mini-carousel enabled card for rapid browsing.',
    type: 'card',
    data: {
      elements: [
        { 
          id: 'card-carousel', type: 'ProductCarousel', 
          x: 0, y: 0, width: 450, height: 400, rotation: 0, zIndex: 1,
          props: { fieldId: 'img_gallery', showArrows: true, showDots: true, borderRadius: 32 }, 
          style: { padding: 0 } 
        },
        { 
          id: 'card-title', type: 'TitleSection', 
          x: 40, y: 440, width: 370, height: 60, rotation: 0, zIndex: 2,
          props: { alignment: 'text-left', fontSize: 'text-2xl', titleField: 'name' }, 
          style: { padding: 0 } 
        },
        { 
          id: 'card-price', type: 'PriceDisplay', 
          x: 40, y: 510, width: 200, height: 40, rotation: 0, zIndex: 3,
          props: { size: 'text-3xl' }, 
          style: { padding: 0 } 
        },
        { 
          id: 'card-action', type: 'ActionButtons', 
          x: 40, y: 600, width: 370, height: 60, rotation: 0, zIndex: 4,
          props: { layout: 'between', showHeart: true }, 
          style: { padding: 0 } 
        }
      ],
      rootStyles: { 
        theme: 'light', 
        aspectRatio: 'portrait',
        light: { ...DEFAULT_LIGHT, borderRadius: 'rounded-[3rem]' },
        dark: { ...DEFAULT_DARK, borderRadius: 'rounded-[3rem]' }
      }
    }
  },
  {
    id: 'hyper-spec-view',
    name: 'Hyper-Spec Detail',
    description: 'Immersive detail page with technical data grids.',
    type: 'view',
    data: {
      elements: [
        { 
          id: 'v-carousel', type: 'ProductCarousel', 
          x: 40, y: 40, width: 620, height: 720, rotation: 0, zIndex: 1,
          props: { fieldId: 'img_gallery', showArrows: true, showDots: true, borderRadius: 48 }, 
          style: { padding: 0 } 
        },
        { 
          id: 'v-title', type: 'TitleSection', 
          x: 700, y: 100, width: 460, height: 120, rotation: 0, zIndex: 2,
          props: { alignment: 'text-left', fontSize: 'text-6xl', fontWeight: 'black' }, 
          style: { padding: 0 } 
        },
        { 
          id: 'v-price', type: 'PriceDisplay', 
          x: 700, y: 240, width: 300, height: 60, rotation: 0, zIndex: 3,
          props: { size: 'text-5xl' }, 
          style: { padding: 0 } 
        },
        { 
          id: 'v-grid', type: 'DataGrid', 
          x: 700, y: 360, width: 460, height: 300, rotation: 0, zIndex: 4,
          props: { fieldId: 'specifications', columns: 2, gap: 16, borderRadius: 32 }, 
          style: { padding: 0 } 
        },
        { 
          id: 'v-action', type: 'ActionButtons', 
          x: 700, y: 700, width: 460, height: 80, rotation: 0, zIndex: 5,
          props: { layout: 'between', showVisit: true }, 
          style: { padding: 0 } 
        }
      ],
      rootStyles: { 
        theme: 'dark', 
        aspectRatio: 'landscape',
        light: { ...DEFAULT_LIGHT },
        dark: { ...DEFAULT_DARK }
      }
    }
  },
  {
    id: 'inventory-master',
    name: 'Inventory Master Card',
    description: 'High-fidelity glassmorphism card for stock management.',
    type: 'card',
    data: {
      elements: [
        { 
          id: 'inv-img', type: 'ProductImage', 
          x: 0, y: 0, width: 450, height: 450, rotation: 0, zIndex: 1,
          props: { aspectRatio: 'aspect-square', overlay: true, overlayPos: 'bottom-left' }, 
          style: { padding: 0 } 
        },
        { 
          id: 'inv-title', type: 'TitleSection', 
          x: 30, y: 480, width: 390, height: 80, rotation: 0, zIndex: 3,
          props: { fontSize: 'text-3xl', fontWeight: 'bold' }, 
          style: { padding: 0 } 
        },
        { 
          id: 'inv-price', type: 'PriceDisplay', 
          x: 30, y: 570, width: 200, height: 50, rotation: 0, zIndex: 4,
          props: { size: 'text-4xl', color: 'text-primary' }, 
          style: { padding: 0 } 
        },
        { 
          id: 'inv-action', type: 'ActionButtons', 
          x: 30, y: 650, width: 390, height: 80, rotation: 0, zIndex: 5,
          props: { layout: 'between', showVisit: true, showHeart: true }, 
          style: { padding: 0 } 
        },
        { 
          id: 'inv-status', type: 'Text', 
          x: 350, y: 575, width: 70, height: 30, rotation: 0, zIndex: 6,
          props: { text: 'IN STOCK', fontSize: 'text-[10px]', color: 'text-emerald-500', fontWeight: 'black' }, 
          style: { padding: 0 } 
        }
      ],
      rootStyles: { 
        theme: 'dark', 
        aspectRatio: 'portrait',
        light: { ...DEFAULT_LIGHT, backgroundStyle: 'glass', borderRadius: 'rounded-[3.5rem]' },
        dark: { ...DEFAULT_DARK, backgroundStyle: 'glass', borderRadius: 'rounded-[3.5rem]' }
      }
    }
  }
];
