import supabase from '../config/supabase.js';

export async function getOrderStatus(orderId) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, gross_amount, buyer_name, created_at')
    .eq('id', orderId)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data;
}
