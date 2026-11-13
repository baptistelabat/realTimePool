realTimePool
============

Run a real-time poll during a meeting.

Participants scan a QR code on the results screen to open the vote page on their phone. They give a score from 0 to 100 (shown as 0 to 5 stars) with a slider. On a phone they can also tilt the device instead. The score is sent to the server over WebSockets. The results page updates live with:

- a smiley that reacts to the average score,
- a chart of the average score over time,
- a histogram of the votes.

This software was started by Baptiste Labat. It was then modified during a code sprint at Stereolux, after an HTML5 workshop by Binomed. The sprint switched the server from Tornado to Node.js and added mobile device orientation. In 2026 it was modernized: Node.js 20+, Express 5, Socket.IO 4, Chart.js 4, no jQuery, and security fixes.

Requirements
------------

[Node.js](https://nodejs.org/) 20 or newer.

Installation
------------

```bash
git clone https://github.com/baptistelabat/realTimePool.git
cd realTimePool
npm install
```

Launching the server
--------------------

```bash
npm start
```

Open <http://localhost:8080/> on the computer connected to the projector. This is the results page. Choose the network interface the participants are connected to (usually the Wi-Fi one) to show the matching QR code.

Configuration uses environment variables:

| Variable | Default   | Description          |
|----------|-----------|----------------------|
| `PORT`   | `8080`    | HTTP port            |
| `HOST`   | `0.0.0.0` | Interface to bind to |

Use `npm run dev` to restart the server automatically when files change.

### Tilt to vote

Browsers only give access to the orientation sensor in a [secure context](https://developer.mozilla.org/docs/Web/Security/Secure_Contexts). In practice that means HTTPS, and iOS also requires an explicit tap. When the app is served over plain HTTP on a local network, the tilt button may not work on some phones; the slider always works. To use tilt everywhere, put the server behind an HTTPS reverse proxy (Caddy, nginx, …).

Development
-----------

```bash
npm test
```

Project layout:

- `src/`: server (Express static files, `/api/addresses`, Socket.IO)
- `public/`: the only directory served to browsers
- `test/`: tests using the built-in `node:test` runner

License
-------

MIT, see [LICENSE](LICENSE).
