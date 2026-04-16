export interface UserCode {
  code: string;
  full_name: string;
  phone: string;
  delivery_address: string;
  total_portions: number;
  used_portions: number;
  remaining_portions: number;
  created_at: string;
}

export interface Menu {
  date: string; // YYYY-MM-DD, also the document ID
  cutoff_time: string; // HH:mm
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  name: string;
  image_url?: string;
  price: number;
  max_quantity: number | null;
  ordered_count: number;
  is_available: boolean;
}

export interface Order {
  id: string;
  user_code: string;
  full_name: string;
  phone: string;
  delivery_address: string;
  menu_date: string;
  menu_item_id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  created_at: string;
}

export interface ValidateCodeResponse {
  valid: boolean;
  full_name?: string;
  phone?: string;
  delivery_address?: string;
  remaining_portions?: number;
  already_ordered?: boolean;
  error?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  remaining_portions?: number;
  order_id?: string;
  item_name?: string;
  quantity?: number;
  delivery_address?: string;
  error?: string;
}

export interface CheckResponse {
  valid: boolean;
  full_name?: string;
  phone?: string;
  delivery_address?: string;
  total_portions?: number;
  used_portions?: number;
  remaining_portions?: number;
  orders?: Order[];
  error?: string;
}
