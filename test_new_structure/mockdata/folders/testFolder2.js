let folderData = {
    name : 'testFolder2',
    version: 0,
    pathInProject : '',
    download_md5 : '',
    backup_md5 : '',
    search_terms : 'testFolder2',
    files : [
        require("../files/pdfMockfile"),
        require("../files/pngMockfile"),
        require("../files/xlsxMockfile")
    ],
    metadata :[
        {
            prefix:"dcterms",
            shortName:"abstract",
            value:"This is a test folder and its search tag is testFolder2. It is a fantastic test of search for specific metadata."
        },
        {
            prefix:"dcterms",
            shortName:"title",
            value:"This is the title for testFolder2"
        },
        {
            prefix:"dcterms",
            shortName:"creator",
            value:"NP"
        }
    ]
};

module.exports = folderData;

