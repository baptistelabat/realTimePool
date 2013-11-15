#!/usr/bin/env python
# -*- coding: utf8 -*-
#
# Copyright (c) 2013 Baptiste LABAT
#
# Licensed under the MIT License,
# https://github.com/baptistelabat/realTimePool
# Authors: Baptiste LABAT
#
# Used http://www.linuxforu.com/2012/04/getting-started-with-html5-websockets/
 
import tornado.web
import tornado.websocket
import tornado.ioloop
import os
import time
import json
import numpy as np
    
clients = []
global alpha
alpha = 0
t0 = time.time()

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("ui.html")
 
class WebSocketHandler(tornado.websocket.WebSocketHandler):
    def on_message(self, message):
        #self.write_message(u"Status OK " + message)
        t = time.time()-t0
        self.vote = message
        votes = []
        n = 0
        for c in clients:
			if c is not None:
				votes.append(int(c.vote))
        for c in clients:
			if c is not None:
			  c.write_message( json.dumps({'t':t, 'mean':str(np.mean(votes)), 'min':str(np.min(votes)), 'max':str(np.max(votes)), 'q1':str(np.percentile(votes, 25)), 'q3':str(np.percentile(votes, 75))}))
        

    def open(self):
      self.vote = 50
      clients.append(self)
      print "open"
      
    def on_close(self):
      clients.remove(self)
      print "close"

handlers = [
    (r"/", MainHandler),
    (r"/websocket", WebSocketHandler),
]
settings = dict(
            static_path=os.path.join(os.path.dirname(__file__), "static"),
)
application = tornado.web.Application(handlers, **settings)
 
if __name__ == "__main__":
    print "Launching the server"
    application.listen(8080)
    mainLoop = tornado.ioloop.IOLoop.instance()
    print "Server launched"
    mainLoop.start()
    

