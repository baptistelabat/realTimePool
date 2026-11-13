/* global io */

/** Connect to the server (same origin, whatever port it runs on) and reflect the status. */
export function connect(role) {
  const socket = io({ auth: { role } });
  const status = document.getElementById('connection');
  const setStatus = (online) => {
    status.textContent = online ? 'connecté' : 'déconnecté';
    status.className = online ? 'online' : 'offline';
  };
  socket.on('connect', () => setStatus(true));
  socket.on('disconnect', () => setStatus(false));
  return socket;
}
