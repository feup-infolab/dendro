const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const md5File = require("md5-file");

module.exports = {
    md5: md5File.sync(Pathfinder.absPathInApp("/test/mockdata/files/test_uploads/pngTest.png")),
    name: "pngTest.png",
    extension: "png",
    location: Pathfinder.absPathInApp("/test/mockdata/files/test_uploads/pngTest.png"),
    metadata: [
        {
            prefix: "dcterms",
            shortName: "abstract",
            value: "This is a png file."
        },
        {
            prefix: "dcterms",
            shortName: "title",
            value: "png file."
        }
    ]
};
