const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

let folderData = {
    name: "testFolder2",
    version: 0,
    pathInProject: "",
    download_md5: "",
    backup_md5: "",
    searchTerms: "testFolder2",
    files: [
        require(Pathfinder.absPathInTestsFolder("mockdata/files/pdfMockFile.js")),
        require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc1.js")),
        require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc2.js")),
        require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc3.js")),
        require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc4.js")),
        require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc5.js")),
        require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc6.js")),
        require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc7.js")),
        require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc8.js")),
        require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc9.js")),
        require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc10.js")),
        require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc11.js")),
        require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc12.js")),
        require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc13.js")),
        require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc14.js")),
        require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc15.js")),
        require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc16.js")),
        require(Pathfinder.absPathInTestsFolder("mockdata/files/pngMockFile.js")),
        require(Pathfinder.absPathInTestsFolder("mockdata/files/xlsxMockFile.js"))
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

