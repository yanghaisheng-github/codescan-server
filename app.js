var createError = require('http-errors');
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
//var logger = require('morgan');

var log4js = require('log4js');
log4js.configure('./config/logConfig.json');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var systemlistingRouter = require('./routes/systemlisting');
var uploadRouter = require('./routes/upload');
var mmscRouter = require('./routes/mmsc');
var headerRouter = require('./routes/header');
var tabAnalysisReportRouter = require('./routes/tabAnalysisReport');

var app = express();

app.use("*", function (req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') { res.sendStatus(200) } else { next() }
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//app.use(logger('dev'));
app.use(log4js.connectLogger(log4js.getLogger("http"), { level: 'trace' }));

app.use(cookieParser());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());


app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'RTF')));

app.use('/', indexRouter);
app.use('/header', headerRouter);
app.use('/user/login', usersRouter);
app.use('/systemlisting/table', systemlistingRouter);
app.use('/users/table', usersRouter);
app.use('/tabAnalysisReport', tabAnalysisReportRouter);

app.use('/upload', uploadRouter);
app.use('/mmsc', mmscRouter);

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
