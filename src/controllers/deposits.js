
// follows the DC Terms ontology :
// @see http://bloody-byte.net/rdf/dc_owl2dl/dc.ttl
// creator is an URI to the author : http://dendro.fe.up.pt/user/<username>

const async = require("async");
const moment = require("moment");
const dateFormat = require("dateformat");
const rlequire = require("rlequire");
const path = require("path");
const _ = require("underscore");
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const User = rlequire("dendro", "src/models/user.js").User;
const nodemailer = require("nodemailer");

const Administrator = rlequire("dendro", "src/models/administrator.js").Administrator;

const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const InformationElement = rlequire("dendro", "src/models/directory_structure/information_element.js").InformationElement;
const Deposit = rlequire("dendro", "src/models/deposit.js").Deposit;
const Descriptor = rlequire("dendro", "src/models/meta/descriptor.js").Descriptor;
const Ontology = rlequire("dendro", "src/models/meta/ontology.js").Ontology;
const Permissions = rlequire("dendro", "src/models/meta/permissions.js").Permissions;
const Elements = rlequire("dendro", "src/models/meta/elements.js").Elements;
const DbConnection = rlequire("dendro", "src/kb/db.js").DbConnection;
const Notification = rlequire("dendro", "src/models/notifications/notification.js").Notification;

const ConditionsAcceptance = rlequire("dendro", "src/models/conditionsAcceptance.js").ConditionsAcceptance;

exports.allowed = function (req, callback)
{
    let params = req.query;
    if (req.user)
    {
        params.self = req.user.uri;
    }
    if (!isNull(params.dateFrom))
    {
        params.dateFrom = dateFormat(params.dateFrom, "isoDateTime");
    }
    if (!isNull(params.dateTo))
    {
        let nextDay = new Date(params.dateTo);
        nextDay.setDate(nextDay.getDate() + 1);
        params.dateTo = dateFormat(nextDay, "isoDateTime");
    }

    let platforms = [];
    for (let platform in params.platforms)
    {
        const p = JSON.parse(params.platforms[platform]);
        if (p.value)
        {
            platforms.push(p.name);
        }
    }
    if (platforms.length !== 0)
    {
        params.platforms = platforms;
    }
    else
    {
        params.platforms = null;
    }

    let repositories = [];
    if (!isNull(params.repositories))
    {
        if (params.repositories instanceof Array)
        {
            for (let repo in params.repositories)
            {
                const p = JSON.parse(params.repositories[repo]);
                if (p.value)
                {
                    repositories.push(p.name);
                }
            }
        }
        else
        {
            const p = JSON.parse(params.repositories);
            if (p.value)
            {
                repositories.push(p.name);
            }
        }
    }
    if (repositories.length !== 0)
    {
        params.repositories = repositories;
    }
    else
    {
        params.repositories = null;
    }

    let labels = params.ordering.split(" ");

    switch (labels[0])
    {
    case "date":
        params.labelToSort = "date";
        break;
    case "username":
        params.labelToSort = "user";
        break;
    default:
        params.labelToSort = "projectTitle";
        break;
    }

    switch (labels[1])
    {
    case "ascending":
        params.order = "ASC";
        break;
    default:
        params.order = "DESC";
        break;
    }

    async.series([
        function (callback)
        {
            if (params.creator)
            {
                User.findByUsername(params.creator, function (err, result)
                {
                    if (isNull(err) && result instanceof User)
                    {
                        params.creator = result.uri;
                    }
                    callback(null, true);
                });
            }
            else
            {
                callback(null, true);
            }
        },
        function (callback)
        {
            Deposit.createQuery(params, callback);
        },
        function (callback)
        {
            if (!isNull(params.new_listing) && params.new_listing === "true")
            {
                Deposit.getAllRepositories(params, callback);
            }
            else
            {
                callback(null);
            }
        }
    ], function (err, results)
    {
        callback(err, results);
    });
};

