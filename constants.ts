
import { Product } from './types';

// Prices updated to INR (approx 80-100x USD for premium feel)
export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Midnight Lavender',
    price: 2499,
    scentProfile: 'Calming & Dreamy',
    description: 'A soothing blend of French lavender, chamomile, and a hint of vanilla bean to guide you into a restful sleep.',
    image: 'https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&q=80&w=800',
    notes: ['Lavender', 'Chamomile', 'Vanilla'],
    category: 'Floral'
  },
  {
    id: '2',
    name: 'Eucalyptus Rain',
    price: 1999,
    scentProfile: 'Crisp & Refreshing',
    description: 'The smell of a forest after a spring downpour. Invigorating eucalyptus mixed with wet earth and silver fir.',
    image: 'https://images.unsplash.com/photo-1595433707802-6806f3f0440a?auto=format&fit=crop&q=80&w=800',
    notes: ['Eucalyptus', 'Spearmint', 'Silver Fir'],
    category: 'Fresh'
  },
  {
    id: '3',
    name: 'Spiced Sandalwood',
    price: 2899,
    scentProfile: 'Warm & Grounding',
    description: 'A sophisticated, deep aroma featuring creamy sandalwood, crushed cardamom, and aged cedarwood.',
    image: 'https://images.unsplash.com/photo-1572726710706-7ee75fa9f992?auto=format&fit=crop&q=80&w=800',
    notes: ['Sandalwood', 'Cardamom', 'Cedar'],
    category: 'Woody'
  },
  {
    id: '4',
    name: 'Velvet Vanilla',
    price: 2299,
    scentProfile: 'Sweet & Intimate',
    description: 'Not your average vanilla. Deep bourbon vanilla pods infused with white musk and a touch of amber.',
    image: 'https://images.unsplash.com/photo-1536924430914-91f9e2041b83?auto=format&fit=crop&q=80&w=800',
    notes: ['Bourbon Vanilla', 'White Musk', 'Amber'],
    category: 'Gourmand'
  }
];

export const CUSTOM_SCENTS = ['Wild Lavender', 'Madagascar Vanilla', 'Zesty Citrus', 'Forest Pine', 'Deep Sandalwood'];
export const WAX_COLORS = [
  { name: 'Natural Cream', hex: '#FAF9F6' },
  { name: 'Sage Leaf', hex: '#E3E8E1' },
  { name: 'Dusty Rose', hex: '#FCE7F3' },
  { name: 'Morning Mist', hex: '#E0F2FE' },
  { name: 'Honey Glow', hex: '#FEF3C7' }
];
