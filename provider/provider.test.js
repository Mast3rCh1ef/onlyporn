const { test } = require('node:test');
const assert = require('node:assert').strict;
const { loadProvider } = require('./index');
const { catalogs } = require('../catalog');
const Provider = require('../provider/provider');

test('Verify all providers', async (t) => {
  for (const catalog of catalogs) {
    await t.test(catalog.id, async (t) => {
      const catalogArgs = { type: 'movie', id: catalog.id, extra: {} };
      const provider = loadProvider(catalog.id);

      let metas = (await provider.handleCatalog(catalogArgs)).metas;
      assert.ok(metas.length > 0);
      const metaPreview = metas[0];
      verifyMetaPreview(provider, metaPreview);

      const metaArgs = { ...catalogArgs, id: metaPreview.id };
      const metaResponse = await provider.handleMeta(metaArgs);
      verifyMetaResponse(provider, metaResponse.meta);

      const streamResponse = await provider.handleStream(metaArgs);
      verifyStreamResponse(streamResponse);

      // verify search
      metas = (await provider.handleCatalog({
        ...catalogArgs,
        extra: { search: 'wife' },
      })).metas;
      assert.ok(metas.length > 0);
      verifyMetaPreview(provider, metas[0]);

      // verify genre
      metas = (await provider.handleCatalog({
        ...catalogArgs,
        extra: { genre: (catalog.extra[1].options && catalog.extra[1].options[1]) || '/cat/teens' },
      })).metas;
      assert.ok(metas.length > 0);
      verifyMetaPreview(provider, metas[0]);

      // verify skip
      metas = (await provider.handleCatalog({
        ...catalogArgs,
        extra: { skip: 10 },
      })).metas;
      assert.ok(metas.length > 0);
      verifyMetaPreview(provider, metas[0]);
    });
  }
});

function verifyMetaPreview(provider, metaPreview) {
  assert.equal(metaPreview.type, Provider.TYPE);
  assert.ok(metaPreview.id.includes(provider.getName()));
}

function verifyMetaResponse(provider, meta) {
  assert.equal(meta.type, Provider.TYPE);
  assert.ok(meta.id.includes(provider.getName()));
  assert.ok(meta.background.length > 0);
  assert.ok(meta.description.length > 0);
  // assert.ok(meta.genres.length > 0);
  assert.ok(meta.name.length > 0);
}

function verifyStreamResponse(streamResponse) {
  assert.deepEqual(Object.keys(streamResponse), ['streams']);
  for (const stream of streamResponse.streams) {
    assert.equal(stream.type, Provider.TYPE);
    assert.match(stream.name, /\d+p/);
    assert.ok(stream.url.length > 0);
    assert.ok(stream.url.includes('http'));
  }
}