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
const File = rlequire("dendro", "src/models/directory_structure/file.js").File;

const gfs = Config.getGFSByID();

const async = require("async");
const mkdirp = require("mkdirp");
const fs = require("fs-extra");

class Notebook
{
    constructor (object = {})
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

        if (isNull(ext)) // todo
        {
            self.ddr.fileExtension = "default";
        }
        else
        {
            let getClassNameForExtension = require("font-awesome-filetypes").getClassNameForExtension;
            self.ddr.fileExtension = ext;
            self.ddr.hasFontAwesomeClass = getClassNameForExtension(ext);
        }

        const uuid = require("uuid");
        self.id = uuid.v4();
        self.runningPath = rlequire.absPathInApp("dendro", path.join("temp", "jupyter-notebooks", self.id));

        return self;
    }

    spinUp (callback)
    {
        const self = this;
        const DockerManager = Object.create(rlequire("dendro", "src/utils/docker/docker_manager.js").DockerManager);
        mkdirp.sync(self.runningPath);

        const baseOrchestraFile = rlequire.absPathInApp("dendro","orchestras/dendro_notebook/docker-compose.yml");
        const cloneOrchestraFile = path.join(self.runningPath, "docker-compose.yml");

        // Async with callbacks:
        fs.copy(baseOrchestraFile, cloneOrchestraFile, err =>
        {
            if (err) return console.error(err);
            console.log("success!");
            DockerManager.startOrchestra("dendro_notebook", function (err, result)
            {
                callback(err, result);
            }, null, self.runningPath, {DENDRO_NOTEBOOK_GUID: self.id});
        });
    }
}

Notebook = Class.extend(Notebook, File, "ddr:Notebook");

module.exports.Notebook = Notebook;