exports.changeUserAccess = function (req, res)
{
    let user = req.user.uri;
    let requestcondition = req.body.condition;
    let value = req.body.value;
    let forDelete;

    if (req.body.forDelete)
    {
        forDelete = req.body.forDelete;
    }

    ConditionsAcceptance.findByUri(requestcondition.condition, function (err, conditionToChange)
    {
        if (isNull(err) && conditionToChange instanceof ConditionsAcceptance)
        {
            Deposit.findByUri(conditionToChange.ddr.dataset, function (err, deposit)
            {
                if (isNull(err) && deposit instanceof Deposit)
                {
                    if (deposit.dcterms.creator === user || req.session.isAdmin === true)
                    {
                        if (value === true)
                        {
                            ConditionsAcceptance.changeUserAccess(conditionToChange, true, function (err, result)
                            {
                                if (isNull(err))
                                {
                                    const msg = "Access allowed to the deposit " + deposit.uri;
                                    Notification.buildAndSaveFromSystemMessage(msg, conditionToChange.ddr.acceptingUser, deposit.uri, Notification.types.SYSTEM, function (err, info)
                                    {
                                        const msg = "Allowed access of user " + conditionToChange.ddr.acceptingUser + " to the deposit " + deposit.uri;
                                        Notification.buildAndSaveFromSystemMessage(msg, user, deposit.uri, Notification.types.SYSTEM, function (err, info)
                                        {
                                            Logger.log(msg);
                                            res.json(
                                                {
                                                    result: "OK",
                                                    message: msg
                                                }
                                            );
                                        });
                                    });
                                }
                                else
                                {
                                    res.status(500).json(result);
                                }
                            });
                        }
                        else
                        {
                            conditionToChange.deleteAllMyTriples(function (err, result)
                            {
                                if (isNull(err))
                                {
                                    if (forDelete === true)
                                    {
                                        const msg = "Successfully deleted user access " + user;
                                        Logger.log(msg);
                                        res.json(
                                            {
                                                result: "OK",
                                                message: msg
                                            }
                                        );
                                    }
                                    else
                                    {
                                        const msg = "The access conditionToChange for user deposit " + user + " was not successfully accepted";
                                        Logger.log(msg);
                                        res.json(
                                            {
                                                result: "OK",
                                                message: msg
                                            }
                                        );
                                    }
                                }
                                else
                                {
                                    res.status(500).json(result);
                                }
                            });
                        }
                    }
                    else
                    {
                        req.flash("error", "The user does not have permissions to perform this action.");
                        res.redirect("/");
                    }
                }
                else
                {
                    req.flash("error", "Deposit was not found.");
                    res.redirect("/");
                }
            });
        }
        else
        {
            req.flash("error", "Condition " + requestcondition + " not found.");
            res.redirect("/");
        }
    });
};

exports.delete = function (req, res)
{
    let acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    const getDeposit = function (callback)
    {
        Deposit.findByUri(req.params.requestedResourceUri, function (err, deposit)
        {
            if (isNull(err))
            {
                if (!isNull(deposit) && deposit instanceof Deposit)
                {
                    callback(null, deposit);
                }
                else
                {
                    res.render("registry/delete",
                        {
                            title: "Delete a deposit",
                            success_messages: [ "Deposit with URI " + req.params.requestedResourceUri + " does not exist" ]
                        }
                    );
                }
            }
            else
            {
                res.status(500).render("registry/delete",
                    {
                        title: "Delete a deposit",
                        error_messages: [ "Error fetching deposit with uri " + deposit.uri ]
                    }
                );
            }
        });
    };

    if (acceptsJSON && !acceptsHTML)
    {
        res.status(400).json({
            result: "error",
            message: "API Request not valid for this route."
        });
    }
    else
    {
        if (req.originalMethod === "GET")
        {
            getDeposit(function (err, deposit)
            {
                res.render("registry/delete",
                    {
                        title: "Delete a deposit",
                        deposit: deposit
                    }
                );
            });
        }
        else if (req.originalMethod === "POST" || req.originalMethod === "DELETE")
        {
            getDeposit(function (err, deposit)
            {
                if (!err)
                {
                    if (!isNull(deposit) && deposit instanceof Deposit)
                    {
                        deposit.delete(function (err, result)
                        {
                            if (isNull(err))
                            {
                                /*                              const msg = "Deposit " + deposit.uri + " deleted successfully";
                                Notification.buildAndSaveFromSystemMessage(msg, req.user.uri, deposit.uri, Notification.types.SYSTEM, function (err, info)
                                {
                                    res.redirect("/");
                                });*/
                                req.flash("success", [ "Deposit " + deposit.uri + " deleted successfully" ]);
                                res.redirect("/");
                            }
                            else
                            {
                                req.flash("error", [ "Error deleting deposit " + deposit.uri + " : " + JSON.stringify(result) ]);
                                res.status(500).redirect(req.url);
                            }
                        });
                    }
                    else
                    {
                        req.flash("error", "Deposit " + req.params.requestedResourceUri + " does not exist");
                        res.status(404).redirect("/");
                    }
                }
                else
                {
                    req.flash("error", "Error retrieving deposit " + req.params.requestedResourceUri);
                    req.flash("error", "Error details" + deposit);
                    res.status(500).redirect("/");
                }
            });
        }
    }
};

