const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const md5File = require("md5-file");

module.exports = {
    md5: md5File.sync(Pathfinder.absPathInApp("/test/mockdata/files/test_uploads/xlsxTest.xlsx")),
    name: "xlsxTest.xlsx",
    extension: "xlsx",
    location: Pathfinder.absPathInApp("/test/mockdata/files/test_uploads/xlsxTest.xlsx"),
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
