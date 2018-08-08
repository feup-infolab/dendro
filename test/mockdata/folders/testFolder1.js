const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

let folderData = {
    name: "testFolder1",
    version: 0,
    pathInProject: "",
    download_md5: "",
    backup_md5: "",
    searchTerms: "testFolder1",
    files: [
        rlequire("dendro", "test/mockdata/files/pdfMockFile.js"),
        rlequire("dendro", "test/mockdata/files/pngMockFile.js"),
        rlequire("dendro", "test/mockdata/files/xlsxMockFile.js"),
        rlequire("dendro", "test/mockdata/files/keywords/BusPerformance.js"),
        rlequire("dendro", "test/mockdata/files/keywords/SimulatingVehicle.js"),
        rlequire("dendro", "test/mockdata/files/keywords/driverattitude.js"),
        rlequire("dendro", "test/mockdata/files/keywords/RegenerativeBraking.js"),
        rlequire("dendro", "test/mockdata/files/keywords/RoutePlanning.js")

    ],
    metadata: [
        {
            prefix: "dcterms",
            shortName: "abstract",
            value: "This is a test folder and its search tag is testFolder1. It is a fantastic test of search for specific metadata."
        },
        {
            prefix: "dcterms",
            shortName: "title",
            value: "This is the title for testFolder1"
        },
        {
            prefix: "dcterms",
            shortName: "creator",
            value: "NP"
        }
    ]
};

module.exports = folderData;
