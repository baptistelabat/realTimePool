import { connect } from './connection.js';

const socket = connect('voter');
const range = document.getElementById('voteRange');
const number = document.getElementById('voteNumber');
const stars = [...document.querySelectorAll('#stars span')];
const STAR_THRESHOLDS = [10, 30, 50, 70, 90];

let current = 50;

function setVote(value) {
  const vote = Math.round(Math.min(100, Math.max(0, Number(value))));
  if (!Number.isFinite(vote)) return;
  range.value = number.value = String(vote);
  stars.forEach((star, i) => star.classList.toggle('on', vote >= STAR_THRESHOLDS[i]));
  if (vote !== current) {
    current = vote;
    socket.emit('vote', vote);
  }
}

range.addEventListener('input', () => setVote(range.value));
number.addEventListener('change', () => setVote(number.value));
// Re-send the current vote after a reconnection (the server resets it to 50).
socket.on('connect', () => socket.emit('vote', current));
setVote(current);

// Tilt-to-vote: opt-in, because iOS requires an explicit user gesture
// (and a secure context) to grant access to the orientation sensor.
const tiltButton = document.getElementById('tiltButton');
const tiltHelp = document.getElementById('tiltHelp');

function onOrientation(event) {
  if (event.beta === null) return;
  // Phone flat = 0°, upright = 90°: map the [0°, 90°] front/back tilt onto [0, 100].
  setVote((event.beta / 90) * 100);
}

if ('DeviceOrientationEvent' in window && matchMedia('(pointer: coarse)').matches) {
  tiltButton.hidden = false;
  tiltButton.addEventListener('click', async () => {
    try {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const answer = await DeviceOrientationEvent.requestPermission();
        if (answer !== 'granted') throw new Error(answer);
      }
      window.addEventListener('deviceorientation', onOrientation);
      tiltButton.hidden = true;
      tiltHelp.hidden = false;
    } catch {
      tiltButton.disabled = true;
      tiltButton.textContent = 'Capteur d’orientation indisponible';
    }
  });
}
