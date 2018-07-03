const path = require("path");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const md5File = require("md5-file");

module.exports = {
    md5: md5File.sync(rlequire.absPathInApp("dendro","test/mockdata/files/test_uploads/uploadedFileToCkan.txt")),
    name: "uploadedFileToCkan.txt",
    extension: "txt",
    location: rlequire.absPathInApp("dendro","test/mockdata/files/test_uploads/uploadedFileToCkan.txt"),
    metadata: [{
        prefix: "nie",
        shortName: "plainTextContent",
        value: "nie:isLogicalPartOf Pn Dn 280mm \"DCB Base Data\" 120 Dn-1 dcb:initialCrackLength dcterms:title dcb:specimenWidth dcterms:isReferencedBy Fn 120 dcterms:title dcb:specimenWidth dcterms:isVersionOf Added property instance 01/01/2014 ^^xsd:date dcterms:created 01/01/2014 ^^xsd:date dcterms:modi ed Changed modi cation timestamp Revision creation timestamp Un dcterms:creator Current dataset version Past Revisions ddr:pertainsTo Change recording C dcb:initial CrackLen gth ddr:changedDescriptor \"add\" ddr:operation \"DCB Base Data\""
    }]
};
