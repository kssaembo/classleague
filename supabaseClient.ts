
import { createClient } from '@supabase/supabase-js';

/**
 * 보안 주의: 
 * SUPABASE_URL과 SUPABASE_ANON_KEY는 환경 변수(.env)에 저장되어야 합니다.
 * 코드에 직접 입력된 값은 개발 환경에서만 참고용으로 사용되며, 
 * 실제 배포 시에는 반드시 환경 변수 시스템을 통해 관리되어야 합니다.
 */
const supabaseUrl = process.env.SUPABASE_URL || 'https://demxxfkrqzycsnocbzvh.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbXh4ZmtycXp5Y3Nub2NienZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NDEwMjMsImV4cCI6MjA4MzExNzAyM30.LU6HUOszqBcXGfEVs7fDzIaio43-DPcc1ybGE7bmUMk';

export const supabase = createClient(supabaseUrl, supabaseKey);
