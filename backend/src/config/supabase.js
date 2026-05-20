/**
 * Supabase Admin Client
 * Uses SERVICE_ROLE_KEY — bypasses Row Level Security.
 * ⚠️ NEVER expose this client or its key to the frontend.
 */
import { createClient } from '@supabase/supabase-js';
import config from './index.js';

const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);

export default supabase;
