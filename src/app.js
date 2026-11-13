import { createServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import helmet from 'helmet';
import QRCode from 'qrcode';
import { Server } from 'socket.io';

import { listIPv4Addresses } from './network.js';
import { computeStats, sanitizeVote } from './stats.js';

const require = createRequire(import.meta.url);
const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const publicDir = path.join(rootDir, 'public');
const chartJsDir = path.dirname(require.resolve('chart.js')); // resolves inside chart.js/dist

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

/**
 * Build the poll server. Nothing listens until `.listen()` is called on the returned servers.
 *
 * An HTTPS server is created too when `tls` ({key, cert}) is given. Phones need it:
 * browsers only expose the orientation sensor (tilt-to-vote) on secure pages.
 * Both servers share the same votes.
 *
 * @param {object} [options]
 * @param {{key: string, cert: string}} [options.tls]
 * @param {number} [options.broadcastIntervalMs] how often results are pushed to clients
 * @param {() => {name: string, ip: string}[]} [options.listAddresses] injectable for tests
 */
export function createPollServer({
  tls,
  broadcastIntervalMs = 200,
  listAddresses = listIPv4Addresses,
} = {}) {
  const app = express();
  const server = createServer(app);
  const httpsServer = tls ? createHttpsServer(tls, app) : null;

  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'img-src': ["'self'", 'data:'],
          // The results page is typically used over plain HTTP:
          // forcing HTTPS would break every sub-resource.
          'upgrade-insecure-requests': null,
        },
      },
      strictTransportSecurity: false,
    }),
  );

  // Voters reaching the plain HTTP vote page from another device are sent to HTTPS,
  // otherwise their browser hides the orientation sensor.
  app.get('/vote.html', (req, res, next) => {
    if (!httpsServer?.listening || req.secure || LOOPBACK.has(req.socket.remoteAddress)) return next();
    res.redirect(302, `https://${req.hostname}:${httpsServer.address().port}${req.originalUrl}`);
  });

  // Only the `public` directory is exposed.
  app.use(express.static(publicDir));
  app.use('/vendor/chart.js', express.static(chartJsDir));

  // Addresses at which voters can reach this server, with a ready-to-display QR code.
  app.get('/api/addresses', async (req, res, next) => {
    try {
      const target = httpsServer?.listening ? httpsServer : server;
      const protocol = target === httpsServer ? 'https' : 'http';
      const { port } = target.address();
      const entries = await Promise.all(
        listAddresses().map(async ({ name, ip }) => {
          const url = `${protocol}://${ip}:${port}/vote.html`;
          return { name, ip, url, qrCode: await QRCode.toDataURL(url, { width: 256, margin: 1 }) };
        }),
      );
      res.json(entries);
    } catch (err) {
      next(err);
    }
  });

  /** socket.id -> latest vote, voters only (the results page is not counted). */
  const votes = new Map();

  function onConnection(socket) {
    const role = socket.handshake.auth?.role === 'display' ? 'display' : 'voter';
    socket.join(role);

    if (role === 'voter') {
      votes.set(socket.id, 50); // start at mid range
      socket.on('vote', (value) => {
        const vote = sanitizeVote(value);
        if (vote !== null) votes.set(socket.id, vote);
      });
      socket.on('disconnect', () => votes.delete(socket.id));
    }
  }

  // One Socket.IO instance per HTTP(S) server, sharing the same state.
  const ioOptions = { maxHttpBufferSize: 1024 }; // a vote is a single number
  const ios = [server, httpsServer].filter(Boolean).map((srv) => {
    const io = new Server(srv, ioOptions);
    io.on('connection', onConnection);
    return io;
  });

  const t0 = Date.now();
  const timer = setInterval(() => {
    const stats = { t: Date.now() - t0, ...computeStats(votes.values()) };
    for (const io of ios) io.to('display').emit('stats', stats);
  }, broadcastIntervalMs);
  timer.unref();

  /** Close WebSocket connections and both servers. */
  async function close() {
    clearInterval(timer);
    await Promise.all(ios.map((io) => new Promise((resolve) => io.close(() => resolve()))));
  }

  return { app, server, httpsServer, ios, votes, close };
}