exports.getDepositConditions = function (req, res)
{
    let user = req.user.uri;

    Deposit.findByUri(req.params.requestedResourceUri, function (err, deposit)
    {
        if (isNull(err) && deposit instanceof Deposit)
        {
            if (user === deposit.dcterms.creator || req.session.isAdmin === true)
            {
                async.series([
                    function (callback)
                    {
                        ConditionsAcceptance.getDepositConditionsDependingOnTheValue(req.params.requestedResourceUri, true, function (err, conditions)
                        {
                            if (isNull(err))
                            {
                                return callback(err, conditions);
                            }
                            return callback(1, err);
                        });
                    }, function (callback)
                    {
                        ConditionsAcceptance.getDepositConditionsDependingOnTheValue(req.params.requestedResourceUri, false, function (err, conditions)
                        {
                            if (isNull(err))
                            {
                                return callback(err, conditions);
                            }
                            return callback(1, err);
                        });
                    }
                ],
                function (err, result)
                {
                    if (err)
                    {
                        res.status(500).json(result);
                    }
                    else
                    {
                        res.json({
                            conditionsAccepted: result[0],
                            conditionsAccepting: result[1]
                        });
                    }
                });
            }
            else
            {
                req.flash("error", "Is not the creator of the deposit or system administrator");
                res.redirect("/");
            }
        }
        else
        {
            req.flash("error", "Deposit " + req.params.requestedResourceUri + " not found.");
            res.redirect("/");
        }
    });
};

exports.my = function (req, res)
{
    let viewVars = {
        // title: "My projects"
    };

    Deposit.findByCreator(req.user.uri, function (err, deposits)
    {
        if (isNull(err) && !isNull(deposits))
        {
            let acceptsHTML = req.accepts("html");
            const acceptsJSON = req.accepts("json");

            if (acceptsJSON && !acceptsHTML) // will be null if the client does not accept html
            {
                res.json(
                    {
                        deposits: deposits
                    }
                );
            }
            else
            {
                viewVars = DbConnection.paginate(req,
                    viewVars
                );

                viewVars.deposits = deposits;
                res.render("deposits/my",
                    viewVars
                );
            }
        }
        else
        {
            viewVars.depoists = [];
            viewVars.info_messages = ["You have not created any deposits"];
            res.render("deposits/my",
                viewVars
            );
        }
    });
};

