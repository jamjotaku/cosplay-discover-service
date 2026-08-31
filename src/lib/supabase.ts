import { createClient } from '@supabase/supabase-js'

// Vercel側の環境変数設定ミスの可能性を排除するため、強制的に直書きで接続します
const supabaseUrl = 'https://rmgntpgdndwftxyeuqwo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtZ250cGdkbmR3ZnR4eWV1cXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTE4MDcsImV4cCI6MjEwMzY2NzgwN30.C5-dn3JGDuSBfQnZ1eudnAqy4LU9doMJuPkt5Ev8_TQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
