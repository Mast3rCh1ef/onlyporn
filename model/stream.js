class Stream {
  constructor(options = {}) {
    // Initialize with default values or provided options
    this.url = options.url || '';
    this.ytId = options.ytId || '';
    this.infoHash = options.infoHash || '';
    this.fileIdx = options.fileIdx || null;
    this.externalUrl = options.externalUrl || '';
    this.name = options.name || '';
    this.title = options.title || '';
    this.description = options.description || '';
    this.subtitles = options.subtitles || [];
    this.sources = options.sources || [];
  }
}

module.exports = Stream;