
// follows the DC Terms ontology :
// @see http://bloody-byte.net/rdf/dc_owl2dl/dc.ttl
// creator is an URI to the author : http://dendro.fe.up.pt/user/<username>

const moment = require("moment");
const rlequire = require("rlequire");
const request = require("request");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Resource = rlequire("dendro", "src/models/resource.js").Resource;
const Project = rlequire("dendro", "src/models/project.js").Project;
const Folder = rlequire("dendro", "src/models/directory_structure/folder.js").Folder;
const Class = rlequire("dendro", "src//models/meta/class.js").Class;
const Elements = rlequire("dendro", "src//models/meta/elements.js").Elements;
const db = Config.getDBByID();
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const StorageConfig = rlequire("dendro", "src/models/storage/storageConfig.js").StorageConfig;
const Storage = rlequire("dendro", "src/kb/storage/storage.js").Storage;
const uuidv1 = require("uuid/v1");
const superRequest = require("superagent");
const ConditionsAcceptance = rlequire("dendro", "src/models/conditionsAcceptance.js").ConditionsAcceptance;
const Descriptor = rlequire("dendro", "src/models/meta/descriptor.js").Descriptor;

const dbMySQL = rlequire("dendro", "src/mysql_models");

const B2ShareClient = require("@feup-infolab/node-b2share-v2");

const util = require("util");
const async = require("async");
const _ = require("underscore");

function Deposit (object)
{
    const self = this;
    self.addURIAndRDFType(object, "deposit", Deposit);
    Deposit.baseConstructor.call(this, object);

    self.copyOrInitDescriptors(object);

    let now = moment().format();
    self.dcterms.date = now;
    self.ddr.lastVerifiedDate = now;
    self.ddr.isAvailable = true;

    return self;
}

/**
 * Verifies input
 * @param data
 * @param callback
 */
Deposit.createDeposit = function (data, callback)
{
    let object = data.registryData;
    let content = data.requestedResource;
    let newDeposit = new Deposit(object);
    const uuid = uuidv1();
    const DOI = "10.23673/" + uuid;
    const user = data.user;
    const generateDoi = function (callback)
    {
        const auth = "Basic " + new Buffer("DEV.INFOLAB" + ":" + "8yD5qChSbUSK").toString("base64");

        superRequest
            .post("https://api.test.datacite.org/dois")
            .set("accept", "application/vnd.api+json")
            .set("Referer", "https://doi.test.datacite.org/clients/dev.infolab/dois/new")
            .set("Origin", "https://doi.test.datacite.org")
            .set("Authorization", auth)
            .set("Content-Type", "application/vnd.api+json")
            .send({
                data: {
                    attributes:
                    {
                        doi: DOI,
                        confirmDoi: null,
                        url: newDeposit.ddr.absoluteUri,
                        types: {
                            resourceTypeGeneral: "Dataset"
                        },
                        creators:
                          [{
                              name: user.foaf.firstName + " " + user.foaf.surname,
                              givenName: user.foaf.firstName,
                              familyName: user.foaf.surname,
                              nameType: "Personal",
                              affiliation: user.foaf.affiliation,
                              nameIdentifiers:
                                [{
                                    nameIdentifier: user.ddr.absoluteUri,
                                    nameIdentifierScheme: null,
                                    schemeUri: null
                                }]
                          }],
                        titles:
                          [{
                              title: newDeposit.dcterms.title,
                              titleType: null,
                              lang: newDeposit.dcterms.language
                          }],
                        publisher: null,
                        publicationYear: new Date().getFullYear(),
                        descriptions:
                          [{
                              description: newDeposit.dcterms.description,
                              descriptionType: "Abstract",
                              lang: newDeposit.dcterms.language
                          }],
                        xml: null,
                        source: "fabricaForm",
                        state: "draft",
                        reason: null,
                        event: null,
                        mode: "new"
                    },
                    relationships:
                    {
                        client:
                          {
                              data:
                                {
                                    type: "clients",
                                    id: "dev.infolab"
                                }
                          }
                    },
                    type: "dois"
                }
            })
            .then(function (result)
            {
                callback(null, result);
            })
            .catch(function (error)
            {
                callback(1, error);
            });
    };
    const generateCitation = function (callback)
    {
        const auth = "Basic " + new Buffer("DEV.INFOLAB" + ":" + "8yD5qChSbUSK").toString("base64");

        var headers = {
            accept: "application/x-bibtex",
            Referer: Config.deposits.pids.datacite + "%2F" + uuid,
            Origin: "https://doi.test.datacite.org",
            Authorization: auth
        };

        var options = {
            url: Config.deposits.pids.datacite + "/" + uuid,
            headers: headers
        };

        function result (error, response, body)
        {
            if (!error && response.statusCode === 200)
            {
                callback(null, body);
            }
            else
            {
                callback(error, response);
            }
        }

        request(options, result);
    };

    const requestedResourceURI = object.ddr.exportedFromFolder;

    const isResource = function (url)
    {
        const regexp = /\/r\/(folder|file)\/.*/;
        return regexp.test(url);
    };

    if (isNull(object.ddr.lastVerifiedDate))
    {
        object.ddr.lastVerifiedDate = moment().format();
    }
    object.ddr.isAvailable = true;

    if (isResource(requestedResourceURI))
    {
        console.log("creating registry from deposit\n" + util.inspect(object));

        let storageConf = new StorageConfig({
            ddr: {
                hasStorageType: "local"
            }
        });

        storageConf.save(function (err, savedConfiguration)
        {
            if (isNull(err))
            {
                newDeposit.ddr.hasStorageConfig = savedConfiguration.uri;
                // save deposited contents to dendro
                Deposit.saveContents({newDeposit: newDeposit, content: content, user: user}, function (err, msg)
                {
                    async.waterfall([ function (callback)
                    {
                        generateDoi(function (err, result)
                        {
                            callback(err, result);
                        });
                    },
                    function (result, callback)
                    {
                        generateCitation(function (err, citation)
                        {
                            callback(err, citation);
                        });
                    },
                    function (citation, callback)
                    {
                        newDeposit.ddr.DOI = DOI;
                        newDeposit.ddr.proposedCitation = citation;
                        newDeposit.dcterms.identifier = DOI;

                        newDeposit.save(function (err, newDeposit)
                        {
                            if (!err)
                            {
                                callback(err, newDeposit);
                            }
                            else
                            {
                                callback(err, "not good");
                            }
                        });
                    }], function (err, newDeposit)
                    {
                        if (isNull(err))
                        {
                            callback(null, newDeposit);
                        }
                        else
                        {
                            callback(1, true);
                        }
                    });
                });
            }
        });
    }
    else
    {
        callback(1);
    }
};

