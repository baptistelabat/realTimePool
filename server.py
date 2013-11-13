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
    
clients = []
global alpha
alpha = 0

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("ui.html")
 
class WebSocketHandler(tornado.websocket.WebSocketHandler):
    def on_message(self, message):
        #self.write_message(u"Status OK " + message)
        self.vote = message
        s = 0
        n = 0
        for c in clients:
			if c is not None:
				s = s + int(c.vote)
				n = n+1
        print s/n
        for c in clients:
			if c is not None:
			  c.write_message(str(round(s*1.0/len(clients),1)))
        

    def open(self):
      self.vote = 50
      clients.append(self)
      self.write_message(u"Connected")
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
    application.listen(8080)
    mainLoop = tornado.ioloop.IOLoop.instance()
    mainLoop.start()
    

