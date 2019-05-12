const express = require("express");
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
var i = 0;
const logger = require("./../utils/logger");

io.on('connection', socket => {
  logger.info("socket-connected");
  socket.emit('count', ++i); // emit an event to the socket
  //io.emit('broadcast', /* … */); // emit an event to all connected sockets
  //socket.on('reply', () => { /* … */
  //});
});

server.listen(4200);

module.exports = io;

/*
module.exports = function (req, res, next) {
  console.log("socket-middleware");
  res.io = io;
  next();
};
 */