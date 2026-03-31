export interface Article {
  code: string;
  description: string;
  price: number;
  currency: string;
  unit: string;
  barcode?: string;
  category?: string;
}

export interface CartItem {
  article: Article;
  copies: number;
}

export interface Printer {
  id: string;
  name: string;
  ip: string;
  port: number;
  isOnline?: boolean;
}

export interface PrintJob {
  article: Article;
  printer: Printer;
  copies: number;
}

export type RootStackParamList = {
  Search: undefined;
  PrintPreview: { cart: CartItem[] };
};
