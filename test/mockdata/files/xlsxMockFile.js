const path = require("path");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const md5File = require("md5-file");

module.exports = {
    md5: md5File.sync(rlequire.absPathInApp("dendro","test/mockdata/files/test_uploads/xlsxTest.xlsx")),
    name: "xlsxTest.xlsx",
    extension: "xlsx",
    location: rlequire.absPathInApp("dendro","test/mockdata/files/test_uploads/xlsxTest.xlsx"),
    metadata: [
        {
            prefix: "dcterms",
            shortName: "abstract",
            value: "This is a xlsxTest file and its search tag is xlsxTest.xls. It is a fantastic test of search for specific metadata."
        },
        {
            prefix: "dcterms",
            shortName: "abstract",
            value: "This is a xlsx file."
        },
        {
            prefix: "dcterms",
            shortName: "title",
            value: "xlsx file."
        }]
};
