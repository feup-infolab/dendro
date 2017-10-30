const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

let folderData = {
    name : 'folderExportedCkanCkanDiffs',
    version: 0,
    pathInProject : '',
    download_md5 : '',
    backup_md5 : '',
    search_terms : 'folderExportedCkanCkanDiffs',
    files : [
        require(Pathfinder.absPathInTestsFolder("mockdata/files/pdfMockFile.js")),
        require(Pathfinder.absPathInTestsFolder("mockdata/files/pngMockFile.js")),
        require(Pathfinder.absPathInTestsFolder("mockdata/files/xlsxMockFile.js"))
    ],
    metadata :[
        {
            prefix:"dcterms",
            shortName:"abstract",
            value:"This is a test folder and its search tag is folderExportedCkanCkanDiffs. It is a fantastic test of search for specific metadata."
        },
        {
            prefix:"dcterms",
            shortName:"title",
            value:"This is the title for folderExportedCkanCkanDiffs"
        },
        {
            prefix:"dcterms",
            shortName:"creator",
            value:"NP"
        },
        {
            prefix:"dcterms",
            shortName:"description",
            value:"The description for folder folderExportedCkanCkanDiffs"
        }
    ]
};

module.exports = folderData;



