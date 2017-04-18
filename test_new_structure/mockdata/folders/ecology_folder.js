let folderData = {
    name : 'ecologyFolder',
    pathInProject : '',
    download_md5 : '',
    backup_md5 : '',
    search_terms : 'ecological',
    files : [
        require("../files/pdfMockfile"),
        require("../files/pngMockfile"),
        require("../files/xlsxMockfile")
    ],
    metadata :
        {
            dcterms:
                {
                    abstract : "This is a test folder and its search tag is ecological information base data."
                }
        }
};

module.exports = folderData;