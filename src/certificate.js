import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { generate } from 'selfsigned';

const RENEW_BEFORE_MS = 7 * 24 * 3600 * 1000;

/**
 * Return a self-signed certificate valid for localhost and the given IP addresses.
 * It is stored in `dir` and reused across restarts, so phones only have to accept
 * the browser warning once; it is regenerated when the IPs change or it expires.
 */
export async function loadOrCreateCertificate(dir, ips) {
  const wanted = [...new Set(['127.0.0.1', ...ips])].sort();
  const files = {
    key: path.join(dir, 'key.pem'),
    cert: path.join(dir, 'cert.pem'),
    meta: path.join(dir, 'meta.json'),
  };

  try {
    const meta = JSON.parse(await readFile(files.meta, 'utf8'));
    const coversIps = wanted.every((ip) => meta.ips.includes(ip));
    const stillValid = new Date(meta.notAfter).getTime() - Date.now() > RENEW_BEFORE_MS;
    if (coversIps && stillValid) {
      return { key: await readFile(files.key, 'utf8'), cert: await readFile(files.cert, 'utf8'), created: false };
    }
  } catch {
    // No usable certificate yet.
  }

  const notBeforeDate = new Date();
  // Browsers reject leaf certificates valid for more than ~398 days.
  const notAfterDate = new Date(notBeforeDate.getTime() + 395 * 24 * 3600 * 1000);
  const pems = await generate([{ name: 'commonName', value: 'realTimePool (local)' }], {
    keyType: 'ec',
    algorithm: 'sha256',
    notBeforeDate,
    notAfterDate,
    extensions: [
      { name: 'basicConstraints', cA: false },
      // No keyEncipherment: it is invalid with EC keys and recent Chrome versions reject it.
      { name: 'keyUsage', digitalSignature: true },
      { name: 'extKeyUsage', serverAuth: true },
      {
        name: 'subjectAltName',
        altNames: [{ type: 2, value: 'localhost' }, ...wanted.map((ip) => ({ type: 7, ip }))],
      },
    ],
  });

  await mkdir(dir, { recursive: true, mode: 0o700 });
  await writeFile(files.key, pems.private, { mode: 0o600 });
  await writeFile(files.cert, pems.cert);
  await writeFile(files.meta, JSON.stringify({ ips: wanted, notAfter: notAfterDate.toISOString() }, null, 2));
  return { key: pems.private, cert: pems.cert, created: true };
}
