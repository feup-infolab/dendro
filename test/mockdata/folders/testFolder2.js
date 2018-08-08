const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

let folderData = {
    name: "testFolder2",
    version: 0,
    pathInProject: "",
    download_md5: "",
    backup_md5: "",
    searchTerms: "testFolder2",
    files: [
        rlequire("dendro", "test/mockdata/files/pdfMockFile.js"),
        rlequire("dendro", "test/mockdata/files/pngMockFile.js"),
        rlequire("dendro", "test/mockdata/files/xlsxMockFile.js"),
        rlequire("dendro", "test/mockdata/files/keywords/doc1.js"),
        rlequire("dendro", "test/mockdata/files/keywords/doc2.js"),
        rlequire("dendro", "test/mockdata/files/keywords/doc3.js"),
        rlequire("dendro", "test/mockdata/files/keywords/doc4.js"),
        rlequire("dendro", "test/mockdata/files/keywords/doc5.js"),
        rlequire("dendro", "test/mockdata/files/keywords/doc6.js"),
        rlequire("dendro", "test/mockdata/files/keywords/doc7.js"),
        rlequire("dendro", "test/mockdata/files/keywords/doc8.js"),
        rlequire("dendro", "test/mockdata/files/keywords/doc9.js"),
        rlequire("dendro", "test/mockdata/files/keywords/doc10.js"),
        rlequire("dendro", "test/mockdata/files/keywords/doc11.js"),
        rlequire("dendro", "test/mockdata/files/keywords/doc12.js"),
        rlequire("dendro", "test/mockdata/files/keywords/doc13.js"),
        rlequire("dendro", "test/mockdata/files/keywords/doc14.js"),
        rlequire("dendro", "test/mockdata/files/keywords/doc15.js"),
        rlequire("dendro", "test/mockdata/files/keywords/doc16.js")

    ],
    metadata: [
        {
            prefix: "dcterms",
            shortName: "abstract",
            value: "This is a test folder and its search tag is testFolder2. It is a fantastic test of search for specific metadata."
        },
        {
            prefix: "dcterms",
            shortName: "title",
            value: "This is the title for testFolder2"
        },
        {
            prefix: "dcterms",
            shortName: "creator",
            value: "NP"
        }
    ]
};

module.exports = folderData;
