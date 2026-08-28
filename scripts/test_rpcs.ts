import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log('Testing get_void_analysis...');
  const { data: voidData, error: voidError } = await supabase.rpc('get_void_analysis', {
    p_date_from: '2026-08-01T00:00:00Z',
    p_date_to: '2026-08-31T23:59:59Z'
  });
  
  if (voidError) {
    console.error('Error in get_void_analysis:', voidError);
  } else {
    console.log('get_void_analysis result:', JSON.stringify(voidData, null, 2));
  }

  console.log('\nTesting get_inventory_turnover...');
  const { data: turnoverData, error: turnoverError } = await supabase.rpc('get_inventory_turnover', {
    p_date_from: '2026-08-01T00:00:00Z',
    p_date_to: '2026-08-31T23:59:59Z'
  });

  if (turnoverError) {
    console.error('Error in get_inventory_turnover:', turnoverError);
  } else {
    console.log('get_inventory_turnover result:', JSON.stringify(turnoverData, null, 2));
  }
}

runTests().catch(console.error);
