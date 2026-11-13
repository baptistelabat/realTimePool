import assert from 'node:assert/strict';
import { once } from 'node:events';
import { after, before, test } from 'node:test';

import { io as ioClient } from 'socket.io-client';

import { createPollServer } from '../src/app.js';

let poll;
let baseUrl;
const clients = [];

before(async () => {
  poll = createPollServer({
    broadcastIntervalMs: 20,
    listAddresses: () => [{ name: 'eth0', ip: '192.168.1.10' }],
  });
  poll.server.listen(0, '127.0.0.1');
  await once(poll.server, 'listening');
  baseUrl = `http://127.0.0.1:${poll.server.address().port}`;
});

after(async () => {
  for (const c of clients) c.close();
  await poll.close();
});

function connect(role) {
  const socket = ioClient(baseUrl, { auth: { role }, transports: ['websocket'] });
  clients.push(socket);
  return once(socket, 'connect').then(() => socket);
}

async function waitFor(socket, predicate) {
  for (;;) {
    const [stats] = await once(socket, 'stats');
    if (predicate(stats)) return stats;
  }
}

test('serves the pages and security headers', async () => {
  for (const page of ['/', '/vote.html', '/vendor/chart.js/chart.umd.min.js', '/socket.io/socket.io.min.js']) {
    const res = await fetch(baseUrl + page);
    assert.equal(res.status, 200, page);
  }
  const res = await fetch(baseUrl + '/');
  assert.match(res.headers.get('content-security-policy'), /default-src 'self'/);
  assert.equal(res.headers.get('x-powered-by'), null);
});

test('does not expose server source or project files', async () => {
  for (const file of ['/server.js', '/src/app.js', '/package.json', '/.git/config', '/node_modules/express/package.json']) {
    const res = await fetch(baseUrl + file);
    assert.equal(res.status, 404, file);
  }
});

test('lists network addresses with a QR code', async () => {
  const res = await fetch(baseUrl + '/api/addresses');
  const [entry] = await res.json();
  assert.equal(entry.url, `http://192.168.1.10:${poll.server.address().port}/vote.html`);
  assert.match(entry.qrCode, /^data:image\/png;base64,/);
});

test('aggregates votes, ignores invalid ones and excludes the display', async () => {
  const display = await connect('display');
  const a = await connect('voter');
  const b = await connect('voter');

  a.emit('vote', 20);
  b.emit('vote', 'not a number');
  b.emit('vote', 95);

  const stats = await waitFor(display, (s) => s.count === 2 && s.mean === 57.5);
  assert.deepEqual(stats.buckets, [0, 1, 0, 0, 0, 1]);

  b.close();
  await waitFor(display, (s) => s.count === 1 && s.mean === 20);
});
