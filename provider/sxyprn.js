require('dotenv').config();
const { load } = require('cheerio');
const logger = require('../logger');
const { meta } = require('../model');
const Provider = require('./provider');

const sortByMappings = {
  'Latest': 'latest',
  'Trending': 'trending',
  'Views': 'views',
  'Orgasmic': 'orgasmic',
};

class SxyprnProvider extends Provider {
  constructor() {
    super('https://www.sxyprn.com', 'sxyprn', 25);
  }

  static create() {
    return new SxyprnProvider();
  }

  getInitialUrl(catalogId) {
    return this.baseUrl
  }

  handleSearch({ extra: { search: keyword } }) {
    return `${this.baseUrl}/${encodeURIComponent(keyword)}.html`;
  }

  handleGenre({ id, extra: { genre } }) {
    if (genre.includes('/cat')) {
      return `${this.baseUrl}${genre}`;
    }
    let [category, sortBy] = genre.split('(');
    category = category.trim().replace(' ', '-').trim();
    sortBy = sortByMappings[sortBy.replace(')', '')];
    return `${this.baseUrl}/${category}.html?sm=${sortBy.toLowerCase()}`;
  }

  handlePagination(url, { extra: { genre, skip } }) {
    const limit = 30;
    if (genre) {
      return `&page=${limit * this.page(skip)}`
    }
    if (url === this.baseUrl) {
      return `/orgasm/${limit * this.page(skip)}`;
    }
    const prefix = url.endsWith('/') ? '' : '/';
    return `${prefix}${this.page(skip)}`;
  }

  getCatalogMetas(html) {
    const metadataList = [];
    const $ = load(html);

    $('div.post_el_small').each((_, element) => {
      const $e = $(element);
      const title = $e.children('.post_text').text();
      const poster = 'https:' + $e.find('img').first().attr('data-src');
      const path = $e.find('.js-pop').first().attr('href');
      const videoPageUrl = this.baseUrl + path;

      if (path) {
        metadataList.push(
          new meta.MetaPreview(
            videoPageUrl,
            'movie',
            title,
            poster,
            {
              videoPageUrl,
            }
          )
        );
      }
    });

    return metadataList;
  }

  async getMetadata(args) {
    logger.debug({ args }, 'getMetadata');
    const { id } = args;
    return this.fetchHtml(id).then((html) => this.parseVideoPage({ id, html }));
  }

  getvsrc(html) {
    const $ = load(html);
    if ($('.vidsnfo').length) {
      var vidsnfo = $('.vidsnfo').data('vnfo');
      for (const [pid, src] of Object.entries(vidsnfo)) {
        var tmp = src.split("/");
        tmp[1] += "8";
        tmp = this.preda(tmp);
        return tmp.join("/");
      }
    }
    return null;
  }

  preda(arg) {
    arg[5] -= parseInt(this.ssut51(arg[6])) + parseInt(this.ssut51(arg[7]));
    return arg;
  }

  ssut51(arg) {
    var str = arg.replace(/[^0-9]/g, '');
    var sut = 0;
    for (var i = 0; i < str.length; i++) {
      sut += parseInt(str.charAt(i), 10);
    }
    return sut;
  }

  parseVideoPage({ id, html }) {
    const $ = load(html);
    let videoPageUrl = null;
    const $metas = $('meta');
    let metaMap = {};
    $metas.each((i, e) => {
      const attribs = e.attribs;
      metaMap[attribs.name || attribs.property] = attribs.content;
    });
    const poster = 'https:' + metaMap['og:image'];
    const description = metaMap['og:description'];
    const vidSrc = this.getvsrc(html);

    if (vidSrc) {
      videoPageUrl = this.baseUrl + vidSrc;
    }

    return new meta.MetaResponse(
      id,
      Provider.TYPE,
      metaMap['og:title'],
      {
        description,
        poster,
        background: poster,
        videoPageUrl
      }
    );
  }

  async getStreams(meta) {
    return {
      streams: [
        {
          type: Provider.TYPE,
          url: meta.videoPageUrl,
          name: 'OnlyPorn HD'
        }
      ]
    };
  }
}

module.exports = SxyprnProvider.create;
