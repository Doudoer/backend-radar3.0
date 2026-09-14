export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone?: string | null;
  customer_email?: string | null;
  brand?: string | null;
  model?: string | null;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
}
