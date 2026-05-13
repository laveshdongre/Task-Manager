/**
 * Smoke-test all REST endpoints. Requires running API (default http://localhost:5000).
 *
 *   npm run test:api
 *   API_BASE=http://127.0.0.1:5000 npm run test:api
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const BASE = process.env.API_BASE || 'http://localhost:5000';

let passed = 0;
let failed = 0;

async function req(method, path, { token, body, expectStatus } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let json = null;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  const ok = expectStatus !== undefined ? res.status === expectStatus : res.ok;
  if (!ok) {
    console.error(`FAIL ${method} ${path} → ${res.status} (expected ${expectStatus ?? '2xx'})`, json);
    failed += 1;
    return { res, json };
  }
  passed += 1;
  return { res, json };
}

async function main() {
  console.log(`API smoke test → ${BASE}\n`);

  await req('GET', '/api/health', { expectStatus: 200 });

  const demoEmail = 'demo-admin@taskflow.test';
  const demoPass = 'DemoSeed123!';
  const login = await req('POST', '/api/auth/login', {
    body: { email: demoEmail, password: demoPass },
    expectStatus: 200,
  });
  if (!login.json?.token) {
    console.error('\nLogin failed — run npm run seed or seed:reset so demo users exist.');
    process.exit(1);
  }
  const token = login.json.token;

  await req('GET', '/api/auth/me', { token, expectStatus: 200 });
  await req('PUT', '/api/auth/profile', {
    token,
    body: { name: 'Demo Admin' },
    expectStatus: 200,
  });

  await req('GET', '/api/projects', { token, expectStatus: 200 });
  await req('GET', '/api/dashboard', { token, expectStatus: 200 });

  const createProj = await req('POST', '/api/projects', {
    token,
    body: {
      name: `API Smoke ${Date.now()}`,
      description: 'temporary',
      color: '#112233',
    },
    expectStatus: 201,
  });
  const projectId = createProj.json?.project?._id;
  if (!projectId) {
    console.error('Could not get project id from POST /projects');
    process.exit(1);
  }

  await req('GET', `/api/projects/${projectId}`, { token, expectStatus: 200 });
  await req('PUT', `/api/projects/${projectId}`, {
    token,
    body: { description: 'updated by smoke test' },
    expectStatus: 200,
  });

  const taskCreate = await req('POST', `/api/projects/${projectId}/tasks`, {
    token,
    body: {
      title: 'Smoke task',
      description: 'hi',
      status: 'todo',
      priority: 'low',
    },
    expectStatus: 201,
  });
  const taskId = taskCreate.json?.task?._id;
  if (!taskId) {
    console.error('Could not get task id');
    process.exit(1);
  }

  await req('GET', `/api/projects/${projectId}/tasks`, { token, expectStatus: 200 });
  await req('GET', `/api/projects/${projectId}/tasks?status=todo`, { token, expectStatus: 200 });
  await req('GET', `/api/projects/${projectId}/tasks/${taskId}`, { token, expectStatus: 200 });

  await req('PUT', `/api/projects/${projectId}/tasks/${taskId}`, {
    token,
    body: { status: 'done', title: 'Smoke task done' },
    expectStatus: 200,
  });

  await req('POST', `/api/projects/${projectId}/tasks/${taskId}/comments`, {
    token,
    body: { text: 'Smoke comment' },
    expectStatus: 201,
  });

  const inviteEmail = `smoke-invite-${Date.now()}@taskflow.test`;
  await req('POST', '/api/auth/register', {
    body: { name: 'Smoke Invite', email: inviteEmail, password: 'SmokeInvite123!' },
    expectStatus: 201,
  });

  await req('POST', `/api/projects/${projectId}/members`, {
    token,
    body: { email: inviteEmail, role: 'member' },
    expectStatus: 200,
  });

  const invitedLogin = await req('POST', '/api/auth/login', {
    body: { email: inviteEmail, password: 'SmokeInvite123!' },
    expectStatus: 200,
  });
  const invitedToken = invitedLogin.json.token;
  const invitedUserId = invitedLogin.json.user._id;

  await req('PUT', `/api/projects/${projectId}/members/${invitedUserId}/role`, {
    token,
    body: { role: 'admin' },
    expectStatus: 200,
  });

  await req('DELETE', `/api/projects/${projectId}/members/${invitedUserId}`, {
    token,
    expectStatus: 200,
  });

  await req('DELETE', `/api/projects/${projectId}/tasks/${taskId}`, {
    token,
    expectStatus: 200,
  });

  await req('DELETE', `/api/projects/${projectId}`, {
    token,
    expectStatus: 200,
  });

  await req('GET', '/api/auth/me', { expectStatus: 401 });

  console.log(`\nDone: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
