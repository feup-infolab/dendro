const path = require("path");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const md5File = require("md5-file");

module.exports = {
    md5: md5File.sync(rlequire.absPathInApp("dendro","test/mockdata/files/test_uploads/xlsTest.xls")),
    name: "xlsTest.xls",
    extension: "xls",
    location: rlequire.absPathInApp("dendro","test/mockdata/files/test_uploads/xlsTest.xls"),
    corrupted_location: rlequire.absPathInApp("dendro","test/mockdata/files/test_uploads/wrong_or_corrupted/xlsTest.xls"),
    metadata: [
        {
            prefix: "dcterms",
            shortName: "abstract",
            value: "This is a xlsTest file and its search tag is xlsTest.xls. It is a fantastic test of search for specific metadata."
        },
        {
            prefix: "dcterms",
            shortName: "abstract",
            value: "This is a xls file."
        },
        {
            prefix: "dcterms",
            shortName: "title",
            value: "xls file."
        }
    ]
};
