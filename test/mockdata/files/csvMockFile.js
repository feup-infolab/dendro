const path = require("path");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const md5File = require("md5-file");

module.exports = {
    md5: md5File.sync(rlequire.absPathInApp("dendro","test/mockdata/files/test_uploads/csvTest.csv")),
    name: "csvTest.csv",
    extension: "csv",
    location: rlequire.absPathInApp("dendro","test/mockdata/files/test_uploads/csvTest.csv"),
    metadata: [
        {
            prefix: "dcterms",
            shortName: "abstract",
            value: "This is a csv file."
        },
        {
            prefix: "dcterms",
            shortName: "title",
            value: "csv file."
        }
    ]
};
