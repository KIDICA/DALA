const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const lessMiddleware = require("less-middleware");
const logger = require("morgan");
const cors = require('cors');
const timeout = require('connect-timeout');

const apiMiddleware = require("./middleware/api");

const graphqlapi = require("./routes/api/v1/graphql");
const apiCala = require("./routes/api/cala");
const apiDashboard = require("./routes/api/dashboard");

const app = express();

console.info(`
============================================================
Running server, current environment: ${process.env.NODE_ENV}
============================================================
`);

// Don't place in module, must be only one instance.
var socketClients = 0;
const server = require('http').createServer(app);
const io = require('socket.io')(server);

io.on('connection', socket => {
  console.log("socket-connected");
  socketClients += 1;
  socket.emit('clients', socketClients);
  //io.emit('broadcast', /* … */); // emit an event to all connected sockets
  //socket.on('reply', () => { /* … */
  //});
});

server.listen(4200);

function haltOnTimedout(req, res, next) {
  if (!req.timedout) {
    next()
  }
}

app.use(timeout('60m'));
app.use(haltOnTimedout);
app.use(logger("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(lessMiddleware(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public")));

app.use(apiMiddleware);
app.use(function (req, res, next) {
  res.io = io;
  next();
});

app.use("/graphql/v1", graphqlapi);
app.use("/api/cala", apiCala);
app.use("/api/dashboard", apiDashboard);
// VueRouter will handle all routes.
app.get(/.*/, (req, res) => res.sendFile(__dirname + "/public/index.html"));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send({error: err.message});
});

module.exports = app;