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
const Elements = rlequire("dendro", "src//models/meta/elements.js").Elements;
const db = Config.getDBByID();

const gfs = Config.getGFSByID();

const async = require("async");
const mkdirp = require("mkdirp");
const fs = require("fs-extra");
const chokidar = require('chokidar');
const Queue = require("better-queue");

const notebookFolderPath = "temp/jupyter-notebooks";


const q = new Queue(function (event, cb) {
    console.log("Added to Queue");
    Upload.tester(event);
    cb();
});


class Notebook {
    constructor(object = {}) {
        const self = this;
        self.addURIAndRDFType(object, "notebook", Notebook);
        Notebook.baseConstructor.call(this, object);

        self.ddr.fileExtension = "folder";
        self.ddr.hasFontAwesomeClass = "fa-folder";

        if (!isNull(object.id)) {
            self.ddr.notebookID = object.id;
        } else {
            const uuid = require("uuid");
            self.ddr.notebookID = uuid.v4();
        }

        self.ddr.runningPath = rlequire.absPathInApp("dendro", path.join("temp", "jupyter-notebooks", self.ddr.notebookID));
        self.ddr.dataFolderPath = path.join(self.ddr.runningPath, "data");
        
        
        
        self.lastModified = new Date();
        self.ddr.fileExtension = "notebook";

    }

    getHost() {
        const self = this;
        return `jupyter-notebook.${self.ddr.notebookID}`;
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
        mkdirp.sync(self.ddr.runningPath);
        mkdirp.sync(self.ddr.dataFolderPath);

        const baseOrchestraFile = rlequire.absPathInApp("dendro", "orchestras/dendro_notebook/docker-compose.yml");
        const cloneOrchestraFile = path.join(self.ddr.runningPath, "docker-compose.yml");

        // Async with callbacks:
        fs.copy(baseOrchestraFile, cloneOrchestraFile, err => {
            if (err) return console.error(err);
            console.log("success!");

            console.log("Starting notebook");
            // console.log(`tini -g -- /usr/local/bin/start-notebook.sh --NotebookApp.base_url=\\"${self.getFullNotebookUri()}\\" --NotebookApp.password=\\"${Config.notebooks.jupyter.default_password}\\" --NotebookApp.custom_display_url=\\"${self.getFullNotebookUri()}\\"`);

            DockerManager.startOrchestra("dendro_notebook", function (err, result) {

                callback(err, result);
            }, null, self.ddr.runningPath, {
                DENDRO_NOTEBOOK_GUID: self.ddr.notebookID,
                DENDRO_NOTEBOOK_VIRTUAL_HOST: self.getHost(),
                DENDRO_NOTEBOOK_FULL_URL: self.getFullNotebookUri(),
                DENDRO_NOTEBOOK_DEFAULT_PASSWORD: self.cypherPassword(Config.notebooks.jupyter.default_password),
                DENDRO_NOTEBOOK_USER_ID: process.geteuid(),
            });
        });
    }


    fileWatcher() {
        const self = this;
        let fileLocation = path.join(__dirname.replace("src/models/directory_structure", 'temp/jupyter-notebooks/'), `${self.ddr.notebookID}`);

        const watcher = chokidar.watch(["."], {
            ignored: /(^|[\/\\])\../, // ignore dotfiles
            persistent: true,
            cwd: fileLocation
        });

        const log = console.log.bind(console);
        let event = {};
        watcher
            .on('add', path => {
                event.notebook = self.ddr.notebookID;
                event.filepath = path;
                event.type = 'add';
                self.lastModified = new Date();
                log(self.lastModified);
                log(`Notebook ${self.ddr.notebookID}: File ${path} has been added`);
                q.push(event);
            })
            .on('change', path => {
                event.notebook = self.ddr.notebookID;
                event.filepath = path;
                event.type = 'change';
                self.lastModified = new Date();
                log(self.lastModified);
                log(`Notebook ${self.ddr.notebookID}: File ${path} has been changed`);
                q.push(event);
            })
            .on('unlink', path => {
                event.notebook = self.ddr.notebookID;
                event.filepath = path;
                event.type = 'delete';
                self.lastModified = new Date();
                log(self.lastModified);
                log(`Notebook ${self.ddr.notebookID}: File ${path} has been removed`);
                q.push(event);
            });
    }


