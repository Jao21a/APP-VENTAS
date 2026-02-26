export type OrderStatus = 'pending' | 'preparing' | 'shipping' | 'delivered';

export interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  order_details: string;
  status: OrderStatus;
  total: number;
  delivery_person?: string;
  created_at: string;
}

export interface DeliveryPerson {
  id: number;
  name: string;
}