Deposit.getEmbargoedDate = function (url, callback)
{
    let query =
      "SELECT DISTINCT ?embargoedDate \n" +
      "FROM [0] \n" +
      "WHERE " +
      "{ \n" +
      "   [1] rdf:type ddr:Registry . \n" +
      "   [1] ddr:embargoedDate ?embargoedDate . \n" +
      "}";

    let variables = [
        {
            type: Elements.types.resourceNoEscape,
            value: db.graphUri
        },
        {
            type: Elements.ontologies.nie.url.type,
            value: url
        }];

    db.connection.executeViaJDBC(query, variables, function (err, regs)
    {
        callback(err, regs);
    });
};
/**
 * Query to check a limited amount of deposits
 * @param params
 * @param callback
 */
Deposit.createQuery = function (params, callback)
{
    let query =
        "SELECT DISTINCT  ?title ?user ?date ?platformsUsed ?privacy ?uri  ?doi ?description  ?embargoedDate \n" +
        "FROM [0] \n" +
        "WHERE " +
        "{ \n" +
        "   ?uri rdf:type ddr:Registry . \n" +
        "   ?uri dcterms:creator ?user . \n" +
        "   ?uri dcterms:title ?title . \n" +
        "   ?uri dcterms:date ?date . \n" +
        "   ?uri dcterms:description ?description . \n" +
        "   ?uri ddr:privacyStatus ?privacy . \n" +
        "   ?uri ddr:exportedToPlatform ?platformsUsed . \n" +
        "   ?uri ddr:DOI ?doi .\n" +
        // ?uri http://purl.org/dc/terms/abstract asasasas
        "   OPTIONAL { ?uri ddr:embargoedDate ?embargoedDate  }. \n";

    let i = 1;

    let variables = [
        {
            type: Elements.types.resourceNoEscape,
            value: db.graphUri
        }];

    if (params.privacy)
    {
        query +=
          "   VALUES ?privacy {";

        for (let j = 0; j < params.privacy.length; j++)
        {
            var object = JSON.parse(params.privacy[j]);

            if (object.value === true)
            {
                query += "[" + i++ + "] ";

                switch (object.name)
                {
                case "Metadata only":
                    variables.push(
                        {
                            type: Elements.ontologies.ddr.privacyStatus.type,
                            value: "metadata_only"
                        });
                    break;
                case "Embargoed":
                    variables.push(
                        {
                            type: Elements.ontologies.ddr.privacyStatus.type,
                            value: "embargoed"
                        });
                    break;
                case "Private":
                    variables.push(
                        {
                            type: Elements.ontologies.ddr.privacyStatus.type,
                            value: "private"
                        });
                    break;
                default:
                    variables.push(
                        {
                            type: Elements.ontologies.ddr.privacyStatus.type,
                            value: "public"
                        });
                }
            }
        }
        query +=
          "} . \n" +
          "   ?uri ddr:privacyStatus ?privacy . \n";
    }

    if (params.platforms)
    {
        query +=
        "   VALUES ?platformsUsed {";

        for (let j = 0; j < params.platforms.length; j++)
        {
            query += "[" + i++ + "] ";
            variables.push({
                type: Elements.types.string,
                value: params.platforms[j]
            });
        }
        query +=
      "} . \n" +
        "   ?uri ddr:exportedToPlatform ?platformsUsed . \n";
    }

    if (params.description)
    {
        query += " FILTER contains(?description, [" + i++ + "]). \n";
        variables.push({
            type: Elements.types.string,
            value: params.description
        });
    }

    if (params.identifier)
    {
        query += " FILTER contains(?doi, [" + i++ + "]). \n";
        variables.push({
            type: Elements.types.string,
            value: params.identifier
        });
    }

    let ending =
      "} \n" +
      "ORDER BY " + params.order + "(?" + params.labelToSort + ") \n" +
      "OFFSET [" + i++ + "] \n" +
      "LIMIT [" + i++ + "]";

    if (params.offset)
    {
        variables.push({
            type: Elements.types.string,
            value: (params.offset * params.limit).toString()
        });
    }
    else
    {
        variables.push({
            type: Elements.types.string,
            value: "0"
        });
    }

    if (params.limit)
    {
        variables.push({
            type: Elements.types.string,
            value: params.limit
        });
    }
    else
    {
        variables.push({
            type: Elements.types.string,
            value: "10"
        });
    }

    if (params.project)
    {
        query += " FILTER contains(?label, [" + i++ + "]). \n";
        variables.push({
            type: Elements.ontologies.dcterms.title.type,
            value: params.project
        });
    }
    if (params.creator)
    {
        query += "  ?uri dcterms:creator [" + i++ + "] \n";
        variables.push({
            type: Elements.ontologies.dcterms.creator.type,
            value: params.creator
        });
    }
    if (params.dateFrom)
    {
        query += "  FILTER (?date > [" + i++ + "]^^xsd:dateTime )\n";
        variables.push({
            type: Elements.types.string,
            value: params.dateFrom
        });
    }
    if (params.dateTo)
    {
        query += "  FILTER ([" + i++ + "]^^xsd:dateTime > ?date )\n";
        variables.push({
            type: Elements.types.string,
            value: params.dateTo
        });
    }

    query += ending;
    db.connection.executeViaJDBC(query, variables, function (err, regs)
    {
        callback(err, regs);
    });
};

