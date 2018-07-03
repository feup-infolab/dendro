const path = require("path");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const md5File = require("md5-file");

module.exports = {
    md5: md5File.sync(rlequire.absPathInApp("dendro","test/mockdata/files/test_uploads/pngTest.png")),
    name: "pngTest.png",
    extension: "png",
    location: rlequire.absPathInApp("dendro","test/mockdata/files/test_uploads/pngTest.png"),
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
