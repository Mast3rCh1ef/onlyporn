const { load } = require('cheerio');
const logger = require('../logger');
const { meta } = require('../model');
const Provider = require('./provider');

const pathMappings = {
  'Trending': '/trending_videos/',
  'New': '/new_videos/',
  'Popular': '/most_popular/',
  'Upcoming': '/upcoming/',
};

class SpankbangProvider extends Provider {

  constructor() {
    super('https://spankbang.com', 'spankbang', 80);
  }

  static create() {
    return new SpankbangProvider();
  }

  getInitialUrl(catalogId) {
    return this.baseUrl + pathMappings.Trending;
  }

  handleSearch({ extra: { search: keyword } }) {
    return `${this.baseUrl}/s/${keyword}/`;
  }
  async fetchHtml(url) {
    logger.info({ url }, 'fetching url');
    try {
      const response = await fetch(url, {
        "headers": {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language": "en-US,en;q=0.9",
          "priority": "u=0, i",
          "sec-ch-ua": "\"Chromium\";v=\"124\", \"Google Chrome\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"macOS\"",
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "same-origin",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": "1"
        },
        "referrer": "https://spankbang.com/9hj5s/video/teen+with+big+natural+tits+was+fucked+in+the+forest+in+doggy+position",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
      });
      const r = await response.text();
      return r;
    } catch (error) {
      console.error(error.message);
      return '';
    }
  }

  handleGenre({ extra: { genre } }) {
    const [keyword, order] = genre.split('(');
    if (order) {
      const searchUrl = this.handleSearch({ extra: { search: encodeURIComponent(keyword.trim()) } });
      return searchUrl + `?o=${order.replace(')', '').toLowerCase()}`;
    }

    const path = pathMappings[keyword] || pathMappings.New;
    return `${this.baseUrl}${path}`;
  }

  handlePagination(url, { extra: { skip } }) {
    const prefix = url.lastIndexOf('/') === 7 ? '/' : '';
    return `${prefix}${this.page(skip)}/`;
  }

  getCatalogMetas(html) {
    const metadataList = [];
    const $ = load(html);

    $('div.video-item')
      .each((index, element) => {
        const $e = $(element);
        const id = $e.attr('data-id');
        const $children = $e.children();
        const $first = $children.first();
        const $imgNode = $first.children().children('img');
        const poster = $imgNode.attr('data-src');
        const title = $imgNode.attr('alt');
        const videoPageUrl = this.baseUrl + $first.attr('href');

        if (id) {
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
      .then(html => this.parseVideoPage({ id, html }))
      .catch((error) => {
        logger.error({ error, args }, 'getMetadata error');
        throw error;
      })
  }

  parseVideoPage({ id, html }) {
    const $ = load(html);
    const $scripts = $('script');
    const STREAM_DATA = 'stream_data';
    const VIDEO_OBJECT = 'VideoObject';
    const datas = $scripts.filter((i, e) => e.children.length !== 0)
      .map((i, e) => e.children[0].data)
      .filter((i, data) => {
        return data.indexOf(STREAM_DATA) !== -1
          || data.indexOf(VIDEO_OBJECT) !== -1;
      });
    const url = $('meta[property="og:url"]')[0].attribs.content;
    const regex = /'m3u8':\s*\['([^\]]+)'\],/;
    let match = datas[0].match(regex);
    if (match && match[1]) {
      match = match[1];
    }
    const {
      name,
      thumbnailUrl,
      description,
      keywords,
    } = JSON.parse(datas[1].replace(/[\r\n\t]/g, ''));

    return new meta.MetaResponse(
      url,
      'movie',
      name,
      {
        videoPageUrl: match,
        poster: thumbnailUrl,
        genres: keywords.split(','),
        background: thumbnailUrl,
        description,
      },
    );
  }
}

const prov = new SpankbangProvider();
// prov.handleCatalog({type: 'movie', extra: {}})
// prov.handleStream({
//     type: 'movie',
//     id: '/9gj7a/video/blacked+anal+hungry+gabbie+carter+craves+anton+s+huge+bbc'
// })

module.exports = SpankbangProvider.create;