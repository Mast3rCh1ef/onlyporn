const catalog = require('./sxyprn.json');

const sortBy = [
  'Latest',
  'Trending',
  'Views',
  'Orgasmic'
];

const opt = options => ({
  'name': 'genre',
  options
});

const genres = [
  'Teens',
  'MILF',
  'German',
  'Asian',
  'BigAss',
  'Amateur',
  'Cuckold',
  'OldYoung',
  'Solo'
];

const options = []
for (const genre of genres) {
  for (const sort of sortBy) {
    options.push(`${genre} (${sort})`);
  }
}
catalog.extra.push((opt(options)));

module.exports = {
  sortBy,
  catalogs: [catalog]
};