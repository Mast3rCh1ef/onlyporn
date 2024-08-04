require('dotenv').config()
const { Analytics } = require('@segment/analytics-node');
const event = require('./event');
const package = require('../package.json');
const { getActiveProvider } = require('../catalog');
const geoip = require('fast-geoip');
const ip = require("ip");
const { version } = require('../package.json');

const analytics = new Analytics({ writeKey: process.env.WRITE_KEY });

function track(event, properties) {
    (async () => {
        let geo = {};
        try {
            properties.clientIp = properties.clientIp || ip.address();
            if (properties.clientIp) {
                geo = await geoip.lookup(properties.clientIp);
            }
        } catch (err) {
            geo = {};
            console.warn(err);
        }

        analytics.track({
            anonymousId: Math.random().toString(16).replace('0.', ''),
            event,
            properties: {
                ...properties,
                metaId: properties.id,
                version: package.version,
                provider: getActiveProvider(properties.id),
                geo,
                version
            }
        })
    })()
}

module.exports = {
    event,
    track
};