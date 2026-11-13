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

The QR code points to the **HTTPS** vote page (`https://<ip>:8443/vote.html`). HTTPS is needed for tilt-to-vote: browsers only give access to a phone's orientation sensor on secure pages. On first start, the server creates a self-signed certificate in `.cert/` and reuses it afterwards. It creates a new one if the computer's IP addresses change.

Because the certificate is self-signed, each phone shows a warning the first time:

- **Android / Chrome:** *Advanced* → *Proceed to … (unsafe)*
- **iPhone / Safari:** *Show Details* → *visit this website*

Then tap **"Voter en inclinant le téléphone"** and tilt the phone: flat gives 0, upright gives 100. The slider always works too.

Configuration uses environment variables:

| Variable     | Default   | Description                                       |
|--------------|-----------|---------------------------------------------------|
| `PORT`       | `8080`    | HTTP port (results page)                          |
| `HTTPS_PORT` | `8443`    | HTTPS port (vote page for phones)                 |
| `HTTPS`      | `1`       | Set to `0` to disable HTTPS (tilt won't work then) |
| `CERT_DIR`   | `.cert`   | Where the self-signed certificate is stored       |
| `HOST`       | `0.0.0.0` | Interface to bind to                              |

Use `npm run dev` to restart the server automatically when files change.

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
