/** Matches backend {@code DeliveryStatus} */
export type DeliveryStatus = 'PENDING' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

export const DELIVERY_STATUS_OPTIONS: { value: DeliveryStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'IN_TRANSIT', label: 'In transit' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' }
];

export interface Delivery {
  id: number;
  deliveryDate: string;
  address: string;
  status: DeliveryStatus;
  orderId: number;
  fee:number;
}

export interface DeliveryCreateRequest {
  deliveryDate?: string | null;
  address: string;
  status: DeliveryStatus;
}

export interface DeliveryUpdateRequest {
  deliveryDate: string;
  address: string;
  status: DeliveryStatus;
}
