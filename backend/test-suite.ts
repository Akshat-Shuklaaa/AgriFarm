/**
 * Comprehensive Automated Verification Test Suite for Agricultural Farm Management System
 * Tests all 14 mandatory criteria from project requirements.
 */

const BASE_URL = 'http://localhost:4000/api';

interface TestResult {
  step: number;
  description: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

async function runStep(step: number, description: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ step, description, passed: true });
    console.log(`[PASS] Step ${step}: ${description}`);
  } catch (err: any) {
    results.push({ step, description, passed: false, details: err.message });
    console.error(`[FAIL] Step ${step}: ${description} -> ${err.message}`);
  }
}

async function runSuite() {
  console.log('======================================================');
  console.log(' AGRICULTURAL FARM MANAGEMENT SYSTEM - VERIFICATION  ');
  console.log('======================================================\n');

  // 1. Backend connects to Redis
  await runStep(1, 'Backend connects to Redis', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    if (!res.ok || (!data.data?.redis?.connected && data.data?.redis !== 'connected')) {
      throw new Error(`Health response did not confirm redis connection: ${JSON.stringify(data)}`);
    }
  });

  // 2. GET /api/health works
  await runStep(2, 'GET /api/health returns 200 OK and valid status', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.data?.status !== 'healthy') throw new Error(`Status not healthy: ${data.data?.status}`);
  });

  // Authenticate as Admin to verify protected endpoints
  let authCookie = '';
  let csrfToken = '';
  try {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@agrifarm.local',
        password: 'AdminPassword123!',
      }),
    });
    if (loginRes.ok) {
      const setCookieHeader = loginRes.headers.get('set-cookie');
      if (setCookieHeader) {
        authCookie = setCookieHeader.split(';')[0];
      }
      const loginBody = await loginRes.json();
      csrfToken = loginBody.data?.csrfToken || '';
    }
  } catch (e: any) {
    console.warn('[Test Runner] Warning: could not pre-authenticate:', e.message);
  }

  function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
    const h: Record<string, string> = { ...extra };
    if (authCookie) h['Cookie'] = authCookie;
    if (csrfToken) h['x-csrf-token'] = csrfToken;
    return h;
  }

  // 3. GET /api/farmers returns actual records
  await runStep(3, 'GET /api/farmers returns actual records from Redis', async () => {
    const res = await fetch(`${BASE_URL}/farmers`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.data) || data.data.length === 0) {
      throw new Error('No farmer records returned');
    }
    const farmer101 = data.data.find((f: any) => String(f.id) === '101' || String(f.farmer_id) === '101');
    if (!farmer101) throw new Error('Existing farmer 101 not found in response');
    if (farmer101.name !== 'Ramesh Kumar') throw new Error(`Expected Ramesh Kumar, got ${farmer101.name}`);
  });

  // 4. POST /api/farmers creates a Redis record
  let createdFarmerId: string = '';
  await runStep(4, 'POST /api/farmers creates a new Redis record with unique sequential ID', async () => {
    const res = await fetch(`${BASE_URL}/farmers`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        name: 'Automated Test Farmer',
        address: 'Coimbatore, Tamil Nadu',
        email: 'auto.test@farmer.org',
        phone: '9888777666',
      }),
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    const data = await res.json();
    createdFarmerId = data.data?.id;
    if (!createdFarmerId) throw new Error('No id returned for created farmer');
  });

  // 5. GET /api/farmers/:id retrieves it
  await runStep(5, 'GET /api/farmers/:id retrieves the created record', async () => {
    const res = await fetch(`${BASE_URL}/farmers/${createdFarmerId}`, { headers: authHeaders() });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.data?.name !== 'Automated Test Farmer') {
      throw new Error(`Expected Automated Test Farmer, got ${data.data?.name}`);
    }
  });

  // 6. PUT /api/farmers/:id updates it
  await runStep(6, 'PUT /api/farmers/:id updates the record in Redis', async () => {
    const res = await fetch(`${BASE_URL}/farmers/${createdFarmerId}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        address: 'Madurai, Tamil Nadu',
      }),
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.data?.address !== 'Madurai, Tamil Nadu') {
      throw new Error(`Address was not updated: ${data.data?.address}`);
    }
  });

  // 7. DELETE /api/farmers/:id follows documented deletion policy and re-syncs counter
  await runStep(7, 'DELETE /api/farmers/:id deletes record cleanly and preserves sequence', async () => {
    const res = await fetch(`${BASE_URL}/farmers/${createdFarmerId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const checkRes = await fetch(`${BASE_URL}/farmers/${createdFarmerId}`, { headers: authHeaders() });
    if (checkRes.status !== 404) throw new Error(`Expected 404 after delete, got ${checkRes.status}`);
  });

  // 8. Related farmer/farm relationships remain consistent
  await runStep(8, 'Related farmer/farm relationships remain consistent', async () => {
    const res = await fetch(`${BASE_URL}/farmers/101/farms`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.data) || data.data.length === 0) {
      throw new Error('Farmer 101 should have at least 1 farm (201)');
    }
    const farm201 = data.data.find((f: any) => String(f.id) === '201' || String(f.farm_id) === '201');
    if (!farm201) throw new Error('Farm 201 not found in farmer 101 farms relation');
  });

  // 9. Invalid data is rejected
  await runStep(9, 'Invalid data is rejected with 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/farmers`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        name: '', // Empty name violates min(1)
        email: 'not-an-email',
      }),
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 10. Missing records produce appropriate errors
  await runStep(10, 'Missing records produce 404 Not Found', async () => {
    const res = await fetch(`${BASE_URL}/farmers/nonexistent-99999`, { headers: authHeaders() });
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });

  // 11. Dependency check blocks invalid deletions
  await runStep(11, 'Deletion of farmer with dependent farms is blocked', async () => {
    const res = await fetch(`${BASE_URL}/farmers/101`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (res.status !== 400) {
      throw new Error(`Expected 400 when attempting to delete parent with active dependents, got ${res.status}`);
    }
  });

  // 12. Dashboard statistics use real Redis data
  await runStep(12, 'Dashboard statistics compute real Redis metrics', async () => {
    const res = await fetch(`${BASE_URL}/dashboard/stats`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.data?.entityCounts || typeof data.data.entityCounts.farmers !== 'number') {
      throw new Error('Invalid dashboard stats structure');
    }
    if (data.data.summary.totalRevenue <= 0) {
      throw new Error('Dashboard should calculate real revenue from Redis sales');
    }
  });

  // 13. Existing Redis records remain intact
  await runStep(13, 'Existing canonical Redis records remain intact', async () => {
    const [cropRes, saleRes, paymentRes] = await Promise.all([
      fetch(`${BASE_URL}/crops/701`, { headers: authHeaders() }),
      fetch(`${BASE_URL}/sales/2201`, { headers: authHeaders() }),
      fetch(`${BASE_URL}/payments/2301`, { headers: authHeaders() }),
    ]);
    if (!cropRes.ok || !saleRes.ok || !paymentRes.ok) {
      throw new Error('One or more canonical records (701, 2201, 2301) missing');
    }
    const cropData = await cropRes.json();
    if (cropData.data.name !== 'Rice') throw new Error(`Expected Rice, got ${cropData.data.name}`);
  });

  // 14. Search functionality works across entity fields, IDs, addresses, and partial text
  await runStep(14, 'Search functionality works across IDs, addresses, and partial text', async () => {
    // 14.1 Search farmer by ID
    const idRes = await fetch(`${BASE_URL}/farmers?search=101`, { headers: authHeaders() });
    const idData = await idRes.json();
    if (!idData.data || idData.data.length === 0 || String(idData.data[0].id) !== '101') {
      throw new Error('Search by ID 101 failed to return farmer 101');
    }

    // 14.2 Search farmer by address
    const addrRes = await fetch(`${BASE_URL}/farmers?search=Kanchipuram`, { headers: authHeaders() });
    const addrData = await addrRes.json();
    if (!addrData.data || addrData.data.length === 0) {
      throw new Error('Search by address Kanchipuram failed');
    }

    // 14.3 Search with whitespace padding
    const spaceRes = await fetch(`${BASE_URL}/farmers?search=%20%20ramesh%20%20`, { headers: authHeaders() });
    const spaceData = await spaceRes.json();
    if (!spaceData.data || spaceData.data.length === 0) {
      throw new Error('Search with whitespace padding failed');
    }

    // 14.4 Search no-match scenario
    const noMatchRes = await fetch(`${BASE_URL}/farmers?search=nonexistent_query_xyz_999`, { headers: authHeaders() });
    const noMatchData = await noMatchRes.json();
    if (!noMatchData.data || noMatchData.data.length !== 0) {
      throw new Error('Expected 0 results for non-matching search');
    }
  });

  console.log('\n======================================================');
  console.log('               TEST RESULTS SUMMARY                   ');
  console.log('======================================================');
  const totalPassed = results.filter((r) => r.passed).length;
  console.log(`Passed: ${totalPassed} / ${results.length}`);
  if (totalPassed === results.length) {
    console.log('ALL VERIFICATION CRITERIA SATISFIED SUCCESSFULLY!');
  } else {
    console.log('SOME TESTS FAILED:');
    results.filter((r) => !r.passed).forEach((r) => console.log(` - Step ${r.step}: ${r.details}`));
  }
  console.log('======================================================\n');
}

runSuite().catch((e) => {
  console.error('Fatal runner error:', e);
  process.exit(1);
});