/**
 *  Check if deposit still exists in outside repository
 * @param deposit metadata to check
 * @param callback function to call after the operation terminates
 */
Deposit.validatePlatformUri = function (deposit, callback)
{
    const appendPlatformUrl = function ({ddr: {exportedToPlatform: platform, exportedToRepository: url}})
    {
        const https = "https://";
        switch (platform)
        {
        case "EUDAT B2Share":
            return https + url + "/api/records/";
        case "CKAN":
            return https + url + "/dataset/";
        case "Figshare":
            break;
        case "Zenodo":
            break;
        case "EPrints":
            break;
        default:
            return https + url;
        }
    };
    // if it has external repository uri
    if (deposit.ddr.lastVerifiedDate)
    {
        const now = moment();
        const lastChecked = moment(deposit.ddr.lastVerifiedDate);
        // calculate difference
        const difference = now.diff(lastChecked, "hours");

        if (difference >= 24)
        {
            // make call to the uri and see if request is 404 or not
            const uri = appendPlatformUrl(deposit) + deposit.dcterms.identifier;
            request(uri, function (error, response, body)
            {
                if (error || response.statusCode === 404)
                {
                    deposit.ddr.isAvailable = false;
                }
                else if (response.statusCode === 200)
                {
                    // status code is acceptable
                    deposit.ddr.isAvailable = true;
                }
                deposit.ddr.lastVerifiedDate = now.format();
                deposit.save(function (err, result)
                {
                    if (isNull(err))
                    {
                        callback(result);
                    }
                    else
                    {
                        callback(result);
                    }
                });
            });
        }
        else callback(deposit);
    }
    else callback(deposit);
};

