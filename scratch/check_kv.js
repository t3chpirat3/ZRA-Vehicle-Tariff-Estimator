import { kv } from '@vercel/kv';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  
  if (!url || !token) {
    console.error('No KV credentials in .env');
    return;
  }
  
  console.log('Fetching from KV...');
  try {
    const data = await kv.get('shipping_schedules');
    console.log('KV Data:', JSON.stringify(data, null, 2));
  } catch(e) {
    console.error('Error fetching:', e.message);
  }
}
check();
