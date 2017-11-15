const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const md5File = require("md5-file");

module.exports = {
    md5: md5File.sync(Pathfinder.absPathInApp("/test/mockdata/files/test_uploads/zipTest.zip")),
    name: "zipTest.zip",
    extension: "zip",
    location: Pathfinder.absPathInApp("/test/mockdata/files/test_uploads/zipTest.zip"),
    metadata: [
        {
            prefix: "dcterms",
            shortName: "abstract",
            value: "This is a zipTest file and its search tag is zipTest.zip. It is a fantastic test of search for specific metadata."
        },
        {
            prefix: "dcterms",
            shortName: "abstract",
            value: "This is a zip file."
        },
        {
            prefix: "dcterms",
            shortName: "title",
            value: "zip file."
        }
    ]
};