/**
 * Creates a deposit
 * @param object with metadata to be saved
 * @param callback when function finishes
 */
Deposit.createAndInsertFromObject = function (object, callback)
{
    const self = Object.create(this.prototype);
    self.constructor(object);
    self.save(function (err, newRegistry)
    {
        if (isNull(err))
        {

        }
        else
        {

        }
    });
};

/**
 * Gets a list of all the repositories used for all the existing deposits
 * @param params
 * @param callback
 */
Deposit.getAllRepositories = function (params, callback)
{
    let query =
      "SELECT ?repository COUNT(?repository) as ?count\n" +
      "FROM [0] \n" +
      "WHERE \n" +
      "{ \n" +
      "   ?uri rdf:type ddr:Registry . \n" +
      "   ?uri dcterms:title ?label . \n" +
      "   ?uri ddr:exportedToRepository ?repository . \n" +
      "   ?uri ddr:DOI ?doi .\n" +
      "   ?uri dcterms:description ?description . \n";
    const ending = "} \n" +
      "GROUP BY ?repository";

    let variables = [
        {
            type: Elements.types.resourceNoEscape,
            value: db.graphUri
        }];

    let i = 1;

    if (params.platforms)
    {
        query +=
          "   VALUES ?privacy {";

        for (let j = 0; j < params.privacy.length; j++)
        {
            var object = JSON.parse(params.privacy[j]);

            if (object.value === true)
            {
                query += "[" + i++ + "] ";

                switch (object.name)
                {
                case "Metadata only":
                    variables.push(
                        {
                            type: Elements.ontologies.ddr.privacyStatus.type,
                            value: "metadata_only"
                        });
                    break;
                case "Embargoed":
                    variables.push(
                        {
                            type: Elements.ontologies.ddr.privacyStatus.type,
                            value: "embargoed"
                        });
                    break;
                case "Private":
                    variables.push(
                        {
                            type: Elements.ontologies.ddr.privacyStatus.type,
                            value: "private"
                        });
                    break;
                default:
                    variables.push(
                        {
                            type: Elements.ontologies.ddr.privacyStatus.type,
                            value: "public"
                        });
                }
            }
        }
        query +=
          "} . \n" +
          "   ?uri ddr:privacyStatus ?privacy . \n";

        query +=
          "   VALUES ?platformsUsed {";

        for (let j = 0; j < params.platforms.length; j++)
        {
            query += "[" + i++ + "] ";
            variables.push({
                type: Elements.types.string,
                value: params.platforms[j]
            });
        }
        query +=
          "} . \n" +
          "   ?uri ddr:exportedToPlatform ?platformsUsed . \n";
    }
    else
    {
        query +=
          "   VALUES ?platformsUsed { \n" +
          "} . \n" +
          "    ?uri ddr:exportedToPlatform ?platformsUsed . \n";
    }

    if (params.project)
    {
        query += " FILTER contains(?label, [" + i++ + "]). \n";
        variables.push({
            type: Elements.ontologies.dcterms.title.type,
            value: params.project
        });
    }
    if (params.creator)
    {
        query += "  ?uri dcterms:creator [" + i++ + "] \n";
        variables.push({
            type: Elements.ontologies.dcterms.creator.type,
            value: params.creator
        });
    }
    if (params.dateFrom)
    {
        query += "  FILTER (?date > [" + i++ + "]^^xsd:dateTime )\n";
        variables.push({
            type: Elements.types.string,
            value: params.dateFrom
        });
    }
    if (params.dateTo)
    {
        query += "  FILTER ([" + i++ + "]^^xsd:dateTime > ?date )\n";
        variables.push({
            type: Elements.types.string,
            value: params.dateTo
        });
    }

    if (params.description)
    {
        query += " FILTER contains(?description, [" + i++ + "]). \n";
        variables.push({
            type: Elements.types.string,
            value: params.description
        });
    }

    if (params.identifier)
    {
        query += " FILTER contains(?doi, [" + i++ + "]). \n";
        variables.push({
            type: Elements.types.string,
            value: params.identifier
        });
    }

    query += ending;

    db.connection.executeViaJDBC(query, variables, function (err, regs)
    {
        callback(err, regs);
    });
};

