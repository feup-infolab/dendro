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

        if (!isNull(object.id))
        {
            self.id = object.id;
        }
        else
        {
            const uuid = require("uuid");
            self.id = uuid.v4();
        }

        self.runningPath = rlequire.absPathInApp("dendro", path.join("temp", "jupyter-notebooks", self.id));

        return self;
    }

    getHost ()
    {
        const self = this;
        return `jupyter-notebook.${self.id}`;
    }

    spinUp (callback)
    {
        const self = this;
        const DockerManager = Object.create(rlequire("dendro", "src/utils/docker/docker_manager.js").DockerManager);
        mkdirp.sync(self.runningPath);

        const baseOrchestraFile = rlequire.absPathInApp("dendro", "orchestras/dendro_notebook/docker-compose.yml");
        const cloneOrchestraFile = path.join(self.runningPath, "docker-compose.yml");

        // Async with callbacks:
        fs.copy(baseOrchestraFile, cloneOrchestraFile, err =>
        {
            if (err) return console.error(err);
            console.log("success!");

            console.log("Starting notebook");
            // console.log(`tini -g -- /usr/local/bin/start-notebook.sh --NotebookApp.base_url=\\"${self.getFullNotebookUri()}\\" --NotebookApp.password=\\"${Config.notebooks.jupyter.default_password}\\" --NotebookApp.custom_display_url=\\"${self.getFullNotebookUri()}\\"`);

            DockerManager.startOrchestra("dendro_notebook", function (err, result)
            {
                callback(err, result);
            }, null, self.runningPath, {
                DENDRO_NOTEBOOK_GUID: self.id,
                DENDRO_NOTEBOOK_VIRTUAL_HOST: self.getHost(),
                DENDRO_NOTEBOOK_FULL_URL: self.getFullNotebookUri(),
                DENDRO_NOTEBOOK_DEFAULT_PASSWORD: Config.notebooks.jupyter.default_password,
                NB_UID: process.geteuid()
            });
        });
    }

    saveNotebook (callback)
    {

    }

    getFullNotebookUri ()
    {
        const self = this;
        return "/notebook_runner/" + self.id;
    }

    rewriteUrl (relativeUrl)
    {
        const self = this;
        const url = self.getFullNotebookUri();

        if (isNull(relativeUrl))
        {
            return url;
        }
        return url + relativeUrl;
    }
}

Notebook = Class.extend(Notebook, File, "ddr:Notebook");

module.exports.Notebook = Notebook;
