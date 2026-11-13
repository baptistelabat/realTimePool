/* global Chart */
import { connect } from './connection.js';

const MAX_POINTS = 300;
const BUCKET_LABELS = ['0–9', '10–29', '30–49', '50–69', '70–89', '90–100'];

const meanChart = new Chart(document.getElementById('meanChart'), {
  type: 'line',
  data: { datasets: [{ label: 'Moyenne', data: [], fill: true, pointRadius: 0, tension: 0.2 }] },
  options: {
    animation: false,
    maintainAspectRatio: false,
    parsing: false,
    scales: {
      x: { type: 'linear', title: { display: true, text: 'Temps (s)' } },
      y: { min: 0, max: 100 },
    },
    plugins: { legend: { display: false } },
  },
});

const histogramChart = new Chart(document.getElementById('histogramChart'), {
  type: 'bar',
  data: { labels: BUCKET_LABELS, datasets: [{ label: 'Votes', data: BUCKET_LABELS.map(() => 0) }] },
  options: {
    indexAxis: 'y',
    animation: false,
    maintainAspectRatio: false,
    scales: { x: { beginAtZero: true, ticks: { precision: 0 } }, y: { reverse: true } },
    plugins: { legend: { display: false } },
  },
});

const mouth = document.getElementById('mouth');
const meanValue = document.getElementById('meanValue');
const voterCount = document.getElementById('voterCount');

function setMood(mean) {
  // Control point moves from -10 (sad) to +20 (happy) with the mean.
  const y = -10 + (30 * mean) / 100;
  mouth.setAttribute('d', `M -12,5 Q 0,${y.toFixed(2)} 12,5`);
}

const socket = connect('display');
socket.on('stats', ({ t, count, mean, buckets }) => {
  voterCount.textContent = String(count);
  meanValue.textContent = mean === null ? '–' : mean.toFixed(1);
  setMood(mean ?? 50);

  if (mean !== null) {
    const points = meanChart.data.datasets[0].data;
    points.push({ x: t / 1000, y: mean });
    if (points.length > MAX_POINTS) points.shift();
    meanChart.update('none');
  }
  histogramChart.data.datasets[0].data = buckets;
  histogramChart.update('none');
});

// QR code: list the server's network addresses; pick one to show its QR code.
const addressList = document.getElementById('addressList');
const qrCode = document.getElementById('qrCode');
const voteUrl = document.getElementById('voteUrl');

function select(entry, button) {
  qrCode.src = entry.qrCode;
  qrCode.hidden = false;
  voteUrl.href = voteUrl.textContent = entry.url;
  for (const b of addressList.querySelectorAll('button')) b.classList.toggle('selected', b === button);
}

try {
  const response = await fetch('api/addresses');
  if (!response.ok) throw new Error(response.statusText);
  const entries = await response.json();
  if (entries.length === 0) addressList.textContent = 'Aucune interface réseau trouvée.';
  for (const entry of entries) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `${entry.name} (${entry.ip})`; // textContent: no HTML injection
    button.addEventListener('click', () => select(entry, button));
    addressList.append(button);
  }
  if (entries.length > 0) select(entries[0], addressList.querySelector('button'));
} catch (err) {
  console.error('Unable to load network addresses', err);
  addressList.textContent = 'Impossible de récupérer les adresses réseau.';
}