/**
 * Saves the exported contents to dendro
 * @param params
 * @param callback
 */
Deposit.saveContents = function (params, callback)
{
    let newDeposit = params.newDeposit;
    newDeposit.save(function (err, newDeposit)
    {
        const rootFolder = new Folder({
            nie: {
                title: "deposit",
                isLogicalPartOf: newDeposit.uri
            },
            ddr: {
                humanReadableURI: newDeposit.ddr.humanReadableURI + "/data"
            }
        });
        rootFolder.save(function (err, result)
        {
            if (isNull(err))
            {
                newDeposit.ddr.rootFolder = rootFolder.uri;
                newDeposit.nie.hasLogicalPart = rootFolder.uri;
                newDeposit.save(function (err, result)
                {
                    if (isNull(err))
                    {
                        let content = params.content;
                        // TODO check if file or folder
                        content.copyPaste({includeMetadata: true, destinationFolder: rootFolder, user: params.user}, function (err, msg)
                        {
                            callback(err, newDeposit);
                        });
                        // pass contents here
                    }
                    else
                    {
                        Logger.log("error", "There was an error re-saving the project " + newDeposit.ddr.humanReadableURI + " while creating it: " + JSON.stringify(result));
                        callback(err, result);
                    }
                });
            }
            else
            {
                Logger.log("error", "There was an error saving the root folder of deposit " + newDeposit.ddr.humanReadableURI + ": " + JSON.stringify(result));
                return callback(err, result);
            }
        });
    });
};

Deposit.prototype.findMetadata = function (callback, typeConfigsToRetain)
{
    const self = this;

    const descriptors = self.getPropertiesFromOntologies(
        null,
        typeConfigsToRetain);
    return callback(null,
        {
            descriptors: descriptors,
            title: self.dcterms.title
        }
    );
};

Deposit.prototype.getFirstLevelDirectoryContents = function (callback)
{
    const self = this;
    Project.prototype.getRootFolder.bind(self)(function (err, folder)
    {
        if (isNull(err))
        {
            if (!isNull(folder) && folder instanceof Folder)
            {
                folder.getLogicalParts(function (err, children)
                {
                    if (isNull(err))
                    {
                        return callback(null, children);
                    }
                    return callback(1, "Error fetching children of deposit root folder");
                });
            }
            else
            {
                return callback(1, "unable to retrieve deposit " + self.ddr.handle + " 's root folder. Error :" + err);
            }
        }
        else
        {
            return callback(1, "unable to retrieve project " + self.ddr.handle + " 's root folder's contents. Error :" + err);
        }
    });
};

/**
 * Returns the project associated with the
 * @param callback
 */
Deposit.prototype.getProject = function (callback)
{
    let self = this;

    let projectUri = self.ddr.exportedFromProject;

    Project.findByUri(projectUri, function (err, project)
    {
        callback(err, project);
    });
};

Deposit.getDepositsEmbargoed = function (callback)
{
    let date = new Date();
    let dateNow = date.toISOString();
    let i = 1;
    let query =
      "SELECT DISTINCT * \n" +
      "FROM [0] \n" +
      "WHERE " +
      "{ \n" +
      "   ?uri rdf:type ddr:Registry . \n" +
      "   ?uri ddr:embargoedDate ?embargoedDate . \n" +
      "   ?uri  ddr:privacyStatus [" + i++ + "]. \n" +
      "    FILTER ( xsd:dateTime(?embargoedDate) < xsd:dateTime([" + i++ + "])). \n" +
    "} \n";

    let variables = [
        {
            type: Elements.types.resourceNoEscape,
            value: db.graphUri
        },
        {
            type: Elements.ontologies.ddr.privacyStatus.type,
            value: "embargoed"
        },
        {
            type: Elements.ontologies.dcterms.date.type,
            value: dateNow
        }];

    db.connection.executeViaJDBC(query, variables, function (err, regs)
    {
        callback(err, regs);
    });
};

