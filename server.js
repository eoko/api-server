const restify       = require('restify');
const groupParser   = require('@eoko/api-utils').Handlers.groupParser;
const authParser    = require('@eoko/api-utils').Handlers.authParser;
const mongoose      = require('mongoose');
const winston       = require('winston');
const winstonSentry = require('winston-sentry');

class Server {

  constructor(opts) {
    this.opts   = opts;
    this.mongo  = null;
    this.server = restify.createServer({
      name: opts.name,
      version: opts.version,
    });

    if (opts.sentry) Server.addSentry(opts.sentry.level, opts.sentry.dsn);
    if (opts.mongo) this.addMongo(opts.mongo.uri);

    this.configure();
    this.addListeners();
  }

  configure() {
    this.server.use(restify.acceptParser(this.server.acceptable));
    this.server.use(restify.queryParser());
    this.server.use(restify.bodyParser());
    this.server.use(groupParser);
    this.server.use(authParser);
  }

  addListeners() {
    this.server.on('InternalServer', (req, res, err, cb) => {
      res.statusCode = 406;
      res.send({ message: err.message, details: err.errors });
      return cb();
    });

    this.server.on('Validation', (req, res, err) => {
      res.statusCode = 406;
      res.send({ message: err.message, details: err.errors });
    });

    this.server.pre((req, res, next) => {
      req.headers.accept = 'application/json';  // screw you client!
      return next();
    });

    process.on('SIGINT', () => {
      this.mongoose.connection.close(() => {
        winston.info('Mongoose default connection disconnected through app termination');
        process.exit(0);
      });
    });
  }

  static addSentry(level, dsn) {
    const sentryLevel = level || 'warn';
    const sentryDsn   = dsn;

    winston.info(`Sentry will be used with a level '${sentryLevel}' and a DSN '${sentryDsn}'.`);

    winston.transports.Sentry = winstonSentry;
    winston.add(winston.transports.Sentry, { dsn: sentryDsn, level: sentryLevel });
  }

  addMongo(uri) {
    mongoose.connect(uri);

    mongoose.connection.on('connected', () => {
      winston.info(`Mongoose default connection open to ${uri}`);
    });
    mongoose.connection.on('error', err => {
      winston.err(`Mongoose default connection error: ${err}`);
    });
    mongoose.connection.on('disconnected', err => {
      winston.info('Mongoose default connection disconnected', err);
    });

    this.mongoose = mongoose;
  }

  getServer() {
    return this.server;
  }

  add(method, path, ...middlewares) {
    middlewares.unshift(path);
    this.server[method].apply(this.server, middlewares);
    return this;
  }

  /**
   *
   * @param path
   * @param middlewares
   * @return {Server}
   */
  get(path, ...middlewares) {
    this.add('get', path, ...middlewares);
    return this;
  }

  /**
   *
   * @param path
   * @param middlewares
   * @return {Server}
   */
  post(path, ...middlewares) {
    this.add('post', path, ...middlewares);
    return this;
  }

  /**
   *
   * @param path
   * @param middlewares
   * @return {Server}
   */
  put(path, ...middlewares) {
    this.add('put', path, ...middlewares);
    return this;
  }

  /**
   *
   * @param path
   * @param middlewares
   * @return {Server}
   */
  del(path, ...middlewares) {
    this.add('del', path, ...middlewares);
    return this;
  }

  /**
   *
   * @param path
   * @param middlewares
   * @return {Server}
   */
  patch(path, ...middlewares) {
    this.add('patch', path, ...middlewares);
    return this;
  }

  start() {
    this.server.listen(this.opts.http.port || 3000, () => {
      winston.info('%s listening at %s', this.server.name, this.server.url);
    });
  }
}

module.exports = Server;
