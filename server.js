#!/usr/bin/env node

const serveHTTP = require('./server-sdk');
const addonInterface = require('./addon');
serveHTTP(addonInterface, { port: process.env.PORT || 49581 });