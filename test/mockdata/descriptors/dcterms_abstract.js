const path = require('path');
const Pathfinder = require(path.join(process.cwd(), 'src', 'models', 'meta', 'pathfinder.js')).Pathfinder;
const Config = require(path.join(process.cwd(), 'src', 'models', 'meta', 'config.js')).Config;

module.exports = {
    uri: 'http://purl.org/dc/terms/abstract'
};
