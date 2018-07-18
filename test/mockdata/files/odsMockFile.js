const path = require("path");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const md5File = require("md5-file");

module.exports = {
    md5: md5File.sync(rlequire.absPathInApp("dendro", "test/mockdata/files/test_uploads/odsTest.ods")),
    name: "odsTest.ods",
    extension: "ods",
    location: rlequire.absPathInApp("dendro", "test/mockdata/files/test_uploads/odsTest.ods"),
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
