const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const lessMiddleware = require("less-middleware");
const logger = require("morgan");
const cors = require('cors');

const apiMiddleware = require("./middleware/api");
const socketMiddleware = require("./middleware/socket");

const indexRouter = require("./routes/index");
const dashboardRouter = require("./routes/dashboard");
const apiCala = require("./routes/api/cala");
const apiDashboard = require("./routes/api/dashboard");

const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  next();
});

app.use(logger("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(lessMiddleware(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public")));
app.use("/modules", express.static(path.join(__dirname, "node_modules")));

app.use(apiMiddleware);
//app.use(socketMiddleware);

app.use("/", indexRouter);
app.use("/dashboard", dashboardRouter);
app.use("/api/cala", apiCala);
app.use("/api/dashboard", apiDashboard);

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
  res.render('error');
});

module.exports = app;
