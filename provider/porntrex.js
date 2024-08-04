const { load } = require('cheerio');
const logger = require('../logger');
const { meta } = require('../model');
const Provider = require('./provider');

class PorntrexProvider extends Provider {

  constructor() {
    super('https://porntrex.com/', 'porntrex');
    this.dataset = {};
    this.metas = {};
  }

  static create() {
    return new PorntrexProvider();
  }

  getInitialUrl(catalogId) {
    // handle top-rated, most-commented, most-popular etc.
    const segment = this.getSegment(catalogId);
    if (segment) {
      return `${this.baseUrl}${segment}/`;
    }
    return this.baseUrl;
  }

  getSegment(catalogId) {
    return catalogId.substring(this.getName().length + 1);
  }

  handleSearch({ id, extra: { search: keyword } }) {
    const segment = this.getSegment(id);
    return `${this.baseUrl}search/${keyword}/${segment}/`;
  }

  handleGenre(args) {
    return this.handleSearch({ ...args, extra: { search: args.extra.genre } });
  }

  handlePagination(url, { extra: { skip } }) {
    const prefix = url.endsWith('/') ? '' : '/';
    return `${prefix}${this.page(skip)}/`;
  }

  getCatalogMetas(html) {
    const metas = [];

    // Load the HTML content using cheerio
    const $ = load(html);

    // Find all divs within the specified container with class "mozaique cust-nb-cols"
    $('div.video-item').each((index, element) => {
      const $e = $(element);
      const $a = $e.children('a');
      const videoPageUrl = $a.attr('href');
      const $img = $a.children('img');
      const poster = $img.attr('data-src');
      const title = $img.attr('alt');

      metas.push(new meta.MetaPreview(
        videoPageUrl,
        'movie',
        title,
        'https:' + poster,
      ));
    });

    return metas;
  }

  async getMetadata(args) {
    return super.getMetadata(args)
      .then(meta => meta.metaResponse);
  }

  async getStreams(meta) {
    if (meta) {
      const qualities = [
        'video_alt_url5',
        'video_alt_url4',
        'video_alt_url3',
        'video_alt_url2',
        'video_alt_url',
      ];
      const streams = qualities
        .filter(key => meta.hasOwnProperty(key) && meta[key])
        .map(key => {
          return {
            url: 'https://' + meta[key],
            name: meta[key + '_text'],
            type: Provider.TYPE,
          };
        });
      logger.debug({ streams }, 'streams %d', streams.length);
      return { streams };
    }
    return Promise.resolve({ streams: [] });
  }

  fixLooseJson(looseJsonString) {
    // Remove leading/trailing quotes and white spaces
    let jsonString = looseJsonString.trim().replace(/^"(.*)"$/, '$1');

    // Replace single quotes with double quotes
    jsonString = jsonString.replace(/'/g, '"');

    // Ensure keys are enclosed in double quotes
    jsonString = jsonString.replace(/(\w+)\s*:/g, '"$1":');

    // Ensure values are correctly formatted (strings should be enclosed in double quotes)
    jsonString = jsonString.replace(/:\s*'([^']*)'/g, ': "$1"');

    return jsonString;
  }

  parseVideoPage({ id, html }) {
    const regex = /var flashvars = (\{[^;]*\});/;
    let match = html.match(regex);
    if (match && match[1]) {
      const {
        video_title,
        video_categories,
        preview_url,
        video_alt_url5,
        video_alt_url4,
        video_alt_url3,
        video_alt_url2,
        video_alt_url,
        video_alt_url5_text,
        video_alt_url4_text,
        video_alt_url3_text,
        video_alt_url2_text,
        video_alt_url_text,
      } = JSON.parse(this.fixLooseJson(match[1]
        .replace('var flashvars =', '')
        .replaceAll('https://', '')
        .replace(';', '')
        .trim()));
      const metaResponse = new meta.MetaResponse(
        id,
        'movie',
        video_title,
        {
          genres: video_categories.split(','),
          background: 'https:' + preview_url,
          description: video_title,
        },
      );
      return {
        metaResponse,
        video_alt_url5,
        video_alt_url4,
        video_alt_url3,
        video_alt_url2,
        video_alt_url,
        video_alt_url5_text,
        video_alt_url4_text,
        video_alt_url3_text,
        video_alt_url2_text,
        video_alt_url_text,
      };
    }
    return {};
  }
}

module.exports = PorntrexProvider.create;