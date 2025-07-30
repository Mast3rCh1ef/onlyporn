const { addonBuilder } = require('stremio-addon-sdk');
const { loadProvider } = require('./provider');
const packageInfo = require('./package.json');
const { catalogs } = require('./catalog');
const logger = require('./logger');

const manifest = {
  id: 'org.masterchief.onlyporn',
  version: packageInfo.version,

  name: 'OnlyPorn',
  description: packageInfo.description,

  icon: 'https://raw.githubusercontent.com/Mast3rCh1ef/addon-asset/main/op.png',
  background:
    'https://raw.githubusercontent.com/Mast3rCh1ef/addon-asset/main/bg.png',

  resources: ['catalog', 'stream', 'meta'],

  types: ['movie'],

  catalogs,

  behaviorHints: {
    adult: true,
  },
};

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(function (args, cb) {
  return loadProvider(args.id)
    .handleCatalog(args)
    .catch((reason) => console.error(reason));
});

builder.defineStreamHandler(function (args) {
  return loadProvider(args.id)
    .handleStream(args)
    .catch((reason) => console.error(reason));
});

builder.defineMetaHandler(function (args) {
  return loadProvider(args.id)
    .handleMeta(args)
    .catch((reason) => console.error(reason));
});

console.info({ version: manifest.version });

module.exports = builder.getInterface();
