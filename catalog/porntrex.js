const { toCatalog } = require('./utils');
const catalog = require('./porntrex.json');
const segments = [
  'Top Rated',
];

const catalogs = segments.map(segment => toCatalog(segment, catalog));

module.exports = catalogs;