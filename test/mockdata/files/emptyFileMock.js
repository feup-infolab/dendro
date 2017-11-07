const path = require('path');
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;
const md5File = require('md5-file');

module.exports = {
    md5: md5File.sync(Pathfinder.absPathInApp('/test/mockdata/files/test_uploads/emptyFile.txt')),
    name: 'emptyFile.txt',
    extension: 'txt',
    location: Pathfinder.absPathInApp('/test/mockdata/files/test_uploads/emptyFile.txt')
};
