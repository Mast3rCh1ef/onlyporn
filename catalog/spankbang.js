const catalog = require('./spankbang.json');

const sortBy = [
  'All',
  'New',
  'Trending',
  'Popular',
  'Featured'
];

const opt = options => ({
  'name': 'genre',
  options
});

const genres = [
  '4k Porn',
  'HD 1080p',
  'Amateur',
  'Students',
  'Japanese',
  'Asian Porn',
  'Big Tits',
  'Teens',
  'Family',
  'Creampie',
  'Small Tits',
  'Uncategorized'
];

const options = [
  'New',
  'Trending',
  'Upcoming',
  'Popular'
]
for (const genre of genres) {
  for (const sort of sortBy) {
    options.push(`${genre} (${sort})`);
  }
}
catalog.extra.push((opt(options)));

module.exports = {
  sortBy,
  spankbangCatalogs: [catalog]
};