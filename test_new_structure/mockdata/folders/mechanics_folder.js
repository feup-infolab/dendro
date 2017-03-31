let folderData = {
    name : 'pastinhaLinda',
    pathInProject : '',
    download_md5 : '',
    backup_md5 : '',
    search_terms : 'fracture mechanics',
    files : [
        require("../files/pdfMockfile"),
        require("../files/pngMockfile"),
        require("../files/xlsxMockfile")
    ],
    metadata :
        {
            dcterms:
                {
                    abstract : "This is a test folder that contains fracture mechanics base data."
                }
        }
};

module.exports = folderData;