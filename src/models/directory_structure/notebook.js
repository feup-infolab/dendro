// complies with the NIE ontology (see http://www.semanticdesktop.org/ontologies/2007/01/19/nie/#InformationElement)

const path = require("path");
const XLSX = require("xlsx");
const _ = require("underscore");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const InformationElement = rlequire("dendro", "src/models/directory_structure/information_element.js").InformationElement;
const DataStoreConnection = rlequire("dendro", "src/kb/datastore/datastore_connection.js").DataStoreConnection;
const Class = rlequire("dendro", "src/models/meta/class.js").Class;
const Descriptor = rlequire("dendro", "src/models/meta/descriptor.js").Descriptor;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const Notification = rlequire("dendro", "src/models/notifications/notification.js").Notification;
const gfs = Config.getGFSByID();

const async = require("async");

function Notebook (object = {})
{
    const self = this;
    self.addURIAndRDFType(object, "notebook", Notebook);
    Notebook.baseConstructor.call(this, object);

    if (!isNull(object.nie))
    {
        self.nie.isLogicalPartOf = object.nie.isLogicalPartOf;
        self.nie.title = object.nie.title;
    }

    const re = /(?:\.([^.]+))?$/;
    let ext = re.exec(self.nie.title)[1]; // "txt"

    if (isNull(ext))//todo
    {
        self.ddr.fileExtension = "default";
    }
    else
    {
        let getClassNameForExtension = require("font-awesome-filetypes").getClassNameForExtension;
        self.ddr.fileExtension = ext;
        self.ddr.hasFontAwesomeClass = getClassNameForExtension(ext);
    }

    return self;
}


Notebook = Class.extend(Notebook, File, "ddr:Notebook");

module.exports.Notebook = Notebook;
