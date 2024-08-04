const { toCatalog } = require('./utils');
const catalog = require('./xhamster.json');
const segments = [
  'HD+',
  '4k',
];

const catalogs = segments.map(segment => toCatalog(segment, catalog));

module.exports = catalogs;