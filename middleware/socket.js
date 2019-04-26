const express = require("express");
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
var i = 0;

io.on('connection', socket => {
  console.log("socket-connected");
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