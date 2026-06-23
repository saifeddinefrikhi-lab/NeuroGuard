import type { Product } from './product.model';

export interface OrderLine {
  id: number;
  quantity: number;
  unitPrice: number;
  product: Product;
}

export interface Order {
  id: number;
  orderDate: string; // ISO string
  total: number;
  status: string;
  lines: OrderLine[];
  appliedPromoCode:string;
}

export interface OrderLineItemRequest {
  productId: number;
  quantity: number;
}

export interface OrderCreateRequest {
  status?: string;
  lines: OrderLineItemRequest[];
  appliedPromoCode?:string;
}

export interface OrderUpdateRequest {
  status?: string;
  lines?: OrderLineItemRequest[];
  appliedPromoCode?:string;
}

