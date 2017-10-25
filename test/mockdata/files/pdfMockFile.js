const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const md5File = require("md5-file");

module.exports = {
    md5 : md5File.sync(Pathfinder.absPathInApp("/test/mockdata/files/test_uploads/pdfTest.pdf")),
    name : "pdfTest.pdf",
    extension : "pdf",
    location : Pathfinder.absPathInApp("/test/mockdata/files/test_uploads/pdfTest.pdf"),
    metadata: [{
        prefix: "nie",
        shortName: "plainTextContent",
        value: "nie:isLogicalPartOf Pn Dn 280mm \"DCB Base Data\" 120 Dn-1 dcb:initialCrackLength dcterms:title dcb:specimenWidth dcterms:isReferencedBy Fn 120 dcterms:title dcb:specimenWidth dcterms:isVersionOf Added property instance 01/01/2014 ^^xsd:date dcterms:created 01/01/2014 ^^xsd:date dcterms:modi ed Changed modi cation timestamp Revision creation timestamp Un dcterms:creator Current dataset version Past Revisions ddr:pertainsTo Change recording C dcb:initial CrackLen gth ddr:changedDescriptor \"add\" ddr:operation \"DCB Base Data\""
    },
    {
        prefix:"dcterms",
        shortName:"abstract",
        value:"This is a pdf file."
    },
    {
        prefix:"dcterms",
        shortName:"title",
        value:"pdf file."
    }]
};