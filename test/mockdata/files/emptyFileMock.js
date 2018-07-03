const path = require("path");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const md5File = require("md5-file");

module.exports = {
    md5: md5File.sync(rlequire.absPathInApp("dendro", "test/mockdata/files/test_uploads/emptyFile.txt")),
    name: "emptyFile.txt",
    extension: "txt",
    location: rlequire.absPathInApp("dendro", "test/mockdata/files/test_uploads/emptyFile.txt")
};
