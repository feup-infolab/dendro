const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

let folderData = {
    name: "pastinhaLinda",
    version: 0,
    pathInProject: "",
    download_md5: "",
    backup_md5: "",
    searchTerms: "pastinha linda",
    files: [
        rlequire("dendro", "test/mockdata/files/pdfMockFile.js"),
        rlequire("dendro", "test/mockdata/files/pngMockFile.js"),
        rlequire("dendro", "test/mockdata/files/xlsxMockFile.js")
    ],
    metadata: [
        {
            prefix: "dcterms",
            shortName: "abstract",
            value: "This is a test folder and its search tag is pastinha linda. It is a fantastic test of search for specific metadata."
        }
    ]
};

module.exports = folderData;
