function toCatalog(segment, catalog) {
  const id = segment.split(' ')
    .map(s => s.toLowerCase())
    .join('-');
  return {
    ...catalog,
    'name': catalog.name + ` (${segment})`,
    'id': catalog.id + `.${id}`,
  };
}

module.exports = {
  toCatalog
}