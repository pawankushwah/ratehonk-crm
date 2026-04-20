import SimpleTemplate, { mockData as SimpleMock } from './card/SimpleTemplate';
import FlowbiteTemplate, { mockData as ClassicMock } from './card/FlowbiteTemplate';
import UniversalTemplate, { mockData as UniversalMock } from './card/UniversalTemplate';
import AdvancedDetailTemplate, { mockData as AdvancedMock } from './card/AdvancedDetailTemplate';
import CarouselTemplate, { mockData as CarousalMockData } from './card/CarouselTemplate';
import HorizontalDetailTemplate, { mockData as HorizontalDetailMock } from './card/HorizontalDetailTemplate';
import HorizontalFlowbiteTemplate from './card/HorizontalFlowbiteTemplate';
import HorizontalUniversalTemplate, { mockData as HorizontalUniversalMock } from './card/HorizontalUniversalTemplate';
import HorizontalAdvancedTemplate, { mockData as HorizontalAdvancedMock } from './card/HorizontalAdvancedTemplate';
import FlowbiteDetailTemplate, { mockData as FlowbitePDPMock } from './detail/FlowbiteDetailTemplate';
import FlowbiteAdvancedDetailTemplate, { mockData as AdvancedPDPMock } from './detail/FlowbiteAdvancedDetailTemplate';
import InteractiveBundleTemplate, { mockData as BundlePDPMock } from './detail/InteractiveBundleTemplate';

export type TemplateId = 
  | 'simple'
  | 'classic' 
  | 'universal' 
  | 'advanced_detail' 
  | 'carousel' 
  | 'horizontal_detail'
  | 'horizontal_classic'
  | 'horizontal_universal'
  | 'horizontal_advanced'
  | 'immersive_flowbite'
  | 'immersive_advanced'
  | 'immersive_bundle';

export const VERTICAL_TEMPLATES = [
  { 
    id: 'simple', 
    name: 'Simple Card', 
    type: 'card', 
    description: 'Clean, simple dynamic card layout.',
    supportedSlots: ['image', 'title', 'price', 'category', 'description', 'actions'],
    mockData: SimpleMock
  },
  { 
    id: 'universal', 
    name: 'Universal Glass', 
    type: 'card', 
    description: 'Classic glassmorphic retail design.',
    supportedSlots: ['image', 'title', 'price', 'rating', 'reviewCount', 'category', 'sku', 'stock', 'description', 'variantsSection', 'colors', 'sizes', 'highlights', 'promotions'],
    mockData: UniversalMock
  },
  { 
    id: 'classic', 
    name: 'Classic Card', 
    type: 'card', 
    description: 'The original Flowbite-inspired standard.',
    supportedSlots: ['image', 'title', 'price', 'badge', 'rating', 'stock', 'actions', 'features', 'sku', 'barcode', 'colors', 'sizes','actions', 'description', 'highlights', 'promotions'],
    mockData: ClassicMock
  },
  { 
    id: 'advanced_detail', 
    name: 'Advanced Detail', 
    type: 'card', 
    description: 'Rich commerce options with top-aligned image.',
    supportedSlots: ['image', 'title', 'price', 'sku', 'colors', 'sizes', 'description', 'highlights', 'promotions'],
    mockData: AdvancedMock
  },
  { 
    id: 'carousel', 
    name: 'Carousel Card', 
    type: 'card', 
    description: 'Dynamic card with image slideshow navigation.',
    supportedSlots: ['image', 'title', 'price', 'badge', 'description', 'colors', 'sizes', 'actions'],
    mockData: CarousalMockData || {}
  },
];

export const HORIZONTAL_TEMPLATES = [
  { 
    id: 'horizontal_detail', 
    name: 'Horizontal Row', 
    type: 'list', 
    description: 'Professional list-style detailed row.',
    supportedSlots: ['image', 'title', 'price', 'description', 'colors', 'sizes', 'highlights', 'promotions'],
    mockData: HorizontalDetailMock
  },
  { 
    id: 'horizontal_universal', 
    name: 'Universal Row', 
    type: 'list', 
    description: 'Glassmorphic premium row layout.',
    supportedSlots: ['image', 'title', 'price', 'badge', 'category', 'sku', 'stock', 'colors', 'sizes', 'actions', 'rating', 'reviewCount', 'promo', 'description', 'highlights', 'promotions', 'variantsSection'],
    mockData: HorizontalUniversalMock
  },
  { 
    id: 'horizontal_advanced', 
    name: 'Advanced Row', 
    type: 'list', 
    supportedSlots: ['image', 'title', 'price', 'sku', 'colors', 'sizes', 'description', 'highlights', 'promotions'],
    mockData: HorizontalAdvancedMock
  },
];

export const DETAIL_TEMPLATES = [
  { 
    id: 'immersive_flowbite', 
    name: 'Flowbite PDP', 
    type: 'detail', 
    description: 'Standard Flowbite product detail layout.',
    supportedSlots: ['image', 'title', 'price', 'rating', 'reviewCount', 'description', 'sku', 'colors', 'variantsSection', 'sizes', 'highlights', 'actions'],
    mockData: FlowbitePDPMock
  },
  { 
    id: 'immersive_advanced', 
    name: 'Advanced PDP', 
    type: 'detail', 
    description: 'High-density Product Detail Page with gallery.',
    supportedSlots: ['image', 'title', 'price', 'rating', 'description', 'colors', 'variantsSection','sizes', 'stock', 'sku', 'highlights', 'promotions'],
    mockData: AdvancedPDPMock
  },
  { 
    id: 'immersive_bundle', 
    name: 'Interactive Bundle', 
    type: 'detail', 
    description: 'High-density Bundle view with contents grid.',
    supportedSlots: ['image', 'title', 'price', 'description', 'stock', 'bundleItems'],
    mockData: BundlePDPMock
  },
];

// Unified registry for the renderer
export const TemplateRegistry: Record<TemplateId, React.FC<any>> = {
  simple: SimpleTemplate,
  classic: FlowbiteTemplate,
  universal: UniversalTemplate,
  advanced_detail: AdvancedDetailTemplate,
  carousel: CarouselTemplate,
  horizontal_detail: HorizontalDetailTemplate,
  horizontal_classic: HorizontalFlowbiteTemplate,
  horizontal_universal: HorizontalUniversalTemplate,
  horizontal_advanced: HorizontalAdvancedTemplate,
  immersive_flowbite: FlowbiteDetailTemplate,
  immersive_advanced: FlowbiteAdvancedDetailTemplate,
  immersive_bundle: InteractiveBundleTemplate,
};

export const radiusMap = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

export const shadowMap = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  '2xl': 'shadow-2xl',
};

export const paddingMap = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const fontMap = {
  'plus-jakarta': 'font-plus-jakarta',
  outfit: 'font-outfit',
  mono: 'font-mono',
};
