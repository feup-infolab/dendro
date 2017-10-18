const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

let folderData = {
    name : 'folderMissingDescriptors',
    version: 0,
    pathInProject : '',
    download_md5 : '',
    backup_md5 : '',
    search_terms : 'folderMissingDescriptors',
    files : [
        require(Pathfinder.absPathInTestsFolder("mockdata/files/pdfMockfile.js")),
        require(Pathfinder.absPathInTestsFolder("mockdata/files/pngMockfile.js")),
        require(Pathfinder.absPathInTestsFolder("mockdata/files/xlsxMockfile.js"))
    ],
    metadata :[
        {
            prefix:"dcterms",
            shortName:"abstract",
            value:"This is a test folder and its search tag is folderMissingDescriptors. It is a fantastic test of search for specific metadata."
        }
    ]
};

module.exports = folderData;


