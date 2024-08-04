const axios = require('axios');
const m3u8 = require('m3u8-parser');
const logger = require('../logger');
const { event, track } = require('../analytics');

class Provider {
  static LIMIT = 50;
  static TYPE = 'movie';
  static TRANSPORT_URL = 'https://07b88951aaab-jaxxx-v2.baby-beamup.club/manifest.json';

  constructor(baseUrl, name, limit) {
    this.baseUrl = baseUrl;
    this.name = name;
    this.limit = limit || Provider.LIMIT;
  }

  getName() {
    return this.name;
  }

  activate(catalogId) {
    return catalogId.indexOf(this.getName()) !== -1;
  }

  getInitialUrl(catalogId) {
    return this.baseUrl;
  }

  static create() {
    return new Provider('', 'default');
  }

  async fetchHtml(url) {
    console.info('fetching url', url);
    try {
      const response = await fetch(url);
      return response.text();
    } catch (error) {
      console.error(error);
      return '';
    }
  }

  page(skip) {
    if (skip) {
      const page = Math.ceil((skip || 0) / this.limit);
      if (page === 0) {
        return '';
      }
      return `${page}`;
    }
    return '';
  }

  handleSearch({ extra: { search: keyword } }) {
    return `/search/${keyword}/`;
  }

  handleGenre({ extra: { genre } }) {
    return '?genre=' + genre;
  }

  handlePagination(url, { extra: { skip } }) {
    return `?skip=${skip}`;
  }

  getCatalogMetas(html) {
    return [];
  }

  getAnalyticEvent(event, id) {
    if (id) {
      return `${event}-${id}`;
    }
    return `${event}-${this.getName()}`;
  }

  async handleCatalog(args) {
    if (args.type === Provider.TYPE && this.activate(args.id)) {
      this.track(this.getAnalyticEvent(event.CATALOG, args.id), args);
      logger.info({ args }, 'handleCatalog');
      let url = this.getInitialUrl(args.id);
      if (args.extra) {
        if (args.extra.search) {
          url = this.handleSearch(args);
        }
        if (args.extra.genre) {
          url = this.handleGenre(args);
        }
      }

      if (args.extra.skip) {
        url += this.handlePagination(url, args);
      }

      const html = await this.fetchHtml(url).catch(e => '');
      const metas = this.getCatalogMetas(html);
      logger.debug({ metasSize: metas.length }, 'catalog');
      return Promise.resolve({ metas });
    } else {
      return Promise.resolve({ metas: [] });
    }
  }

  async handleMeta(args) {
    if (args.type === Provider.TYPE && this.activate(args.id)) {
      this.track(this.getAnalyticEvent(event.METADATA), args);
      return this.getMetadata(args)
        .then(meta => {
          return { meta };
        });
    }

    return Promise.resolve({ meta: {} });
  }

  async getMetadata(args) {
    logger.info({ args }, 'getMetadata');
    const { id } = args;
    return this.fetchHtml(id)
      .then(html => this.parseVideoPage({ id, html }));
  }

  async handleStream(args) {
    const { id } = args;
    if (args.type === Provider.TYPE && this.activate(id)) {
      this.track(this.getAnalyticEvent(event.STREAM), args);
      logger.info({ args }, 'handleStream');
      return this.processStreams(args);
    }
    return Promise.resolve({ streams: [] });
  }

  async processStreams({ id }) {
    return this.fetchHtml(id)
      .then(html => this.parseVideoPage({ id, html }))
      .then(meta => this.getStreams(meta));
  }

  getStreams(meta) {
    return this.fetchHtml(meta.videoPageUrl)
      .then(content => this.parseM3u8(content))
      .then(streams => streams.map(stream => this.transformStream(meta.videoPageUrl, stream)))
      .then(streams => {
        return { streams };
      });
  }

  transformStream(url, stream) {
    return stream;
  }

  parseM3u8(content) {
    const streams = [];
    const parser = new m3u8.Parser();
    parser.push(content);
    parser.end();
    try {
      parser.manifest.playlists.forEach(playlist => {
        streams.push({
          resolution: playlist.attributes.RESOLUTION.height + 'p',
          uri: playlist.uri,
        });
      });
      streams.sort((a, b) => parseInt(b.resolution.split('p')[0]) - parseInt(a.resolution.split('p')[0]));
      logger.debug({ streams }, 'streams', streams.length);
      return streams.map((stream) => {
        return {
          type: 'movie',
          url: stream.uri,
          name: stream.resolution,
        };
      });
    } catch (e) {
      console.error('parseM3u8 error', e);
      return streams;
    }
  }

  parseVideoPage(args) {
    return {};
  }

  track(a1, a2) {
    // track(a1, a2)
  }
}

module.exports = Provider;