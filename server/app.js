const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const lessMiddleware = require("less-middleware");
// Request logger
// const morgan = require("morgan");
const cors = require("cors");
const timeout = require("connect-timeout");
const fs = require("fs");
const logger = require("./utils/logger");

const apiMiddleware = require("./middleware/api");

const graphQLAPI = require("./routes/api/v1/graphql");
const apiCala = require("./routes/api/cala");
const apiDashboard = require("./routes/api/dashboard");

const app = express();

logger.info(`
================================================================
Running server, current environment: ${process.env.NODE_ENV} on port ${process.env.PORT}
================================================================
`);

// |========================================================|
// | Setup                                                  |
// |========================================================|

if (!fs.existsSync("public/uploads")) {
  fs.mkdirSync("public/uploads", {recursive: true});
}

// |========================================================|
// | Socket message dispatch.                               |
// |========================================================|

const events = require("../client/src/config/events.json");

// Don't place in module, must be only one instance.
let socketClients = 0;
const server = require("http").createServer(app);
const io = require("socket.io")(server);

io.on("connection", socket => {
  logger.debug("socket-connected");
  socketClients += 1;
  socket.emit("clients", socketClients);

  // All receive this message, including sender.
  // Vuex centrally managed these counter in all apps.
  socket.on(events.socket.clientError, messages => {
    logger.error({prefix: "client-error", message: messages});
  });

  socket.on("image-upload", image => {
    socket.broadcast.emit("broadcast-image-upload", image);
    socket.emit("broadcast-image-upload", image);
  });

  socket.on("tag-image", tag => {
    socket.broadcast.emit("broadcast-image-tagged", tag);
    socket.emit("broadcast-image-tagged", tag);
  });

  socket.on("image-delete", image => {
    socket.broadcast.emit("broadcast-image-delete", image);
    socket.emit("broadcast-image-delete", image);
  });
});

// |========================================================|
// | Express Setup                                          |
// |========================================================|

server.listen(4200);

function haltOnTimeOut(req, res, next) {
  if (!req.timedout) {
    next();
  }
}

app.use(timeout("60m"));
app.use(haltOnTimeOut);
//app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(lessMiddleware(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public")));

app.use(apiMiddleware);
app.use(function(req, res, next) {
  res.io = io;
  next();
});

app.use("/graphql/v1", graphQLAPI);
// File uploads
app.use("/api/cala", apiCala);
app.use("/api/dashboard", apiDashboard);

// Route handling. Only the upload folder is served statically.
// All other static resource are compile by vue when they are included/required in components.
app.get('/uploads/*', (req, res) => res.sendFile(__dirname + "/public" + req.url));
app.get('*', (req, res) => res.sendFile(__dirname + "/public/index.html"));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : logger.error;

  // render the error page
  res.status(err.status || 500);
  res.send({error: err.message});
});

module.exports = app;