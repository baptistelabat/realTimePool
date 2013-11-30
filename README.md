realTimePool
============

Host a piece of software that could be used to do a real time pool during a meeting.

This software was started by Baptiste Labat
This software was then modified during a code sprint at Stereolux following a workshop on HTML5 by Binomed (switching from tornado to node webserver, and integrating mobile device orientation).


The clients connect to the webserver based on ip address (from qr code) or url. A html5 slider is displayed with value from 0 to 100. Alternatively on a mobile device, the orientation might be used.
The user can choose a value between 0 and 100 (or 0 to 5 stars). This value is sent to server (in real time using websocket).
The mean value of all users is computed by the server and sent back to the clients to be displayed below.

Installation
============

You need to have node.js installed

git clone https://github.com/baptistelabat/realTimePool.git
cd realTimePool
npm install

Launching the server
====================

node server.js

You can now open a web browser and go to localhost:8080. This is the results page.
You should see a page. click on wlan, to get a QRcode which is giving the voter page address.



