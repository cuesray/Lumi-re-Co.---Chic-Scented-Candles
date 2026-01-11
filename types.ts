
export interface Product {
  id: string;
  name: string;
  price: number;
  scentProfile: string;
  description: string;
  image: string;
  notes: string[];
  category: 'Floral' | 'Woody' | 'Fresh' | 'Gourmand' | 'Custom';
  isCustom?: boolean;
  customDetails?: {
    scent: string;
    waxColor: string;
    label: string;
  };
}

export interface Review {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface OrderDetails {
  fullName: string;
  email: string;
  address: string;
  city: string;
  zipCode: string;
  paymentMethod: 'card' | 'paypal';
}

export type CheckoutStep = 'shipping' | 'review' | 'success';
