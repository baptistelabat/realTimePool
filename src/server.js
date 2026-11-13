import { once } from 'node:events';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createPollServer } from './app.js';
import { loadOrCreateCertificate } from './certificate.js';
import { listIPv4Addresses } from './network.js';

const port = Number.parseInt(process.env.PORT ?? '8080', 10);
const httpsPort = Number.parseInt(process.env.HTTPS_PORT ?? '8443', 10);
const httpsEnabled = process.env.HTTPS !== '0';
const host = process.env.HOST ?? '0.0.0.0';
const certDir = process.env.CERT_DIR ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.cert');

const addresses = listIPv4Addresses();

let tls;
if (httpsEnabled) {
  const { created, ...pems } = await loadOrCreateCertificate(certDir, addresses.map((a) => a.ip));
  if (created) console.log(`Generated a self-signed certificate in ${certDir}`);
  tls = pems;
}

const poll = createPollServer({ tls });

poll.server.listen(port, host);
await once(poll.server, 'listening');
if (poll.httpsServer) {
  poll.httpsServer.listen(httpsPort, host);
  await once(poll.httpsServer, 'listening');
}

console.log(`Results page: http://localhost:${port}/`);
for (const { name, ip } of addresses) {
  const url = poll.httpsServer ? `https://${ip}:${httpsPort}` : `http://${ip}:${port}`;
  console.log(`Voters (${name}): ${url}/vote.html`);
}
if (poll.httpsServer) {
  console.log('Voters will see a certificate warning once (self-signed): accept it to continue.');
}

async function shutdown() {
  await poll.close();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
