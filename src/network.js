import os from 'node:os';

/** List the non-internal IPv4 addresses of this machine. */
export function listIPv4Addresses() {
  const result = [];
  for (const [name, addresses] of Object.entries(os.networkInterfaces())) {
    for (const details of addresses ?? []) {
      // `family` is a string since Node 18.4 (it was briefly a number).
      if ((details.family === 'IPv4' || details.family === 4) && !details.internal) {
        result.push({ name, ip: details.address });
      }
    }
  }
  return result;
}
