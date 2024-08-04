class MetaResponse {
  constructor(id, type, name, options = {}) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.genres = options.genres || [];
    this.poster = options.poster;
    this.posterShape = options.posterShape || 'poster';
    this.background = options.background || options.poster;
    this.logo = options.logo;
    this.description = options.description;
    this.links = options.links || [];
    this.videoPageUrl = options.videoPageUrl;
    this.extra = options.extra || {};
  }
}

class MetaLink {
  constructor(name, category, url) {
    this.name = name;
    this.category = category;
    this.url = url;
  }
}

class MetaPreview {
  constructor(id, type, name, poster, options = {}) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.poster = poster;
    this.posterShape = options.posterShape || 'poster';
    if (options.genres) {
      this.genres = options.genres;
    }
    if (options.links) {
      this.links = options.links;
    }
    this.description = options.description;
    this.videoPageUrl = options.videoPageUrl;
    this.picId = options.picId;
  }
}


class MetaConverter {
  static metaResponseToPreview(metaResponse) {
    const {
      id,
      type,
      name,
      poster,
      genres,
      links,
      description,
    } = metaResponse;

    const posterShape = metaResponse.posterShape || 'poster';

    return new MetaPreview(id, type, name, poster, {
      posterShape,
      genres,
      links,
      description,
    });
  }

  static metaPreviewToResponse(metaPreview) {
    const {
      id,
      type,
      name,
      poster,
      posterShape,
      genres,
      links,
      description,
      videoPageUrl,
      picId,
    } = metaPreview;

    return new MetaResponse(id, type, name, {
      poster,
      posterShape,
      genres,
      links,
      description,
      videoPageUrl,
      picId,
    });
  }
}

module.exports = { MetaLink, MetaPreview, MetaResponse, MetaConverter };