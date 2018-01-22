const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const md5File = require("md5-file");

module.exports = {
    md5: md5File.sync(Pathfinder.absPathInApp("/test/mockdata/files/test_folder_restore/zipForFolderRestore.zip")),
    name: "zipForFolderRestore.zip",
    extension: "zip",
    location: Pathfinder.absPathInApp("/test/mockdata/files/test_folder_restore/zipForFolderRestore.zip"),
    metadata: [
        {
            prefix: "dcterms",
            shortName: "abstract",
            value: "This is a zipForFolderRestore file and its search tag is zipForFolderRestore.zip. It is a fantastic test of search for specific metadata."
        },
        {
            prefix: "dcterms",
            shortName: "abstract",
            value: "This is a zip file for testing the folder restore feature."
        },
        {
            prefix: "dcterms",
            shortName: "title",
            value: "zipForFolderRestore file."
        }
    ]
};