exports.search = function (req, res)
{
    const acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");
    let display;

    const verification = function (err, results)
    {
        if (isNull(err))
        {
            if (display === "json")
            {
                res.json({deposits: results[1], repositories: results[2]});
            }
            else
            {
                res.render("", {deposits: results[1], repositories: results[2]});
            }
        }
    };

    if (acceptsJSON && !acceptsHTML)
    {
        display = "json";
    }
    else if (!acceptsJSON && acceptsHTML)
    {
        display = "render";
    }

    exports.allowed(req, verification);
};
exports.embargoedDate = function (req, res)
{
    Deposit.findByUri(req.body.uri, function (err, deposit)
    {
        if (isNull(err) && deposit instanceof Deposit)
        {
            async.series([
                function (callback)
                {
                    Deposit.getEmbargoedDate(req.body.uri, function (err, embargoedDate)
                    {
                        if (isNull(err))
                        {
                            return callback(err, embargoedDate);
                        }
                        return callback(1, err);
                    });
                }
            ],
            function (err, result)
            {
                if (err)
                {
                    res.status(500).json(result);
                }
                else
                {
                    res.json({
                        embargoedDate: result[0].embargoedDate
                    });
                }
            });
        }
        else
        {
            req.flash("error", "Deposit " + req.params.requestedResourceUri + " not found.");
            res.redirect("/");
        }
    });
};

