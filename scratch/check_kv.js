import { Redis } from '@upstash/redis';

const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});
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
