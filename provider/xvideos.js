const { load } = require('cheerio');
const logger = require('../logger');
const { meta } = require('../model');
const Provider = require('./provider');

class XvideosProvider extends Provider {

  constructor() {
    super('https://www.xvideos.com', 'xvideos', 50);
  }

  static create() {
    return new XvideosProvider();
  }

  async fetchHtml(url) {
    console.info('fetching url', url);
    try {
      const response = await fetch(url, {
        "credentials": "include"
      });
      return response.text();
    } catch (error) {
      console.error(error);
      return '';
    }
  }

  getInitialUrl(catalogId) {
    return this.baseUrl;
  }

  handleSearch({ extra: { search: keyword } }) {
    return `${this.baseUrl}/?k=${keyword}`;
  }

  handleGenre(args) {
    return this.handleSearch({ ...args, extra: { search: args.extra.genre } });
  }

  handlePagination(url, { extra: { skip, search } }) {
    if (search) {
      this.limit = 25;
    }
    const prefix = url.includes('?') ? '&' : '?';
    return `${prefix}p=${this.page(skip)}`;
  }

  getCatalogMetas(html) {
    const metadatas = [];
    const $ = load(html);

    $('div.thumb-block').each((index, element) => {
      const $div = $(element);
      const $children = $div.children('div');
      let parsedMeta = {};
      // Check if the div has class "thumb-inside"
      if ($children.hasClass('thumb-inside')) {
        // Extract all attributes from tags inside the div with class "thumb-inside"
        const attributes = {};
        $children.first().find('*').each((i, el) => {
          const attrs = el.attribs;
          for (const attr in attrs) {
            attributes[attr] = attrs[attr];
          }
        });
        parsedMeta = { ...attributes };
      }

      if ($children.hasClass('thumb-under')) {
        const title = $children.last().find('p > a').attr('title');
        parsedMeta = { ...parsedMeta, title };
      }

      const id = this.baseUrl + parsedMeta['href'];
      if (parsedMeta['href']) {
        metadatas.push(new meta.MetaPreview(
          id.replace('/THUMBNUM', ''),
          Provider.TYPE,
          parsedMeta['title'],
          parsedMeta['data-src']));
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
    const links = [];
    $('div.video-tags > a').each((i, e) => {
      const $tag = $(e);
      links.push(new meta.MetaLink($tag.text(), 'Genre', this.baseUrl + $tag.attr('href')));
    });

    $('script').each((i, e) => {
      const $script = $(e);
      if ($script.text().includes('html5player')) {
        console.log("html5player", JSON.stringify($script.text()));
      }
    });

    const regexVideoHLS = /html5player\.setVideoHLS\('(.*)'\);/;
    const regexThumbnail = /html5player\.setThumbUrl169\('(.*)'\);/;
    let videoPageUrl = '';
    let background = '';

    let match = html.match(regexVideoHLS);
    if (match && match[1]) {
      videoPageUrl = match[1]; // Extracted URL from the capture group
    }

    match = html.match(regexThumbnail);
    if (match && match[1]) {
      background = match[1]; // Extracted URL from the capture group
    }

    const $metas = $('meta');
    let metaMap = {};
    $metas.each((i, e) => {
      const attribs = e.attribs;
      metaMap[attribs.name || attribs.property] = attribs.content;
    });

    const metaResponse = new meta.MetaResponse(
      id,
      Provider.TYPE,
      metaMap['og:title'],
      {
        links,
        description: metaMap['description'],
        background,
        genres: metaMap['keywords'].split(','),
      },
    );
    return {
      metaResponse,
      videoPageUrl,
    };
  }

  async processStreams({ id }) {
    return this.fetchHtml(this.baseUrl)
      .then(_ => this.fetchHtml(id))
      .then(async html => {
        const meta = this.parseVideoPage({ id, html })
        let streamsResponse = await super.getStreams(meta);
        if (streamsResponse && streamsResponse.streams.length > 0) {
          return streamsResponse;
        }

        // alternative stream
        const $ = load(html);
        const $json = JSON.parse($('script[type="application/ld+json"]').text());
        const streams = [
          {
            type: 'movie',
            url: $json["contentUrl"],
            name: 'Onlyporn',
          }
        ];
        return { streams };
      });
  }

  transformStream(url, stream) {
    return { ...stream, url: url.replace('hls.m3u8', '') + stream.url };
  }
}

const provider = XvideosProvider.create();
// const metas = provider.parseVideoPage({
//   id: 'https://www.xvideos.com/THUMBNUM', html: `
// <script>
// 	logged_user = false;
// 	var static_id_cdn = 10;
// 	var html5player = new HTML5Player('html5video', '54638695');
// 	if (html5player) {
// 	    html5player.setVideoTitle('TOMB RIDER XXX part. #01 - The Parody - (Full HD - Refurbished Version)');
// 	    html5player.setEncodedIdVideo('kuhblpm2c69');
// 	    html5player.setSponsors(false);
// 	    html5player.setVideoUrlLow('https://cdn77-vid-mp4.xvideos-cdn.com/Q5D4bOupANGTJjmiyiyEgg==,1715669269/videos/3gp/6/4/3/xvideos.com_6437c7f90ba29a1e02ade30236f76f63.mp4?ui=MTk4LjI3LjE3NC4yMTUtL3ZpZGVvLmt1aGJscG0yYzY5L3RvbWJfcmlkZXJf');
// 	    html5player.setVideoUrlHigh('https://cdn77-vid-mp4.xvideos-cdn.com/dnPcw59AsjQ-YGuP1jW3HQ==,1715669269/videos/mp4/6/4/3/xvideos.com_6437c7f90ba29a1e02ade30236f76f63.mp4?ui=MTk4LjI3LjE3NC4yMTUtL3ZpZGVvLmt1aGJscG0yYzY5L3RvbWJfcmlkZXJf');
// 	    html5player.setVideoHLS('https://cdn77-vid.xvideos-cdn.com/iq9EzdJeOvKR0-6HZInR9g==,1715669269/videos/hls/64/37/c7/6437c7f90ba29a1e02ade30236f76f63/hls.m3u8');
// 	    html5player.setThumbUrl('https://cdn77-pic.xvideos-cdn.com/videos/thumbslll/64/37/c7/6437c7f90ba29a1e02ade30236f76f63/6437c7f90ba29a1e02ade30236f76f63.9.jpg');
// 	    html5player.setThumbUrl169('https://cdn77-pic.xvideos-cdn.com/videos/thumbs169poster/64/37/c7/6437c7f90ba29a1e02ade30236f76f63/6437c7f90ba29a1e02ade30236f76f63.17.jpg');
// 	    html5player.setRelated(video_related);
// 	    html5player.setThumbSlide('https://cdn77-pic.xvideos-cdn.com/videos/thumbs169/64/37/c7/6437c7f90ba29a1e02ade30236f76f63/mozaique.jpg');
// 	    html5player.setThumbSlideBig('https://cdn77-pic.xvideos-cdn.com/videos/thumbnails/10/08/2a/54638695/mozaique_full.jpg');
// 	    html5player.setThumbSlideMinute('https://cdn77-pic.xvideos-cdn.com/videos/thumbnails/10/08/2a/54638695/mozaiquemin_');
// 	    html5player.setIdCDN('10');
// 	    html5player.setIdCdnHLS('10');
// 	    html5player.setFakePlayer(false);
// 	    html5player.setDesktopiew(true);
//       html5player.setSeekBarColor('#de2600');
// 	    html5player.setUploaderName('xtime-vod');
// 	    html5player.setVideoURL('/video.kuhblpm2c69/tomb_rider_xxx_part._01_-_the_parody_-_full_hd_-_refurbished_version_');
// 	    html5player.setStaticPath('https://static-cdn77.xvideos-cdn.com/v-f423c573279/v3/');
// 	    html5player.setHttps();
// 	    html5player.setCanUseHttps();
// 	    document.getElementById('html5video').style.minHeight = '';
// 	    html5player.initPlayer();
//    }

// </script>
// ` });

// console.log('meta', metas);

module.exports = XvideosProvider.create;