Deposit.prototype.delete = function (callback, customGraphUri)
{
    const self = this;

    const graphUri = (!isNull(customGraphUri) && typeof customGraphUri === "string") ? customGraphUri : db.graphUri;

    const deleteDepositsTriples = function (callback)
    {
        const deleteQuery =
      "DELETE FROM [0]\n" +
        "{\n" +
      " ?resource ?p ?o \n" +
      "} \n" +
      "WHERE \n" +
      "{ \n" +
      "    ?resource ?p ?o .\n" +
      "    [1] nie:hasLogicalPart* ?resource\n" +
      "} \n";

        db.connection.executeViaJDBC(deleteQuery,
            [
                {
                    type: Elements.types.resourceNoEscape,
                    value: graphUri
                },
                {
                    type: Elements.types.resourceNoEscape,
                    value: self.uri
                }
            ],
            function (err, result)
            {
                callback(err, result);
            }
        );
    };

    const deleteAllStorageConfigs = function (callback)
    {
        self.deleteAllStorageConfigs(callback);
    };

    const deleteProjectFiles = function (callback)
    {
        self.getActiveStorageConnection(function (err, storageConnection)
        {
            if (isNull(err))
            {
                if (!isNull(storageConnection) && storageConnection instanceof Storage)
                {
                    storageConnection.deleteAllInProject(self, function (err, result)
                    {
                        callback(err, result);
                    });
                }
                else
                {
                    callback(1, "Unable to delete files in project " + self.ddr.handle + " because it has an invalid or non-existant connection to the data access adapter.");
                }
            }
            else
            {
                callback(err, storageConnection);
            }
        });
    };

    const clearCacheRecords = function (callback)
    {
        Project.prototype.clearCacheRecords.bind(this)(function (err, result)
        {
            callback(err, result);
        });
    };

    const deleteDepositConditions = function (callback)
    {
        ConditionsAcceptance.getDepositConditions(self.uri, function (err, result)
        {
            if (isNull(err))
            {
                async.mapSeries(result, function (condition, callback)
                {
                    ConditionsAcceptance.findByUri(condition.condition, function (err, conditionResult)
                    {
                        conditionResult.deleteAllMyTriples(function (err, result)
                        {
                            callback(err, result);
                        });
                    });
                }, function (err, result)
                {
                    callback(err, result);
                });
            }
            else
            {
                callback(err, result);
            }
        });
    };

    async.series([
        deleteDepositConditions,
        clearCacheRecords,
        deleteProjectFiles,
        deleteAllStorageConfigs,
        deleteDepositsTriples
    ], function (err, results)
    {
        callback(err, results);
    });
};

Deposit.findByCreator = function (creator, callback)
{
    const query =
      "SELECT * " +
      "FROM [0] " +
      "WHERE " +
      "{ " +
      " ?uri rdf:type ddr:Deposit . " +
      " ?uri dcterms:creator [1] ." +
      " ?uri dcterms:title ?title ." +
      " ?uri dcterms:description ?description . " +
      " ?uri ddr:privacyStatus ?privacyStatus . " +
      "} ";

    db.connection.executeViaJDBC(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.ontologies.dcterms.creator.type,
                value: creator
            }
        ],
        function (err, deposits)
        {
            if (isNull(err))
            {
                if (deposits instanceof Array)
                {
                    const depositsToReturn = [];
                    for (let i = 0; i < deposits.length; i++)
                    {
                        const aDeposit = new Deposit(deposits[i]);

                        aDeposit.creator = creator;
                        depositsToReturn.push(aDeposit);
                    }

                    return callback(null, depositsToReturn);
                }
                // project does not exist, return null
                return callback(null, null);
            }
            // project var will contain an error message instead of a single-element
            // array containing project data.
            return callback(err, [deposits]);
        });
};

Deposit = Class.extend(Deposit, Resource, "ddr:Registry");

module.exports.Deposit = Deposit;
