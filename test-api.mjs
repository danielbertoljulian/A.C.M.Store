import { config } from 'dotenv';
config({ path: '.env.local' });

const BASE = 'http://localhost:3000';

async function test() {
  // Test GET
  const getRes = await fetch(`${BASE}/api/analytics`);
  console.log('GET:', await getRes.json());

  // Test visit
  const visitRes = await fetch(`${BASE}/api/analytics?type=visit`, { method: 'POST' });
  console.log('Visit:', await visitRes.json());

  // Test click
  const clickRes = await fetch(`${BASE}/api/analytics?type=click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id: '1', product_name: 'Teste' })
  });
  console.log('Click:', await clickRes.json());

  // Test report
  const reportRes = await fetch(`${BASE}/api/report?date=${new Date().toISOString().slice(0,10)}`, {
    headers: { 'x-admin-password': 'acmstore2026' }
  });
  console.log('Report:', await reportRes.json());
}

test().catch(console.error);
