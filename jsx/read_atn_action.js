process.env.DEBUG = '*';

var atn_reader = require('./atn_reader');

var atn = atn_reader('./scripts.atn');

var util = require('util');

var config = atn

console.log( JSON.stringify(config, null, 2) );
