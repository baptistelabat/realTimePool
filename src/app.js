import { createServer } from 'node:http';
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

/**
 * Build the HTTP + WebSocket server. Nothing listens until `server.listen()` is called.
 *
 * @param {object} [options]
 * @param {number} [options.broadcastIntervalMs] how often results are pushed to clients
 * @param {() => {name: string, ip: string}[]} [options.listAddresses] injectable for tests
 */
export function createPollServer({
  broadcastIntervalMs = 200,
  listAddresses = listIPv4Addresses,
} = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'img-src': ["'self'", 'data:'],
          // The app is typically used over plain HTTP on a local network:
          // forcing HTTPS would break every sub-resource.
          'upgrade-insecure-requests': null,
        },
      },
      strictTransportSecurity: false,
    }),
  );

  // Only the `public` directory is exposed (the old server exposed the whole repo).
  app.use(express.static(publicDir));
  app.use('/vendor/chart.js', express.static(chartJsDir));

  const server = createServer(app);

  // Addresses at which voters can reach this server, with a ready-to-display QR code.
  app.get('/api/addresses', async (req, res, next) => {
    try {
      const { port } = server.address();
      const entries = await Promise.all(
        listAddresses().map(async ({ name, ip }) => {
          const url = `${req.protocol}://${ip}:${port}/vote.html`;
          return { name, ip, url, qrCode: await QRCode.toDataURL(url, { width: 256, margin: 1 }) };
        }),
      );
      res.json(entries);
    } catch (err) {
      next(err);
    }
  });

  const io = new Server(server, {
    serveClient: true,
    maxHttpBufferSize: 1024, // a vote is a single number
  });

  /** socket.id -> latest vote, voters only (the results page is not counted). */
  const votes = new Map();

  io.on('connection', (socket) => {
    const role = socket.handshake.auth?.role === 'display' ? 'display' : 'voter';
    socket.join(role);

    if (role === 'voter') {
      votes.set(socket.id, 50); // start at mid range, as before
      socket.on('vote', (value) => {
        const vote = sanitizeVote(value);
        if (vote !== null) votes.set(socket.id, vote);
      });
      socket.on('disconnect', () => votes.delete(socket.id));
    }
  });

  // One timer for the whole server (the old code started one per connection, never cleared).
  const t0 = Date.now();
  const timer = setInterval(() => {
    io.to('display').emit('stats', { t: Date.now() - t0, ...computeStats(votes.values()) });
  }, broadcastIntervalMs);
  timer.unref();

  server.on('close', () => clearInterval(timer));

  return { app, server, io, votes };
}
