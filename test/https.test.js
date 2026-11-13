import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { Agent } from 'node:https';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';

import { io as ioClient } from 'socket.io-client';

import { createPollServer } from '../src/app.js';
import { loadOrCreateCertificate } from '../src/certificate.js';

let poll;
let certDir;
let httpUrl;
let httpsUrl;
const clients = [];

before(async () => {
  certDir = await mkdtemp(path.join(os.tmpdir(), 'rtp-cert-'));
  const { created, ...tls } = await loadOrCreateCertificate(certDir, ['192.168.1.10']);
  assert.equal(created, true);
  poll = createPollServer({
    tls,
    broadcastIntervalMs: 20,
    listAddresses: () => [{ name: 'wlan0', ip: '192.168.1.10' }],
  });
  poll.server.listen(0, '127.0.0.1');
  poll.httpsServer.listen(0, '127.0.0.1');
  await Promise.all([once(poll.server, 'listening'), once(poll.httpsServer, 'listening')]);
  httpUrl = `http://127.0.0.1:${poll.server.address().port}`;
  httpsUrl = `https://127.0.0.1:${poll.httpsServer.address().port}`;
});

after(async () => {
  for (const c of clients) c.close();
  await poll.close();
  await rm(certDir, { recursive: true, force: true });
});

test('the certificate is reused across restarts while it covers the IPs', async () => {
  assert.equal((await loadOrCreateCertificate(certDir, ['192.168.1.10'])).created, false);
  assert.equal((await loadOrCreateCertificate(certDir, ['10.0.0.5'])).created, true);
});

test('QR codes point to the HTTPS vote page', async () => {
  const [entry] = await (await fetch(httpUrl + '/api/addresses')).json();
  assert.equal(entry.url, `https://192.168.1.10:${poll.httpsServer.address().port}/vote.html`);
});

test('the vote page stays on HTTP for the local machine', async () => {
  const res = await fetch(httpUrl + '/vote.html', { redirect: 'manual' });
  assert.equal(res.status, 200);
});

test('votes over HTTPS reach the display connected over HTTP', async () => {
  const display = ioClient(httpUrl, { auth: { role: 'display' }, transports: ['websocket'] });
  const voter = ioClient(httpsUrl, {
    auth: { role: 'voter' },
    transports: ['websocket'],
    agent: new Agent({ rejectUnauthorized: false }), // self-signed
  });
  clients.push(display, voter);
  await Promise.all([once(display, 'connect'), once(voter, 'connect')]);
  voter.emit('vote', 75);
  for (;;) {
    const [stats] = await once(display, 'stats');
    if (stats.count === 1 && stats.mean === 75) break;
  }
});
