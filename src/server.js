import { createPollServer } from './app.js';
import { listIPv4Addresses } from './network.js';

const port = Number.parseInt(process.env.PORT ?? '8080', 10);
const host = process.env.HOST ?? '0.0.0.0';

const { server, io } = createPollServer();

server.listen(port, host, () => {
  console.log(`Results page: http://localhost:${port}/`);
  for (const { name, ip } of listIPv4Addresses()) {
    console.log(`Voters (${name}): http://${ip}:${port}/vote.html`);
  }
});

function shutdown() {
  // Closes the WebSocket connections and the underlying HTTP server.
  io.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
