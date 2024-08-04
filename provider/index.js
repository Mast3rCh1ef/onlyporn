const defaultProvider = require('./provider').create();
const { catalogNames } = require('../catalog');

const providers = catalogNames.map(name => require(`./${name}`)());

function loadProvider(id) {
  // TODO use a hash map later to get provider
  for (const provider of providers) {
    if (provider.activate(id)) {
      return provider;
    }
  }
  return defaultProvider;
}

module.exports = {
  loadProvider,
};