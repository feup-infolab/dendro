const path = require("path");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const md5File = require("md5-file");

module.exports = {
    md5: md5File.sync(rlequire.absPathInApp("dendro","test/mockdata/files/test_uploads/docxTest.docx")),
    name: "docxTest.docx",
    extension: "docx",
    location: rlequire.absPathInApp("dendro","test/mockdata/files/test_uploads/docxTest.docx"),
    metadata: [{
        prefix: "nie",
        shortName: "plainTextContent",
        value: "This is a test of an upload for the Dendro platform in Word Document XML (DOCX ) Format. "
    },
    {
        prefix: "dcterms",
        shortName: "abstract",
        value: "This is a docx file."
    },
    {
        prefix: "dcterms",
        shortName: "title",
        value: "docx file."
    }]
};
