const debug = require('debug')('microservice');

const restify     = require('restify');
const groupParser = require('@eoko/api-utils').Handlers.groupParser;
const authParser  = require('@eoko/api-utils').Handlers.authParser;
const pagination  = require('@eoko/api-utils').Handlers.pagination;

const internalServerError = require('./middleware/internalServerError');
const validationError     = require('./middleware/validationError');
const forceJson           = require('./middleware/forceJson');

const health = require('./routes/health');

class Server {

  constructor(opts) {
    this.opts         = opts;
    this.initializers = new Promise((res) => res());
    this.server       = restify.createServer(opts);

    this.defaultConfiguration();
    this.defaultListeners();
    this.defaultPre();
    this.defaultRoutes();
  }

  /**
   * Callback for external initialisation.
   *
   * @callback initCallback
   * @param {Server} Server
   */

  /**
   * Init external component in order
   * @param {initCallback} fn
   */
  addExternal(fn) {
    this.initializers = this.initializers.then(() => fn(this));
  }

  /**
   * Set default routes
   */
  defaultRoutes() {
    debug(`server listen on '/health`);
    this.get('/health', health);
  }

  /**
   * Set default server configuration
   */
  defaultConfiguration() {
    debug(`server use accept parser`, this.server.acceptable);
    this.server.use(restify.acceptParser(this.server.acceptable));

    debug(`server use query parser`);
    this.server.use(restify.queryParser());

    debug(`server use body parser`);
    this.server.use(restify.bodyParser());

    debug(`server use group parser`);
    this.server.use(groupParser);

    debug(`server use auth parser`);
    this.server.use(authParser);

    debug(`server use pagination`);
    this.server.use(pagination);
  }

  /**
   * Set default listener on server
   */
  defaultListeners() {
    debug(`Listen for internal server error`);
    this.server.on('InternalServer', internalServerError);

    debug(`Listen for validation error`);
    this.server.on('Validation', validationError);
  }

  /**
   * Set default treatment on server
   */
  defaultPre() {
    debug('Force request to be json');
    this.server.pre(forceJson);
  }

  /**
   * @return {Server}
   */
  getServer() {
    return this.server;
  }

  /**
   *
   * @param path
   * @param middlewares
   * @return {Server}
   */
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

  /**
   * Let's go!
   */
  start() {
    this
      .initializers
      .then(() => {
        debug('initializers ready');
        this.server.listen(this.opts.port || 3000, () => {
          console.log('%s listening at %s', this.server.name, this.server.url);
        });
      })
      .catch(err => {
        console.log(err);
        process.exit(1);
      })
  }
}

module.exports = Server;
