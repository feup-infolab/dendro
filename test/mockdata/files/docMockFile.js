const path = require("path");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const md5File = require("md5-file");

module.exports = {
    md5: md5File.sync(rlequire.absPathInApp("dendro", "test/mockdata/files/test_uploads/docTest.doc")),
    name: "docTest.doc",
    extension: "doc",
    location: rlequire.absPathInApp("dendro", "test/mockdata/files/test_uploads/docTest.doc"),
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
