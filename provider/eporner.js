require('dotenv').config();
const { load } = require('cheerio');
const logger = require('../logger');
const { meta } = require('../model');
const Provider = require('./provider');

const sortByMappings = {
  'Most Recent': '/',
  'Weekly Top': '/SORT-top-weekly/',
  'Monthly Top': '/SORT-top-monthly/',
  'Most Viewed': '/SORT-most-viewed/',
  'Top Rated': '/SORT-top-rated/',
  Longest: '/SORT-longest/',
};

class EpornerProvider extends Provider {
  constructor() {
    super('https://www.eporner.com', 'eporner', 60);
  }

  static create() {
    return new EpornerProvider();
  }

  getInitialUrl(catalogId) {
    return this.baseUrl;
  }

  handleSearch({ extra: { search: keyword } }) {
    return `${this.baseUrl}/search/${keyword}/`;
  }

  handleGenre({ id, extra: { genre } }) {
    if (genre.includes('/cat')) {
      return `${this.baseUrl}${genre}`;
    }
    let [category, sortBy] = genre.split('(');
    category = category.toLowerCase().trim().replace(' ', '-').trim();
    sortBy = sortByMappings[sortBy.replace(')', '')];
    return `${this.baseUrl}/cat/${category}${sortBy}`;
  }

  handlePagination(url, { extra: { skip } }) {
    const prefix = url.endsWith('/') ? '' : '/';
    return `${prefix}${this.page(skip)}/`;
  }

  getCatalogMetas(html) {
    const metadataList = [];
    const $ = load(html);

    $('div.mb').each((_, element) => {
      const $e = $(element).children('.mbimg').first();
      const $a = $e.children('.mbcontent').children().first();
      const $img = $a.children('img').first();
      const poster = $img.attr('data-src') || $img.attr('src');
      const title = $img.attr('alt');
      const videoPageUrl = $a.attr('href');

      if (videoPageUrl) {
        metadataList.push(
          new meta.MetaPreview(
            this.baseUrl + videoPageUrl,
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

  getMetaLinks({ id, html }) {
    const $ = load(html);
    const $cats = $('.video-info-tags .vit-category');
    return $cats
      .map((_, cat) => {
        const $cat = $(cat).children().first();
        const href = $cat.attr('href');
        const name = $cat.text();

        return {
          name,
          category: 'Genres',
          url: `stremio:///discover/${encodeURIComponent(process.env.HOST_NAME || Provider.TRANSPORT_URL)}/movie/eporner?genre=${encodeURIComponent(href)}`,
        };
      })
      .toArray();
  }

  parseVideoPage({ id, html }) {
    let regex = /EP.video.player.hash = '(.*)';/;
    let hash = html.match(regex);
    if (hash && hash[1]) {
      hash = hash[1];
    }
    const $ = load(html);
    const $metas = $('meta');
    let metaMap = {};
    $metas.each((i, e) => {
      const attribs = e.attribs;
      metaMap[attribs.name || attribs.property] = attribs.content;
    });
    const links = this.getMetaLinks({ id, html });

    regex = /EP.video.player.vid = '(.*)';/;
    let videoId = html.match(regex);
    if (videoId && videoId[1]) {
      videoId = videoId[1];
    }

    return new meta.MetaResponse(
      id,
      Provider.TYPE,
      metaMap['og:title'],
      {
        description: metaMap['og:description'],
        poster: metaMap['og:image'],
        background: metaMap['og:image'],
        genres: links.map((link) => link.name),
        genre: links.map((link) => link.name),
        links,
        extra: { hash, videoId },
      }
    );
  }

  hash(a) {
    return (
      parseInt(a.substring(0, 8), 16).toString(36) +
      parseInt(a.substring(8, 16), 16).toString(36) +
      parseInt(a.substring(16, 24), 16).toString(36) +
      parseInt(a.substring(24, 32), 16).toString(36)
    );
  }

  async processStreams({ id }) {
    return this.fetchHtml(id)
      .then((html) => this.parseVideoPage({ id, html }))
      .then((meta) => this.getStreams(meta));
  }

  getStreams(meta) {
    const { hash, videoId } = meta.extra;
    const getVideoId = (id) => {
      const i = id.indexOf('video-') + 6;
      const j = id.indexOf('/', i);
      return id.substring(i, j);
    };
    const url = `https://www.eporner.com/xhr/video/${videoId || getVideoId(meta.id)}?hash=${this.hash(hash)}&domain=www.eporner.com&pixelRatio=2&playerWidth=0&playerHeight=0&fallback=false&embed=false&supportedFormats=hls,dash,h265,vp9,av1,mp4&_=1715117288633`;
    return this.fetchHtml(url)
      .then((res) => JSON.parse(res))
      .then((res) => this.selectSources(res.sources));
  }

  selectSources(sources) {
    if (sources.hls) {
      return super.getStreams({ videoPageUrl: sources.hls.auto.src });
    } else if (sources.mp4) {
      const streams = Object.values(sources.mp4).map((mp4) => {
        return { url: mp4.src, name: mp4.labelShort, type: Provider.TYPE };
      })
      return { streams };
    }
    return { streams: [] };
  }
}

module.exports = EpornerProvider.create;
