const path = require('path');
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;
const md5File = require('md5-file');

module.exports = {
    md5: md5File.sync(Pathfinder.absPathInApp('/test/mockdata/files/test_uploads/xlsTest.xls')),
    name: 'xlsTest.xls',
    extension: 'xls',
    location: Pathfinder.absPathInApp('/test/mockdata/files/test_uploads/xlsTest.xls'),
    corrupted_location: Pathfinder.absPathInApp('/test/mockdata/files/test_uploads/wrong_or_corrupted/xlsTest.xls'),
    metadata: [
        {
            prefix: 'dcterms',
            shortName: 'abstract',
            value: 'This is a xlsTest file and its search tag is xlsTest.xls. It is a fantastic test of search for specific metadata.'
        },
        {
            prefix: 'dcterms',
            shortName: 'abstract',
            value: 'This is a xls file.'
        },
        {
            prefix: 'dcterms',
            shortName: 'title',
            value: 'xls file.'
        }
    ]
};
