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
const Upload = rlequire("dendro", "src/models/uploads/upload.js").Upload;
const Folder = rlequire("dendro", "src/models/directory_structure/folder.js").Folder;

const gfs = Config.getGFSByID();

const async = require("async");
const mkdirp = require("mkdirp");
const fs = require("fs-extra");
const chokidar = require('chokidar');
const Queue = require("better-queue");


const q = new Queue(function (event, cb) {
    console.log("Added to Queue");
    Upload.tester(event);
    cb();
});


class Notebook {
    constructor(arg, object = {}) {
        const self = this;
        self.addURIAndRDFType(object, "notebook", Notebook);
        Notebook.baseConstructor.call(this, object);

        self.ddr.fileExtension = "folder";
        self.ddr.hasFontAwesomeClass = "fa-folder";

        if (!isNull(object.id)) {
            self.id = object.id;
        } else {
            const uuid = require("uuid");
            self.id = uuid.v4();
        }

        self.runningPath = rlequire.absPathInApp("dendro", path.join("temp", "jupyter-notebooks", self.id));
        self.dataFolderPath = path.join(self.runningPath, "data");

        self.lastModified = new Date();
        self.nie.title = "Notebook" + self.lastModified.getDate();
        self.nie.isLogicalPartOf = "/r/folder/6c7c1935-3af6-4460-ada8-dde6dc84e8d1";

    }

    getHost() {
        const self = this;
        return `jupyter-notebook.${self.id}`;
    }

    cypherPassword(plainTextPassword) {
        // Yes i know i shouresourceld not store passwords as plain text in the config.yml file.
        // That is a default password that SHOULD be changed by the jupyter user.
        const sha1 = require("sha1");
        return `sha1:${sha1(plainTextPassword)}`;
    }

    spinUp(callback) {
        const self = this;
        const DockerManager = Object.create(rlequire("dendro", "src/utils/docker/docker_manager.js").DockerManager);
        mkdirp.sync(self.runningPath);
        mkdirp.sync(self.dataFolderPath);

        const baseOrchestraFile = rlequire.absPathInApp("dendro", "orchestras/dendro_notebook/docker-compose.yml");
        const cloneOrchestraFile = path.join(self.runningPath, "docker-compose.yml");

        // Async with callbacks:
        fs.copy(baseOrchestraFile, cloneOrchestraFile, err => {
            if (err) return console.error(err);
            console.log("success!");

            console.log("Starting notebook");
            // console.log(`tini -g -- /usr/local/bin/start-notebook.sh --NotebookApp.base_url=\\"${self.getFullNotebookUri()}\\" --NotebookApp.password=\\"${Config.notebooks.jupyter.default_password}\\" --NotebookApp.custom_display_url=\\"${self.getFullNotebookUri()}\\"`);

            DockerManager.startOrchestra("dendro_notebook", function (err, result) {

                callback(err, result);
            }, null, self.runningPath, {
                DENDRO_NOTEBOOK_GUID: self.id,
                DENDRO_NOTEBOOK_VIRTUAL_HOST: self.getHost(),
                DENDRO_NOTEBOOK_FULL_URL: self.getFullNotebookUri(),
                DENDRO_NOTEBOOK_DEFAULT_PASSWORD: self.cypherPassword(Config.notebooks.jupyter.default_password),
                DENDRO_NOTEBOOK_USER_ID: process.geteuid(),
            });
        });
    }


    fileWatcher(notebookID) {
        const self = this;
        let fileLocation = path.join(__dirname.replace("src/models/directory_structure", 'temp/jupyter-notebooks/'), `${notebookID}`);

        const watcher = chokidar.watch(["."], {
            ignored: /(^|[\/\\])\../, // ignore dotfiles
            persistent: true,
            cwd: fileLocation
        });

        const log = console.log.bind(console);
        let event = {};
        watcher
            .on('add', path => {
                event.notebook = notebookID;
                event.filepath = path;
                event.type = 'add';
                self.lastModified = new Date();
                log(self.lastModified);
                log(`Notebook ${notebookID}: File ${path} has been added`);

                this.save(function (err, result) {
                    callback(err, result);
                });
                console.log("I was saved");
                q.push(event);
            })
            .on('change', path => {
                event.notebook = notebookID;
                event.filepath = path;
                event.type = 'change';
                self.lastModified = new Date();
                log(self.lastModified);
                log(`Notebook ${notebookID}: File ${path} has been changed`);
                q.push(event);
            })
            .on('unlink', path => {
                event.notebook = notebookID;
                event.filepath = path;
                event.type = 'delete';
                self.lastModified = new Date();
                log(self.lastModified);
                log(`Notebook ${notebookID}: File ${path} has been removed`);
                q.push(event);
            });
    }


    getFullNotebookUri() {
        const self = this;
        return "/notebook_runner/" + self.id;
    }

    rewriteUrl(relativeUrl) {
        const self = this;
        const url = self.getFullNotebookUri();

        if (isNull(relativeUrl)) {
            return url;
        }
        return url + relativeUrl;
    }

    getLastNotebookModification() {

    }


}

Notebook.prototype.getNotebookFolders = function (callback) {
    const self = this;
    let query =
        "SELECT ?uri, ?last_modified, ?name\n" +
        "FROM [0] \n" +
        "WHERE \n" +
        "{ \n" +
        "   ?uri rdf:type nfo:Folder \n" +
        "   ?uri ddr:modified ?last_modified. \n" +
        "} ";

    db.connection.executeViaJDBC(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.types.resource,
                value: self.uri
            }
        ],
        function (err, result) {
            if (result instanceof Array) {
                callback(err, result);
            } else {
                return callback(true, "Invalid response when getting recursive children of resource : " + self.uri);
            }
        }
    );
};


Notebook = Class.extend(Notebook, Folder, "ddr:Notebook");

module.exports.Notebook = Notebook;
