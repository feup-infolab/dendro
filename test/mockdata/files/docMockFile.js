const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const md5File = require("md5-file");

module.exports = {
    md5: md5File.sync(Pathfinder.absPathInApp("/test/mockdata/files/test_uploads/docTest.doc")),
    name: "docTest.doc",
    extension: "doc",
    location: Pathfinder.absPathInApp("/test/mockdata/files/test_uploads/docTest.doc"),
    metadata: [{
        prefix: "nie",
        shortName: "plainTextContent",
        value: "This is a test of an upload for the Dendro platform in Word Document (DOC) Format."
    },
    {
        prefix: "dcterms",
        shortName: "abstract",
        value: "This is a doc file."
    },
    {
        prefix: "dcterms",
        shortName: "title",
        value: "doc file."
    }]
};