exports.show = function (req, res)
{
    let resourceURI = req.params.requestedResourceUri;
    const isDepositRoot = req.params.is_project_root;
    const isAdmin = req.session.isAdmin;

    function sendResponse (errorValue, viewVars, requestedResource)
    {
        const sendResponseInRequestedFormat = function (errorValue, callback)
        {
            if (errorValue)
            {
                callback(1, false);
            }
            else
            {
                const accept = req.header("Accept");
                let serializer = null;
                let contentType = null;
                if (accept in Config.metadataSerializers)
                {
                    serializer = Config.metadataSerializers[accept];
                    contentType = Config.metadataContentTypes[accept];

                    requestedResource.findMetadata(function (err, result)
                    {
                        if (isNull(err))
                        {
                            result.is_project_root = true;
                            result.is_admin = isAdmin;
                            res.set("Content-Type", contentType);
                            res.send(serializer(result));
                            callback(null, true);
                        }
                        else
                        {
                            res.status(500).json({
                                error_messages: "Error finding metadata from " + requestedResource.uri + "\n" + result
                            });
                            callback(1, false);
                        }
                    }, [Elements.access_types.locked, Elements.access_types.locked_for_projects, Elements.access_types.private],
                    [Elements.access_types.api_readable]);
                }
                else
                {
                    callback(null, false);
                }
            }
        };
        const _ = require("underscore");

        // client requested JSON, RDF, TXT, etc...
        sendResponseInRequestedFormat(errorValue, function (error, alreadySent)
        {
            if (!isNull(errorValue))
            {
                req.flash("error", errorValue);
                res.redirect("/");
            }
            else
            {
                if (!isNull(error))
                {
                    req.flash("error", "There is no valid serializer available for the requested format " + req.header("Accept") + " " + requestedResource.uri);
                    res.redirect("/");
                }
                else
                {
                    if (!alreadySent)
                    {
                        if (isAdmin)
                        {
                            res.render("registry/show",
                                viewVars
                            );
                        }
                        else
                        {
                            if (viewVars.owner === true)
                            {
                                res.render("registry/show",
                                    viewVars
                                );
                            }
                            else if (viewVars.deposit.ddr.privacyStatus === "private" || viewVars.deposit.ddr.privacyStatus === "embargoed" || (viewVars.deposit.ddr.privacyStatus === "public" && viewVars.deposit.ddr.accessTerms))
                            {
                                if (viewVars.acceptingUser === true)
                                {
                                    if (viewVars.userAccepted === true)
                                    {
                                        res.render("registry/show_readonly",
                                            viewVars
                                        );
                                    }
                                    else
                                    {
                                        res.render("registry/deposit_for_acceptance",
                                            viewVars
                                        );
                                    }
                                }
                                else
                                {
                                    res.redirect(resourceURI + "?request_access"
                                    );
                                }
                            }
                            else
                            {
                                res.render("registry/show_readonly",
                                    viewVars
                                );
                            }
                        }
                    }
                }
            }
        });
    }

    let showingHistory;
    if (!isNull(req.query))
    {
        showingHistory = Boolean(req.query.show_history);
    }

    const fetchVersionsInformation = function (archivedResource, cb)
    {
        archivedResource.getDetailedInformation(function (err, result)
        {
            cb(err, result);
        });
    };

    const viewVars = {
        showing_history: showingHistory,
        Descriptor: Descriptor
    };

    if (isDepositRoot)
    {
        const appendPlatformUrl = function ({ ddr: { exportedToPlatform: platform, exportedToRepository: url } })
        {
            const https = "https://";
            switch (platform)
            {
            case "EUDAT B2Share":
                return https + url + "/records/";
                break;
            case "CKAN":
                return https + url + "/dataset/";
                break;
            case "Figshare":
                break;
            case "Zenodo":
                break;
            case "EPrints":
                break;
            default:
                return "";
            }
        };

        Deposit.findByUri(resourceURI, function (err, deposit)
        {
            if (isNull(err))
            {
                if (deposit.ddr.privacyStatus === "public" && isNull(deposit.ddr.accessTerms) && !req.user)
                {
                    viewVars.is_project_root = true;
                    viewVars.is_admin = isAdmin;
                    viewVars.title = "Deposit information";

                    Deposit.validatePlatformUri(deposit, function (deposit)
                    {
                        viewVars.go_up_options =
                              {
                                  uri: resourceURI,
                                  title: deposit.dcterms.title,
                                  icons: [
                                      "/images/icons/folders.png",
                                      "/images/icons/bullet_user.png"
                                  ]
                              };

                        deposit.dcterms.date = moment(deposit.dcterms.date).format("LLLL");
                        deposit.externalUri = appendPlatformUrl(deposit) + deposit.dcterms.identifier;
                        viewVars.deposit = deposit;
                        viewVars.owner = false;
                        viewVars.userAccepted = true;
                        viewVars.acceptingUser = true;

                        const depositDescriptors = deposit.getDescriptors(
                            [Elements.access_types.private, Elements.access_types.locked], [Elements.access_types.api_readable], [Elements.access_types.locked_for_projects, Elements.access_types.locked]
                        );

                        if (!isNull(depositDescriptors) && depositDescriptors instanceof Array)
                        {
                            viewVars.descriptors = depositDescriptors;

                            sendResponse(null, viewVars, deposit);
                        }
                    });
                }
                else if (req.user)
                {
                    viewVars.is_project_root = true;
                    viewVars.is_admin = isAdmin;
                    viewVars.title = "Deposit information";

                    Deposit.validatePlatformUri(deposit, function (deposit)
                    {
                        viewVars.go_up_options =
                              {
                                  uri: resourceURI,
                                  title: deposit.dcterms.title,
                                  icons: [
                                      "/images/icons/folders.png",
                                      "/images/icons/bullet_user.png"
                                  ]
                              };

                        async.series([
                            function (callback)
                            {
                                deposit.dcterms.date = moment(deposit.dcterms.date).format("LLLL");
                                deposit.externalUri = appendPlatformUrl(deposit) + deposit.dcterms.identifier;
                                viewVars.deposit = deposit;
                                if (req.user.uri === deposit.dcterms.creator)
                                {
                                    viewVars.owner = true;
                                }
                                else
                                {
                                    viewVars.owner = false;
                                }
                                callback(null);
                            },
                            function (callback)
                            {
                                ConditionsAcceptance.getUserConditionOnTheDeposit(req.user.uri, resourceURI, function (err, result)
                                {
                                    if (isNull(err))
                                    {
                                        if (result.length > 0)
                                        {
                                            if (result[0].userAccepted === "true")
                                            {
                                                viewVars.userAccepted = true;
                                                viewVars.acceptingUser = true;
                                            }
                                            else
                                            {
                                                viewVars.userAccepted = false;
                                                viewVars.acceptingUser = true;
                                            }
                                        }
                                        else
                                        {
                                            if (viewVars.deposit.ddr.accessTerms || viewVars.deposit.ddr.privacyStatus !== "public")
                                            {
                                                viewVars.userAccepted = false;
                                                viewVars.acceptingUser = false;
                                            }
                                            else
                                            {
                                                viewVars.userAccepted = true;
                                                viewVars.acceptingUser = true;
                                            }
                                        }
                                    }
                                    callback(err, result);
                                });
                            }
                        ], function (err, result)
                        {
                            if (isNull(err))
                            {
                                const depositDescriptors = deposit.getDescriptors(
                                    [Elements.access_types.private, Elements.access_types.locked], [Elements.access_types.api_readable], [Elements.access_types.locked_for_projects, Elements.access_types.locked]
                                );

                                if (!isNull(depositDescriptors) && depositDescriptors instanceof Array)
                                {
                                    viewVars.descriptors = depositDescriptors;

                                    sendResponse(null, viewVars, deposit);
                                }
                            }
                            else
                            {
                                Logger.log("error", "Unable to retrieve deposit information");
                                Logger.log("error", JSON.stringify(result));
                                sendResponse("error", err, result);
                            }
                        });
                    });
                }
                else
                {
                    let error = "Error detected. You are not authorized to perform this operation. You must be signed into Dendro.";
                    Logger.log("error", error);
                    sendResponse(error, null, null);
                }
            }
        });
    }
    else
    {
        InformationElement.findByUri(resourceURI, function (err, resourceBeingAccessed)
        {
            if (isNull(err) && !isNull(resourceBeingAccessed) && resourceBeingAccessed instanceof InformationElement)
            {
                const getBreadCrumbs = function (callback)
                {
                    const getParentDeposit = function (callback)
                    {
                        resourceBeingAccessed.getOwnerDeposit(function (err, deposit)
                        {
                            return callback(err, deposit);
                        });
                    };
                    const getParentFolders = function (callback)
                    {
                        resourceBeingAccessed.getAllParentsUntilProject(function (err, parents)
                        {
                            return callback(err, parents);
                        });
                    };

                    async.series(
                        [
                            getParentFolders,
                            getParentDeposit
                        ],
                        function (err, results)
                        {
                            let goUpOptions;
                            if (isNull(err))
                            {
                                const parents = results[0];
                                const ownerDeposit = results[1];
                                const immediateParent = parents[parents.length - 1];

                                const breadcrumbs = [];

                                if (!isNull(immediateParent))
                                {
                                    if (immediateParent.uri === ownerDeposit.ddr.rootFolder)
                                    {
                                        goUpOptions = {
                                            uri: ownerDeposit.uri,
                                            title: ownerDeposit.dcterms.title,
                                            icons: [
                                                "/images/icons/box_closed.png",
                                                "/images/icons/bullet_up.png"
                                            ]
                                        };
                                    }
                                    else
                                    {
                                        goUpOptions = {
                                            uri: immediateParent.uri,
                                            title: immediateParent.nie.title,
                                            icons: [
                                                "/images/icons/folder.png",
                                                "/images/icons/bullet_up.png"
                                            ]
                                        };
                                    }
                                }
                                else
                                {
                                    goUpOptions = {
                                        uri: ownerDeposit.uri,
                                        title: ownerDeposit.dcterms.title,
                                        icons: [
                                            "/images/icons/box_closed.png",
                                            "/images/icons/bullet_up.png"
                                        ]
                                    };
                                }

                                for (let i = 0; i < parents.length; i++)
                                {
                                    breadcrumbs.push(
                                        {
                                            uri: parents[i].uri,
                                            type: parents[i].rdf.type,
                                            title: parents[i].nie.title,
                                            icons: [
                                                "/images/icons/folder.png"
                                            ]
                                        }
                                    );
                                }

                                breadcrumbs.push(
                                    {
                                        uri: resourceBeingAccessed.uri,
                                        type: resourceBeingAccessed.rdf.type,
                                        title: resourceBeingAccessed.nie.title,
                                        icons: [
                                            resourceBeingAccessed.uri + "?thumbnail&size=small"
                                        ]
                                    }
                                );

                                return callback(null,
                                    {
                                        breadcrumbs: breadcrumbs,
                                        go_up_options: goUpOptions
                                    }
                                );
                            }
                            return callback(err, results);
                        });
                };

                const getResourceMetadata = function (breadcrumbs, callback)
                {
                    viewVars.is_project_root = false;
                    viewVars.is_admin = isAdmin;
                    viewVars.breadcrumbs = breadcrumbs.breadcrumbs;
                    viewVars.go_up_options = breadcrumbs.go_up_options;

                    resourceBeingAccessed.getOwnerDeposit(function (err, deposit)
                    {
                        if (isNull(err) && !isNull(deposit))
                        {
                            viewVars.title = deposit.dcterms.title;
                            viewVars.subtitle = "(Deposit handle : " + deposit.ddr.handle + ")";

                            if (showingHistory)
                            {
                                resourceBeingAccessed.getArchivedVersions(null, null, function (err, archivedResources)
                                {
                                    if (isNull(err))
                                    {
                                        async.mapSeries(archivedResources, fetchVersionsInformation, function (err, fullVersions)
                                        {
                                            if (isNull(err))
                                            {
                                                viewVars.versions = fullVersions;
                                                sendResponse(null, viewVars, resourceBeingAccessed);
                                                return callback(null);
                                            }
                                            return callback(err, "Unable to fetch descriptors. Reported Error: " + fullVersions);
                                        });
                                    }
                                    else
                                    {
                                        return callback(err, "Unable to fetch project revisions. Reported Error: " + archivedResources);
                                    }
                                });
                            }
                            else
                            {
                                const descriptors = resourceBeingAccessed.getPropertiesFromOntologies(
                                    Ontology.getPublicOntologiesUris()
                                );

                                viewVars.descriptors = descriptors;
                                sendResponse(null, viewVars, resourceBeingAccessed);
                            }
                        }
                        else
                        {
                            return callback(err, "Unable to fetch contents of folder " + JSON.stringify(resourceBeingAccessed));
                        }
                    });
                };

                async.waterfall([
                    getBreadCrumbs,
                    getResourceMetadata
                ], function (err, results)
                {
                    if (!isNull(err))
                    {
                        const flash = require("connect-flash");
                        flash("error", results);
                        res.redirect("back");
                    }
                });
            }
            else
            {
                const flash = require("connect-flash");
                flash("error", "Resource with uri " + resourceURI + " does not exist.");
                if (!res._headerSent)
                {
                    res.redirect("back");
                }
            }
        });
    }
};

