realTimePool
============

Host a piece of software that could be used to do a real time pool during a meeting.

A tornado webserver has to be launched.

The clients connect to the webserver based on ip address or url. A html5 slider is displayed with value from 0 to 100.
The user can choose a value between 0 and 100. This value is sent to server (in real time using websocket).
The mean value of all users is computed by the server and sent back to the clients to be displayed below.

Next evolution:
More statistics on vote should be added later.
