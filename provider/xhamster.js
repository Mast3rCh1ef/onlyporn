const { load } = require('cheerio');
const logger = require('../logger');
const { meta } = require('../model');
const Provider = require('./provider');

const pathMappings = {
  'Best (Daily)': '/best/daily',
  'Best (Weekly)': '/best/weekly',
  'Best (Monthly)': '/best/monthly',
};

class XhamsterProvider extends Provider {

  constructor() {
    super('https://xhamster.com', 'xhamster', 45);
  }

  static create() {
    return new XhamsterProvider();
  }


  getInitialUrl(catalogId) {
    let url = this.baseUrl;
    if (catalogId.includes('4k')) {
      url += '/4k';
    }
    return url + '/newest';
  }

  handleSearch({ extra: { search: keyword } }) {
    return `${this.baseUrl}/search/${keyword}/`;
  }

  handleGenre({ id, extra: { genre } }) {
    let path = '';
    if (id.includes('4k')) {
      path += '/4k';
    }
    path += pathMappings[genre];
    return this.baseUrl + path;
  }

  handlePagination(url, { extra: { skip } }) {
    const prefix = url.endsWith('/') ? '' : '/';
    return `${prefix}${this.page(skip)}/`;
  }

  getCatalogMetas(html) {
    const metadataList = [];

    // Load the HTML content using cheerio
    const $ = load(html);

    $('div.thumb-list__item')
      .each((_, element) => {
        const $e = $(element);
        const $a = $e.children('a');
        const $img = $a.children('img').first();
        const poster = $img.attr('src');
        const title = $img.attr('alt');
        const videoPageUrl = $a.first().attr('href');

        if (videoPageUrl) {
          metadataList.push(new meta.MetaPreview(videoPageUrl, 'movie', title, poster, {
            videoPageUrl,
          }));
        }
      });

    return metadataList;
  }

  async getMetadata(args) {
    logger.debug({ args }, 'getMetadata');
    const { id } = args;
    return this.fetchHtml(id)
      .then(html => this.parseVideoPage({ id, html }));
  }

  parseVideoPage({ id, html }) {
    const regex = /window.initials=\{(.*)\};/;
    let match = html.match(regex);
    if (match && match[1]) {
      match = '{' + match[1] + '}';
    }

    const json = JSON.parse(match);
    const { av1, h264 } = json.xplayerSettings.sources.hls;
    const response = new meta.MetaResponse(
      id,
      Provider.TYPE,
      json.videoEntity.title,
      {
        videoPageUrl: (av1 && av1.url) || (h264 && h264.url),
        description: json.videoModel.description || json.videoModel.title,
        poster: json.videoModel.thumbURL,
        background: json.videoModel.thumbURL,
        genres: (json.videoTagsListProps && json.videoTagsListProps.tags && json.videoTagsListProps.tags.map(tag => tag.name).slice(0, 20)) || [],
      },
    );

    return response;
  }

  transformStream(url, stream) {
    return {
      ...stream,
      url: url.replace('_TPL_.av1.mp4.m3u8', '')
        .replace('_TPL_.h264.mp4.m3u8', '') + stream.url,
    };
  }
}

module.exports = XhamsterProvider.create;