exports.requestAccess = function (req, res)
{
    let acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    if (req.originalMethod === "GET")
    {
        if (acceptsJSON && !acceptsHTML)
        {
            res.status(400).json({
                result: "error",
                message: "API Request not valid for this route."
            });
        }
        else
        {
            Deposit.findByUri(req.params.requestedResourceUri, function (err, deposit)
            {
                if (isNull(err) && deposit instanceof Deposit)
                {
                    res.render("registry/request_access",
                        {
                            deposit: deposit
                        });
                }
                else
                {
                    req.flash("error", "Deposit " + req.params.requestedResourceUri + " not found.");
                    res.redirect("/");
                }
            });
        }
    }
    else if (req.originalMethod === "POST")
    {
        const flash = require("connect-flash");
        if (req.body.access_deposits)
        {
            Logger.log(req.user);
            Deposit.findByUri(req.params.requestedResourceUri, function (err, deposit)
            {
                if (isNull(err) && deposit instanceof Deposit)
                {
                    let registryData = {
                        ddr: {
                            acceptingUser: req.user.uri,
                            dataset: deposit.uri,
                            requestDate: new Date(),
                            userAccepted: false
                        }
                    };
                    let privacy = deposit.ddr.privacyStatus;

                    ConditionsAcceptance.create(registryData, privacy, function (err, conditions)
                    {
                        if (isNull(err))
                        {
                            const msg = "Has a new request for access to the deposit" + deposit.uri;
                            Notification.buildAndSaveFromSystemMessage(msg, deposit.dcterms.creator, deposit.uri, Notification.types.SYSTEM, function (err, info)
                            {
                                res.redirect(deposit.uri);
                            });
                        }
                        else
                        {
                            flash("error", "Error retrieving deposit. Please try again later");
                            res.redirect("/");
                        }
                    });
                }
                else
                {
                    flash("error", "Error retrieving deposit. Please try again later");
                    res.redirect("/");
                }
            });
        }
        else
        {
            res.redirect("/");
        }
    }
};