    getFullNotebookUri() {
        const self = this;
        return "/notebook_runner/" + self.ddr.notebookID;
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

Notebook.getNotebookFolders = function (callback) {
    const self = this;
    let query =
        "SELECT ?uri, ?modified, ?name\n" +
        "FROM [0] \n" +
        "WHERE \n" +
        "{ \n" +
        "   ?uri rdf:type ddr:Notebook. \n" +
        "   ?uri ddr:modified ?modified. \n" +
        "} ";

    db.connection.executeViaJDBC(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
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


Notebook.getUnsynced = function (notebookID, modifiedDate, callback) {
    const self = this;
    let query =
        "SELECT ?uri \n" +
        "FROM [0] \n" +
        "WHERE \n" +
        "{ \n" +
        "   ?uri rdf:type ddr:Notebook. \n" +
        "   ?uri ddr:notebookID [1]. \n" +
        "   ?uri ddr:modified ?modified. \n" +
        "   FILTER (?modified < [2]). \n"+
        "} ";

    db.connection.executeViaJDBC(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.types.string,
                value: notebookID
            },
            {
                type: Elements.types.date,
                value: modifiedDate
            }
        ],
        function (err, result) {
            if (result instanceof Array && result.length === 1) {
                Notebook.findByUri(result[0].uri, callback);
            } else {
                return callback(true, "Error checking unsynced status of notebook : " + self.uri);
            }
        }
    );
};

Notebook.getActiveNotebooks = function (callback) {
    const self = this;
    fs.readdir(notebookFolderPath, function (err, dirs) {
        
        dirs = _.map(dirs, function (dir) {
            return path.join(notebookFolderPath,dir)
        });
        
        if (err) {
            callback(err, dirs);
        } else {
            async.mapSeries(dirs, function(dir, callback){
                self.getLastUpdate(dir, function(err, lastUpdate){
                    callback(err, lastUpdate);
                });
            }, function(err, allUpdates){
                if(isNull(err))
                {
                    let results = [];
                    for(let i = 0; i < dirs.length; i++)
                    {
                        results.push({
                            id: path.basename(dirs[i]),
                            lastModified: allUpdates[i]
                        });
                    }

                    callback(err, results);
                }
                else
                {
                    callback(err, allUpdates);
                }
            });
        }
    });
};


Notebook.getLastUpdate = function (dir, callback) {
    const self = this;
    fs.readdir(dir,function (err,files) {
        async.mapSeries(files, function (file, callback) {
            fs.stat(path.join(dir, file), function (err, stat) {
                if(stat.isDirectory())
                    self.getLastUpdate(path.join(dir,file),function (err, lastModified) {
                        callback(null, lastModified)
                    });
                else{
                    callback(null,stat.mtime);
                }
            })
        }, function(err, modificationDates){
            fs.stat(dir, function (err, statDir) {
                const fullModificationDates = modificationDates.concat(statDir.mtime);
                callback(err, _.max(fullModificationDates));
            });
        });

    })
};

Notebook.saveNotebookFiles = function (notebooks, callback){
    async.mapSeries(notebooks, function (notebook, callback) {
        // const notebookFolder = new Folder(notebook);
        notebook.restoreFromFolder(notebook.ddr.dataFolderPath, null, false, false, function (err,result) {
            if(isNull(err)){
                console.log("success");
                callback(err, result);
            }
            else{
                callback(err, result);
            }
        });
    }, function(err, results){
        callback(err, results);
    });
};

Notebook.prototype.save = function (callback)
{
    const self = this;
    Folder.findByUri(self.nie.isLogicalPartOf, function (err, parentFolder)
    {
        if (isNull(err) && !isNull(parentFolder))
        {
            // save parent folder
            parentFolder.insertDescriptors([new Descriptor({
                    prefixedForm: "nie:hasLogicalPart",
                    value: self.uri
                })
                ],
                function (err, result)
                {
                    if (isNull(err))
                    {
                        Folder.prototype.save.call(self,function (err, result)
                        {
                            if (isNull(err))
                            {
                                return callback(null, self);
                            }
                            return callback({
                                statusCode: 500,
                                error: {
                                    result: "error",
                                    message: "error 1 saving new notebook :" + result
                                }
                            });
                        });
                    }
                    else
                    {
                        return callback({
                            statusCode: 500,
                            error: {
                                result: "error",
                                message: "error 2 saving new notebook :" + result
                            }
                        });
                    }
                });
        }
        else
        {
            return callback({
                    statusCode: 500,
                    error: {
                        result: "error",
                        message: "error 3 saving new notebook :" + parentFolder
                    }
                }
            );
        }
    });
};

Notebook = Class.extend(Notebook, Folder, "ddr:Notebook");

module.exports.Notebook = Notebook;
