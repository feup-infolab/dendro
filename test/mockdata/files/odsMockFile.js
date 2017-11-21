const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const md5File = require("md5-file");

module.exports = {
    md5: md5File.sync(Pathfinder.absPathInApp("/test/mockdata/files/test_uploads/odsTest.ods")),
    name: "odsTest.ods",
    extension: "ods",
    location: Pathfinder.absPathInApp("/test/mockdata/files/test_uploads/odsTest.ods"),
    metadata: [{
        prefix: "nie",
        shortName: "plainTextContent",
        value: "This is a test of an upload for the Dendro platform in ODS (ODS) Format. "
    },
    {
        prefix: "dcterms",
        shortName: "abstract",
        value: "This is a ods file."
    },
    {
        prefix: "dcterms",
        shortName: "title",
        value: "ods file."
    }]
};
