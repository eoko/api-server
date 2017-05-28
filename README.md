
```
const registry = require('@eoko/server-utils').tools.registry;
const mongoose = require('@eoko/server-utils').tools.mongoose;
const sentry = require('@eoko/server-utils').tools.sentry({ level: 'warn'});

process.env.DEBUG = 'server:*';

const Server = require('.');
const server = new Server({
  "name": "my-application", //server application context
  "port": 3000, //server port
  "version": "0.0.1", //application module version
  "apiversion": "v1", //current api version
});

server.addExternal(registry);
server.addExternal(mongoose);
server.addExternal(sentry);

server.start();
```