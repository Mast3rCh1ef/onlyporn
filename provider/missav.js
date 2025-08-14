const { load } = require('cheerio');
const logger = require('../logger');
const { meta } = require('../model');
const Provider = require('./provider');

const pathMappings = {
  'Uncensored leak': '/dm548/en/uncensored-leak',
  'Most viewed today': '/dm228/en/today-hot',
  'Weekly hot': '/dm146/en/weekly-hot',
  'Monthly hot': '/dm177/en/monthly-hot',
};

class MissavProvider extends Provider {

  constructor() {
    super('https://missav.ws', 'missav', 10);
    this.dataset = {};
    this.metas = {};
  }

  static create() {
    return new MissavProvider();
  }

  getInitialUrl(catalogId) {
    return this.baseUrl + '/dm428/en/new?sort=published_at';
  }

  handleSearch({ extra: { search: keyword } }) {
    return `${this.baseUrl}/search/${keyword}/`;
  }

  handleGenre({ extra: { genre } }) {
    const path = pathMappings[genre];
    return this.baseUrl + path;
  }

  handlePagination(url, { extra: { skip } }) {
    const prefix = url.indexOf('?') !== -1 ? '&' : '?';
    return `${prefix}page=${this.page(skip)}`;
  }

  getCatalogMetas(html) {
    const metadatas = [];
    const $ = load(html);

    $('div.thumbnail.group')
      .filter((_, e) => {
        return $(e).children('div').first().children().length != 0;
      })
      .each((index, element) => {
        const $children = $(element).children();
        const $first = $children.first();
        const $last = $children.last();
        const $idPosterNode = $first.children().first();
        const poster = $idPosterNode.children('img').first().attr('data-src');
        const title = $last.text().trim();
        const videoPageUrl = $last.children('a').attr('href');

        if (videoPageUrl) {
          metadatas.push(new meta.MetaPreview(
            videoPageUrl,
            'movie',
            title,
            poster,
          ));

        }
      });
    return metadatas;
  }

  async getMetadata(args) {
    return super.getMetadata(args)
      .then(meta => meta.metaResponse);
  }

  parseVideoPage({ id, html }) {
    const $ = load(html);
    const $metas = $('meta');
    let metaMap = {};
    $metas.each((i, e) => {
      const attribs = e.attribs;
      metaMap[attribs.name || attribs.property] = attribs.content;
    });
    var regex = /urls:\s*\[(.*?)\]/g;
    var match = html.match(regex);
    let videoPageUrl = '';
    if (match && match[1]) {
      // Extract the contents inside the 'urls' array
      const text = match[1].split(',')[1];
      const leftPat = 'sixyik.com\\/';
      const left = text.indexOf(leftPat);
      const uuid = text.substring(left + leftPat.length).replace('\\/seek\\/_1.jpg"', '');
      videoPageUrl = `https://surrit.com/${uuid}/playlist.m3u8`;
    }
    const metaResponse = new meta.MetaResponse(
      id,
      Provider.TYPE,
      metaMap['og:title'],
      {
        background: metaMap['og:image'],
        description: metaMap['og:description'] || metaMap['og:title'],
        genres: metaMap['keywords'].split(','),
      },
    );
    return {
      metaResponse,
      videoPageUrl,
    };
  }

  transformStream(url, stream) {
    return { ...stream, url: url.replace('playlist.m3u8', '') + stream.url };
  }
}

module.exports = MissavProvider.create;
