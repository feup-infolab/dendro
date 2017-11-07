const path = require('path');
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;
const md5File = require('md5-file');

module.exports = {
    md5: md5File.sync(Pathfinder.absPathInApp('/test/mockdata/files/test_uploads/txtTest.txt')),
    name: 'txtTest.txt',
    extension: 'txt',
    location: Pathfinder.absPathInApp('/test/mockdata/files/test_uploads/txtTest.txt'),
    metadata: [
        {
            prefix: 'dcterms',
            shortName: 'abstract',
            value: 'This is a txtTest file and its search tag is txtTest.txt. It is a fantastic test of search for specific metadata.'
        },
        {
            prefix: 'dcterms',
            shortName: 'abstract',
            value: 'This is a txt file.'
        },
        {
            prefix: 'dcterms',
            shortName: 'title',
            value: 'txt file.'
        }
    ]
};
