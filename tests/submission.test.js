const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createServer } = require('../src/server');

// Each test gets a fresh server + temp data file, so tests never affect each other.
async function withServer(fn) {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'portal-')), 'data.json');
  const server = createServer(file);
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}/api/submissions`;
  try { await fn(base); } finally { server.close(); }
}

const good = {
  name: 'Ayesha Khan',
  regNo: 'FA22-BCS-001',
  title: 'DevOps Lab 1',
  url: 'https://github.com/ayesha/lab1',
};

const post = (base, body) =>
  fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('Complete details and a valid submission URL are saved and listed', async () => {
  await withServer(async (base) => {
    const res = await post(base, good);
    assert.strictEqual(res.status, 201);
    const list = await (await fetch(base)).json();
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].regNo, good.regNo);
  });
});

test('Missing registration number is rejected with a validation message', async () => {
  await withServer(async (base) => {
    const res = await post(base, { ...good, regNo: '' });
    const body = await res.json();
    assert.strictEqual(res.status, 400);
    assert.ok(body.errors.some((e) => /registration number/i.test(e)));
  });
});

test('Invalid submission URL is rejected and not saved', async () => {
  await withServer(async (base) => {
    const res = await post(base, { ...good, url: 'not-a-real-link' });
    assert.strictEqual(res.status, 400);
    const list = await (await fetch(base)).json();
    assert.strictEqual(list.length, 0);
  });
});
