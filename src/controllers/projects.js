const path = require("path");
const _ = require("underscore");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const Ontology = require(Pathfinder.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
const Project = require(Pathfinder.absPathInSrcFolder("/models/project.js")).Project;
const Folder = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
const File = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/file.js")).File;
const InformationElement = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
const Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const Permissions = require(Pathfinder.absPathInSrcFolder("/models/meta/permissions.js")).Permissions;
const User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;
const DbConnection = require(Pathfinder.absPathInSrcFolder("/kb/db.js")).DbConnection;
const Uploader = require(Pathfinder.absPathInSrcFolder("/utils/uploader.js")).Uploader;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;

const nodemailer = require("nodemailer");
const db = Config.getDBByID();
const flash = require("connect-flash");
const async = require("async");

exports.all = function (req, res)
{
    let viewVars = {
        title: "All projects"
    };

    viewVars = DbConnection.paginate(req,
        viewVars
    );

    const validateRequestType = function (cb)
    {
        let acceptsHTML = req.accepts("html");
        const acceptsJSON = req.accepts("json");

        if (acceptsJSON && !acceptsHTML)
        {
            res.status(400).json({
                result: "error",
                message: "API Request not valid for this route."
            });
        }
        else
        {
            cb(null, null);
        }
    };

    const getProjectCount = function (cb)
    {
        Project.getCount(function (err, count)
        {
            cb(err, count);
        });
    };

    const getAllProjects = function (cb)
    {
        if (req.session.isAdmin)
        {
            Project.all(function (err, projects)
            {
                cb(err, projects);
            }, req);
        }
        else if (!isNull(req.user) && !isNull(req.user.uri))
        {
            Project.allNonPrivateUnlessTheyBelongToMe(req.user, function (err, projects)
            {
                cb(err, projects);
            }, req);
        }
        else
        {
            Project.allNonPrivate(req.user, function (err, projects)
            {
                cb(err, projects);
            }, req);
        }
    };

    async.series(
        [
            validateRequestType, getProjectCount, getAllProjects
        ], function (err, results)
        {
            if (isNull(err))
            {
                viewVars.count = results[1];
                viewVars.projects = results[2];

                res.render("projects/all",
                    viewVars
                );
            }
            else
            {
                viewVars.projects = [];
                viewVars.error_messages = [results];
                res.render("projects/all",
                    viewVars
                );
            }
        }
    );
};

exports.my = function (req, res)
{
    let viewVars = {
    // title: "My projects"
    };

    Project.findByCreatorOrContributor(req.user.uri, function (err, projects)
    {
        if (isNull(err) && !isNull(projects))
        {
            let acceptsHTML = req.accepts("html");
            const acceptsJSON = req.accepts("json");

            if (acceptsJSON && !acceptsHTML) // will be null if the client does not accept html
            {
                res.json(
                    {
                        projects: projects
                    }
                );
            }
            else
            {
                viewVars = DbConnection.paginate(req,
                    viewVars
                );

                viewVars.projects = projects;
                res.render("projects/my",
                    viewVars
                );
            }
        }
        else
        {
            viewVars.projects = [];
            viewVars.info_messages = ["You have not created any projects"];
            res.render("projects/my",
                viewVars
            );
        }
    });
};
exports.change_log = function (req, res)
{
    const fetchVersionsInformation = function (archivedResource, cb)
    {
        archivedResource.getDetailedInformation(function (err, result)
        {
            cb(err, result);
        });
    };

    InformationElement.findByUri(req.params.requestedResourceUri, function (err, resource)
    {
        if (isNull(err) && resource !== "undefined")
        {
            resource.getOwnerProject(function (err, project)
            {
                if (isNull(err) && !isNull(project))
                {
                    let offset;

                    try
                    {
                        offset = req.params.page * Config.change_log.default_page_length;
                    }
                    catch (e)
                    {
                        offset = 0;
                    }

                    resource.getArchivedVersions(offset, Config.change_log.default_page_length, function (err, archivedResources)
                    {
                        if (isNull(err))
                        {
                            async.mapSeries(archivedResources, fetchVersionsInformation, function (err, fullVersions)
                            {
                                if (isNull(err))
                                {
                                    res.json(fullVersions);
                                }
                                else
                                {
                                    const flash = require("connect-flash");
                                    flash("error", "Unable to fetch descriptors. Reported Error: " + fullVersions);
                                    res.redirect("back");
                                }
                            });
                        }
                        else
                        {
                            const flash = require("connect-flash");
                            flash("error", "Unable to fetch project revisions. Reported Error: " + archivedResources);
                            res.redirect("back");
                        }
                    });
                }
                else
                {
                    const flash = require("connect-flash");
                    flash("error", "Unable to fetch owner project of folder " + resource.uri);
                    res.redirect("back");
                }
            });
        }
        else
        {
            const flash = require("connect-flash");
            flash("error", "Unable to fetch project");
            if (!res._headerSent)
            {
                res.redirect("back");
            }
        }
    });
};

exports.show = function (req, res)
{
    const userIsLoggedIn = Boolean(req.user);
    let resourceURI = req.params.requestedResourceUri;

    function sendResponse (viewVars, requestedResource)
    {
        const askedForHtml = function (req, res)
        {
            const accept = req.header("Accept");
            let serializer = null;
            let contentType = null;
            if (accept in Config.metadataSerializers)
            {
                serializer = Config.metadataSerializers[accept];
                contentType = Config.metadataContentTypes[accept];

                if (!isNull(req.query.deep))
                {
                    requestedResource.findMetadataRecursive(function (err, result)
                    {
                        if (isNull(err))
                        {
                            result.is_project_root = true;
                            res.set("Content-Type", contentType);
                            res.send(serializer(result));
                        }
                        else
                        {
                            res.status(500).json({
                                error_messages: "Error finding metadata from " + requestedResource.uri + "\n" + result
                            });
                        }
                    }, [Elements.access_types.locked, Elements.access_types.locked_for_projects, Elements.access_types.private]);
                }
                else
                {
                    requestedResource.findMetadata(function (err, result)
                    {
                        if (isNull(err))
                        {
                            result.is_project_root = true;
                            res.set("Content-Type", contentType);
                            res.send(serializer(result));
                        }
                        else
                        {
                            res.status(500).json({
                                error_messages: "Error finding metadata from " + requestedResource.uri + "\n" + result
                            });
                        }
                    }, [Elements.access_types.locked, Elements.access_types.locked_for_projects, Elements.access_types.private]);
                }

                return false;
            }
            return true;
        };

        const _ = require("underscore");

        const isEditor = _.filter(req.permissions_management.reasons_for_authorizing, function (authorization)
        {
            const reason = authorization.role;
            if (req.params.is_project_root)
            {
                return _.isEqual(reason, Permissions.settings.role.in_project.creator) || _.isEqual(reason, Permissions.settings.role.in_project.contributor) || _.isEqual(reason, Permissions.settings.role.in_system.admin);
            }
            return _.isEqual(reason, Permissions.settings.role.in_owner_project.creator) || _.isEqual(reason, Permissions.settings.role.in_owner_project.contributor) || _.isEqual(reason, Permissions.settings.role.in_system.admin);
        });

        if (isEditor.length > 0)
        {
            if (askedForHtml(req, res))
            {
                res.render("projects/show",
                    viewVars
                );
            }
        }
        else
        {
            const isPublicOrMetadataOnlyProject = _.filter(req.permissions_management.reasons_for_authorizing, function (authorization)
            {
                const reason = authorization.role;
                if (req.params.is_project_root)
                {
                    return _.isEqual(reason, Permissions.settings.privacy.of_project.metadata_only) || _.isEqual(reason, Permissions.settings.privacy.of_project.public);
                }
                return _.isEqual(reason, Permissions.settings.privacy.of_owner_project.public) || _.isEqual(reason, Permissions.settings.privacy.of_owner_project.metadata_only);
            });

            const isPublicProject = _.filter(req.permissions_management.reasons_for_authorizing, function (authorization)
            {
                const reason = authorization.role;
                if (req.params.is_project_root)
                {
                    return _.isEqual(reason, Permissions.settings.privacy.of_project.public);
                }
                return _.isEqual(reason, Permissions.settings.privacy.of_owner_project.public);
            });

            const isMetadataOnlyProject = _.filter(req.permissions_management.reasons_for_authorizing, function (authorization)
            {
                const reason = authorization.role;
                if (req.params.is_project_root)
                {
                    return _.isEqual(reason, Permissions.settings.privacy.of_project.metadata_only);
                }
                return _.isEqual(reason, Permissions.settings.privacy.of_owner_project.metadata_only);
            });

            if (isPublicOrMetadataOnlyProject.length > 0)
            {
                if (askedForHtml(req, res))
                {
                    res.render("projects/show_readonly",
                        viewVars
                    );
                }
            }
            else if (isPublicProject.length > 0)
            {
                if (askedForHtml(req, res))
                {
                    res.render("projects/show_readonly",
                        viewVars
                    );
                }
            }
            else if (isMetadataOnlyProject.length > 0)
            {
                if (askedForHtml(req, res))
                {
                    res.render("projects/show_metadata",
                        viewVars
                    );
                }
            }
            else
            {
                if (askedForHtml(req, res))
                {
                    req.flash("error", "There was an role calculation error accessing resource at " + requestedResource.uri);
                    res.redirect("/projects/my");
                }
            }
        }
    }

    let showing_history = Boolean(req.query.show_history);

    const fetchVersionsInformation = function (archivedResource, cb)
    {
        archivedResource.getDetailedInformation(function (err, result)
        {
            cb(err, result);
        });
    };

    const viewVars = {
        showing_history: showing_history,
        Descriptor: Descriptor
    };

    let go_up_options;

    if (req.params.is_project_root)
    {
        viewVars.read_only = true;
        viewVars.is_project_root = true;
        Project.findByUri(resourceURI, function (err, project)
        {
            if (isNull(err) && !isNull(project))
            {
                viewVars.project = project;
                viewVars.title = project.dcterms.title;
                viewVars.subtitle = "(Project handle : " + project.ddr.handle + ")";
                viewVars.breadcrumbs = [];

                if (userIsLoggedIn)
                {
                    go_up_options =
          {
              uri: "/projects/my",
              title: "My Projects",
              icons: [
                  "/images/icons/folders.png",
                  "/images/icons/bullet_user.png"
              ]
          };
                }
                else
                {
                    go_up_options =
          {
              uri: "/projects",
              title: "Public Projects",
              icons: [
                  "/images/icons/folders.png",
                  "/images/icons/bullet_world.png"
              ]
          };
                }

                viewVars.breadcrumbs.push(go_up_options);
                viewVars.breadcrumbs.push(
                    {
                        uri: "/project/" + project.ddr.handle,
                        title: project.dcterms.title,
                        icons: [
                            "/images/icons/box_closed.png"
                        ]
                    }
                );

                viewVars.go_up_options = go_up_options;

                if (showing_history)
                {
                    project.getArchivedVersions(null, null, function (err, archivedResources)
                    {
                        if (isNull(err))
                        {
                            async.mapSeries(archivedResources, fetchVersionsInformation, function (err, archivedResourcesWithFullAuthorInformation)
                            {
                                if (isNull(err))
                                {
                                    viewVars.versions = archivedResourcesWithFullAuthorInformation;
                                    sendResponse(viewVars, project);
                                }
                                else
                                {
                                    const flash = require("connect-flash");
                                    flash("error", "Unable to fetch information of the change authors. Reported Error: " + archivedResourcesWithFullAuthorInformation);
                                    res.redirect("back");
                                }
                            });
                        }
                        else
                        {
                            const flash = require("connect-flash");
                            flash("error", "Unable to fetch project revisions. Reported Error: " + archivedResources);
                            res.redirect("back");
                        }
                    });
                }
                else
                {
                    const projectDescriptors = project.getDescriptors(
                        [Elements.access_types.private, Elements.access_types.locked], [Elements.access_types.api_readable], [Elements.access_types.locked_for_projects, Elements.access_types.locked]
                    );

                    if (!isNull(projectDescriptors) && projectDescriptors instanceof Array)
                    {
                        viewVars.descriptors = projectDescriptors;
                        sendResponse(viewVars, project);
                    }
                    else
                    {
                        const flash = require("connect-flash");
                        flash("error", "Unable to fetch descriptors.");
                        res.redirect("back");
                    }
                }
            }
            else
            {
                const flash = require("connect-flash");
                flash("error", "Unable to retrieve the project : " + resourceURI + " . " + project);
                res.render("index",
                    {
                        error_messages: ["Project " + resourceURI + " not found."]
                    }
                );
            }
        });
    }
    else
    {
        viewVars.is_project_root = false;

        InformationElement.findByUri(resourceURI, function (err, resourceBeingAccessed)
        {
            if (isNull(err) && !isNull(resourceBeingAccessed) && resourceBeingAccessed instanceof InformationElement)
            {
                const getBreadCrumbs = function (callback)
                {
                    const getParentProject = function (callback)
                    {
                        resourceBeingAccessed.getOwnerProject(function (err, project)
                        {
                            return callback(err, project);
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
                            getParentProject
                        ],
                        function (err, results)
                        {
                            if (isNull(err))
                            {
                                const parents = results[0];
                                const ownerProject = results[1];
                                const immediateParent = parents[parents.length - 1];

                                const breadcrumbs = [];

                                if (userIsLoggedIn)
                                {
                                    breadcrumbs.push(
                                        {
                                            uri: "/projects/my",
                                            title: "My Projects",
                                            icons: [
                                                "/images/icons/folders.png",
                                                "/images/icons/bullet_user.png"
                                            ]
                                        }
                                    );
                                }
                                else
                                {
                                    breadcrumbs.push(
                                        {
                                            uri: "/projects",
                                            title: "All Projects",
                                            icons: [
                                                "/images/icons/folders.png",
                                                "/images/icons/bullet_world.png"
                                            ]
                                        }
                                    );
                                }

                                if (!isNull(immediateParent))
                                {
                                    if (immediateParent.uri === ownerProject.ddr.rootFolder)
                                    {
                                        go_up_options = {
                                            uri: ownerProject.uri,
                                            title: ownerProject.dcterms.title,
                                            icons: [
                                                "/images/icons/box_closed.png",
                                                "/images/icons/bullet_up.png"
                                            ]
                                        };
                                    }
                                    else
                                    {
                                        go_up_options = {
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
                                    go_up_options = {
                                        uri: ownerProject.uri,
                                        title: ownerProject.dcterms.title,
                                        icons: [
                                            "/images/icons/box_closed.png",
                                            "/images/icons/bullet_up.png"
                                        ]
                                    };
                                }

                                breadcrumbs.push({
                                    uri: ownerProject.uri,
                                    title: ownerProject.dcterms.title,
                                    icons: [
                                        "/images/icons/box_closed.png",
                                        "/images/icons/bullet_up.png"
                                    ]
                                });

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
                                        go_up_options: go_up_options
                                    }
                                );
                            }
                            return callback(err, results);
                        });
                };

                const getResourceMetadata = function (breadcrumbs, callback)
                {
                    viewVars.breadcrumbs = breadcrumbs.breadcrumbs;
                    viewVars.go_up_options = breadcrumbs.go_up_options;

                    resourceBeingAccessed.getOwnerProject(function (err, project)
                    {
                        if (isNull(err) && !isNull(project))
                        {
                            viewVars.project = project;
                            viewVars.title = project.dcterms.title;
                            viewVars.subtitle = "(Project handle : " + project.ddr.handle + ")";

                            if (showing_history)
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
                                                sendResponse(viewVars, resourceBeingAccessed);
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
                                sendResponse(viewVars, resourceBeingAccessed);
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

exports.new = function (req, res)
{
    let acceptsHTML = req.accepts("html");
    let acceptsJSON = req.accepts("json");

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
            res.render("projects/new",
                {
                    title: "Create a new project"
                }
            );
        }
    }
    else if (req.originalMethod === "POST")
    {
        acceptsHTML = req.accepts("html");
        acceptsJSON = req.accepts("json");

        if (isNull(req.body.handle) || req.body.handle === "")
        {
            if (acceptsJSON && !acceptsHTML)
            {
                res.status(400).json({
                    result: "error",
                    message: "The project's handle cannot be null or an empty value."
                });
            }
            else
            {
                res.render("projects/new",
                    {
                        error_messages: ["The project's handle cannot be null or an empty value."]
                    }
                );
            }
        }
        else if (!isNull(req.body.handle) && !req.body.handle.match(/^[0-9a-z]+$/))
        {
            if (acceptsJSON && !acceptsHTML)
            {
                res.status(400).json({
                    result: "error",
                    message: "Project handle can not include spaces or special characters. It should only include non-capital letters (a to z) and numbers (0 to 9). Valid : project01. Invalid: project 01, project*01, pro@ject, proj%91 "
                });
            }
            else
            {
                res.render("projects/new",
                    {
                        error_messages: ["Project handle can not include spaces or special characters. It should only include non-capital letters (a to z) and numbers (0 to 9). Valid : project01. Invalid: project 01, project*01, pro@ject, proj%91 "]
                    }
                );
            }
        }
        else if (!req.body.title || req.body.title === "")
        {
            if (acceptsJSON && !acceptsHTML)
            {
                res.status(400).json({
                    result: "error",
                    message: "Please insert a title for your project."
                });
            }
            else
            {
                res.render("projects/new",
                    {
                        error_messages: ["Please insert a title for your project."]
                    }
                );
            }
        }
        else if (!req.body.description || req.body.description === "")
        {
            if (acceptsJSON && !acceptsHTML)
            {
                res.status(400).json({
                    result: "error",
                    message: "Please insert a description for your project."
                });
            }
            else
            {
                res.render("projects/new",
                    {
                        error_messages: ["Please insert a description for your project."]
                    }
                );
            }
        }
        else if (!req.body.privacy || req.body.privacy === "")
        {
            if (acceptsJSON && !acceptsHTML)
            {
                res.status(400).json({
                    result: "error",
                    message: "Please specify the privacy type for your project."
                });
            }
            else
            {
                res.render("projects/new",
                    {
                        error_messages: ["Please specify the privacy type for your project."]
                    }
                );
            }
        }
        else
        {
            Project.findByHandle(req.body.handle, function (err, project)
            {
                if (isNull(err))
                {
                    if ((!isNull(project)) && project instanceof Project)
                    {
                        if (acceptsJSON && !acceptsHTML)
                        {
                            res.status(400).json({
                                result: "error",
                                message: "A project with handle " + req.body.handle + " already exists. Please choose another one."
                            });
                        }
                        else
                        {
                            res.render("projects/new",
                                {
                                    // title : "Register on Dendro",
                                    error_messages: ["A project with handle " + req.body.handle + " already exists. Please choose another one."]
                                }
                            );
                        }
                    }
                    else
                    {
                        // creator will be the currently logged in user

                        const projectData = {
                            dcterms: {
                                creator: req.user.uri,
                                title: req.body.title,
                                description: req.body.description,
                                publisher: req.body.publisher,
                                language: req.body.language,
                                coverage: req.body.coverage
                            },
                            ddr: {
                                handle: req.body.handle,
                                privacyStatus: req.body.privacy
                            },
                            schema: {
                                provider: req.body.contact_name,
                                telephone: req.body.contact_phone,
                                address: req.body.contact_address,
                                email: req.body.contact_email,
                                license: req.body.license
                            }
                        };

                        Project.createAndInsertFromObject(projectData, function (err, result)
                        {
                            if (isNull(err))
                            {
                                req.flash("success", "New project " + projectData.dcterms.title + " with handle " + projectData.ddr.handle + " created successfully");
                                res.redirect("/projects/my");
                            }
                            else
                            {
                                req.flash("error", "Error creating project " + projectData.dcterms.title + " with handle " + projectData.ddr.handle + "!");
                                throw err;
                            }
                        });
                    }
                }
                else
                {
                    res.render("projects/new",
                        {
                            error_messages: [project]
                        }
                    );
                }
            });
        }
    }
};

exports.administer = function (req, res)
{
    const viewVars = {
        title: "Administration Area"
    };

    const sendResponse = function (viewPath, viewVars, jsonResponse, statusCode)
    {
        const acceptsHTML = req.accepts("html");
        const acceptsJSON = req.accepts("json");

        if (acceptsJSON && !acceptsHTML)
        {
            if (isNull(statusCode) || statusCode === 200)
            {
                jsonResponse.result = "ok";
                res.json(jsonResponse);
            }
            else
            {
                jsonResponse.result = "error";
                res.status(statusCode).json(jsonResponse);
            }
        }
        else
        {
            if (isNull(statusCode) || statusCode === 200)
            {
                res.render(viewPath, viewVars);
            }
            else
            {
                res.status(statusCode).render(viewPath, viewVars);
            }
        }
    };

    Project.findByUri(req.params.requestedResourceUri, function (err, project)
    {
        if (isNull(err))
        {
            if (!isNull(project))
            {
                viewVars.project = project;

                if (isNull(project.ddr.privacyStatus))
                {
                    project.ddr.privacyStatus = "private";
                }

                viewVars.privacy = project.ddr.privacyStatus;

                if (req.originalMethod === "POST")
                {
                    let updateProjectMetadata = function (callback)
                    {
                        if (!isNull(req.body.title) && req.body.title !== "")
                        {
                            project.dcterms.title = req.body.title;
                        }
                        if (!isNull(req.body.description) && req.body.description !== "")
                        {
                            project.dcterms.description = req.body.description;
                        }
                        if (!isNull(req.body.publisher) && req.body.publisher !== "")
                        {
                            project.dcterms.publisher = req.body.publisher;
                        }
                        if (!isNull(req.body.contact_name) && req.body.contact_name !== "")
                        {
                            project.schema.provider = req.body.contact_name;
                        }
                        if (!isNull(req.body.contact_phone) && req.body.contact_phone !== "")
                        {
                            project.schema.telephone = req.body.contact_phone;
                        }
                        if (!isNull(req.body.contact_address) && req.body.contact_address !== "")
                        {
                            project.schema.address = req.body.contact_address;
                        }
                        if (!isNull(req.body.contact_email) && req.body.contact_email !== "")
                        {
                            project.schema.email = req.body.contact_email;
                        }
                        if (!isNull(req.body.license) && req.body.license !== "")
                        {
                            project.schema.license = req.body.license;
                        }
                        if (!isNull(req.body.language) && req.body.language !== "")
                        {
                            project.dcterms.language = req.body.language;
                        }

                        if (!isNull(req.body.privacy) && req.body.privacy !== "")
                        {
                            viewVars.privacy = req.body.privacy;
                            switch (req.body.privacy)
                            {
                            case "public":
                                project.ddr.privacyStatus = "public";
                                break;
                            case "private":
                                project.ddr.privacyStatus = "private";
                                break;
                            case "metadata_only":
                                project.ddr.privacyStatus = "metadata_only";
                                break;
                            }
                        }

                        return callback(null, project);
                    };

                    let notifyContributor = function (user)
                    {
                        const client = nodemailer.createTransport("SMTPS:", {
                            service: "SendGrid",
                            auth: {
                                user: Config.sendGridUser,
                                pass: Config.sendGridPassword
                            }
                        });

                        const email = {
                            from: Config.email.gmail.address,
                            to: user.foaf.mbox,
                            subject: req.user.ddr.username + " added you as a contributor of project \"" + project.ddr.handle + "\"",
                            text: "User " + req.user.uri + " added you as a contributor for project \"" + project.ddr.handle + "\"."
                        };

                        client.sendMail(email, function (err, info)
                        {
                            if (err)
                            {
                                if (Config.logging.log_emails)
                                {
                                    console.log("[NODEMAILER] " + err);
                                }

                                flash("error", "Error sending request to user. Please try again later");
                            }
                            else
                            {
                                console.log("[NODEMAILER] email sent: " + info);
                                flash("success", "Sent request to project's owner");
                            }
                        });
                    };

                    let updateProjectSettings = function (project, callback)
                    {
                        const updateStorageLimit = function (callback)
                        {
                            if (!isNull(req.body.storage_limit))
                            {
                                try
                                {
                                    req.body.storage_limit = parseInt(req.body.storage_limit);
                                }
                                catch (e)
                                {
                                    return callback(true, "Invalid storage limit value " + req.body.storage_limit + " specified. It must be an integer number. ");
                                }

                                User.findByUri(req.user.uri, function (err, user)
                                {
                                    if (isNull(err))
                                    {
                                        Permissions.checkRoleInSystem(req, user, Permissions.settings.role.in_system.admin, function (err, isAdmin)
                                        {
                                            // Admins can set sizes larger than the default maximum,
                                            // otherwise the user is limited to the maximum project size in the development_configs.json file
                                            if (isAdmin)
                                            {
                                                project.ddr.hasStorageLimit = req.body.storage_limit;
                                            }
                                            else
                                            {
                                                project.ddr.hasStorageLimit = Math.min(req.body.storage_limit, Config.maxProjectSize);
                                            }

                                            return callback(null, project);
                                        });
                                    }
                                    else
                                    {
                                        console.error(JSON.stringify(err));
                                        console.error(JSON.stringify(user));
                                        return callback(true, "Unable to validate permissions of the currently logged user when updating the storage limit.");
                                    }
                                });
                            }
                            else
                            {
                                callback(null, project);
                            }
                        };

                        if (!isNull(req.body.verified_uploads) && (req.body.verified_uploads === true || req.body.verified_uploads === false))
                        {
                            project.ddr.requiresVerifiedUploads = req.body.verified_uploads;
                        }

                        updateStorageLimit(function (err, result)
                        {
                            callback(err, result);
                        });
                    };

                    let updateProjectContributors = function (project, callback)
                    {
                        if (!isNull(req.body.contributors) && req.body.contributors instanceof Array)
                        {
                            async.mapSeries(req.body.contributors, function (contributor, callback)
                            {
                                const Resource = require(Pathfinder.absPathInSrcFolder("/models/resource.js")).Resource;
                                const userUriRegexp = Resource.getResourceRegex("user");
                                const userUsernameRegexp = new RegExp(/^[a-zA-Z0-9_]+$/);

                                let contributorFetcher;

                                const getUser = function (identifier, callback)
                                {
                                    if (!isNull(identifier) && userUriRegexp.test(identifier))
                                    {
                                        User.findByUri(identifier, callback);
                                    }
                                    else if (!isNull(identifier) && userUsernameRegexp.test(identifier))
                                    {
                                        User.findByUsername(identifier, callback);
                                    }
                                    else if (!isNull(identifier))
                                    {
                                        return callback(true, identifier);
                                    }
                                    else
                                    {
                                        return callback(null, null);
                                    }
                                };

                                const notifyUser = function (user, callback)
                                {
                                    if (isNull(err) && !isNull(user) && user instanceof User)
                                    {
                                        // Check if user already is a contributor so as to not send a notification
                                        if (user.foaf.mbox && !_.contains(project.dcterms.contributor, user.uri))
                                        {
                                            notifyContributor(user);
                                        }
                                        return callback(null, user.uri);
                                    }
                                    return callback(true, contributor);
                                };

                                getUser(contributor, function (err, user)
                                {
                                    if (isNull(err))
                                    {
                                        if (!isNull(user) && user instanceof User)
                                        {
                                            notifyUser(user, callback);
                                        }
                                        else
                                        {
                                            callback(true, "User " + contributor + " not found.");
                                        }
                                    }
                                    else
                                    {
                                        callback(err, user);
                                    }
                                });
                            }, function (err, contributors)
                            {
                                if (isNull(err))
                                {
                                    // all users were invalid
                                    if (_.without(contributors, null).length === 0)
                                    {
                                        return callback(true, project);
                                    }
                                    project.dcterms.contributor = _.without(contributors, null);
                                    return callback(null, project);
                                }
                                return callback(err, contributors);
                            });
                        }
                        else
                        {
                            return callback(null, project);
                        }
                    };

                    let saveProject = function (project, callback)
                    {
                        project.save(function (err, result)
                        {
                            return callback(err, project);
                        });
                    };

                    async.waterfall([
                        updateProjectMetadata,
                        updateProjectContributors,
                        updateProjectSettings,
                        saveProject
                    ], function (err, project)
                    {
                        if (isNull(err))
                        {
                            viewVars.project = project;
                            viewVars.success_messages = ["Project " + project.ddr.handle + " successfully updated."];

                            sendResponse(
                                "projects/administration/administer",
                                viewVars,
                                {
                                    message: viewVars.success_messages,
                                    project: project
                                });
                        }
                        else
                        {
                            if (project instanceof Array)
                            {
                                viewVars.error_messages = project;
                            }
                            else
                            {
                                viewVars.error_messages = [project];
                            }

                            sendResponse(
                                "projects/administration/administer",
                                viewVars,
                                {
                                    message: viewVars.error_messages,
                                    project: project
                                },
                                400);
                        }
                    });
                }
                else if (req.originalMethod === "GET")
                {
                    viewVars.project = project;
                    res.render("projects/administration/administer",
                        viewVars
                    );
                }
            }
            else
            {
                viewVars.error_messages = ["Project " + requestedResourceUri + " does not exist."];

                sendResponse(
                    "projects/administration/administer",
                    viewVars,
                    {
                        message: viewVars.error_messages,
                        project: project
                    },
                    401);
            }
        }
        else
        {
            viewVars.error_messages = ["Error reported " + project];

            sendResponse(
                "projects/administration/administer",
                viewVars,
                {
                    message: viewVars.error_messages,
                    project: project
                },
                500);
        }
    });
};

exports.get_contributors = function (req, res)
{
    Project.findByUri(req.params.requestedResourceUri, function (err, project)
    {
        if (isNull(err))
        {
            if (!isNull(project))
            {
                let contributorsUri = [];
                if (!isNull(project.dcterms.contributor))
                {
                    if (project.dcterms.contributor instanceof Array)
                    {
                        contributorsUri = project.dcterms.contributor;
                    }
                    else
                    {
                        contributorsUri.push(project.dcterms.contributor);
                    }

                    const contributors = [];
                    async.each(contributorsUri, function (contributor, callback)
                    {
                        User.findByUri(contributor, function (err, user)
                        {
                            if (isNull(err) && user)
                            {
                                contributors.push(user);
                                return callback(null);
                            }
                            return callback(true, contributor);
                        }, true);
                    }, function (err, contributor)
                    {
                        if (isNull(err))
                        {
                            res.json({
                                contributors: contributors
                            });
                        }
                        else
                        {
                            res.status(500).json({
                                message: "Error finding user " + contributor
                            });
                        }
                    });
                }
            }
        }
    });
};

exports.bagit = function (req, res)
{
    Project.findByUri(req.params.requestedResourceUri, function (err, project)
    {
        if (isNull(err))
        {
            if (!isNull(project) && project instanceof Project)
            {
                project.backup(function (err, baggedContentsZipFileAbsPath, parentFolderPath)
                {
                    if (isNull(err))
                    {
                        if (!isNull(baggedContentsZipFileAbsPath))
                        {
                            const fs = require("fs");
                            const fileStream = fs.createReadStream(baggedContentsZipFileAbsPath);

                            res.on("end", function ()
                            {
                                Folder.deleteOnLocalFileSystem(parentFolderPath, function (err, stdout, stderr)
                                {
                                    if (err)
                                    {
                                        console.error("Unable to delete " + parentFolderPath);
                                    }
                                    else
                                    {
                                        console.log("Deleted " + parentFolderPath);
                                    }
                                });
                            });

                            res.writeHead(200,
                                {
                                    "Content-disposition": "filename=\"Project " + project.dcterms.title + " (Backup at " + new Date().toISOString() + ").zip" + "\"",
                                    "Content-type": Config.mimeType("zip")
                                });

                            fileStream.pipe(res);
                        }
                        else
                        {
                            const error = "There was an error attempting to backup project : " + requestedProjectURI;
                            console.error(error);
                            res.status(500).write("Error : " + error + "\n");
                            res.end();
                        }
                    }
                    else
                    {
                        res.status(500).json({
                            result: "error",
                            message: "project " + req.params.requestedResourceUri + " was found but it was impossible to delete because of error : " + baggedContentsZipFileAbsPath
                        });
                    }
                });
            }
            else
            {
                res.status(404).json({
                    result: "error",
                    message: "Unable to find project with handle : " + req.params.requestedResourceUri
                });
            }
        }
        else
        {
            res.status(500).json({
                result: "error",
                message: "Invalid project : " + req.params.requestedResourceUri + " : " + project
            });
        }
    });
};

exports.recent_changes = function (req, res)
{
    const acceptsHTML = req.accepts("html");
    let acceptsJSON = req.accepts("json");

    if (!acceptsJSON && acceptsHTML)
    {
        res.status(400).json({
            result: "error",
            message: "HTML Request not valid for this route."
        });
    }
    else
    {
        Project.findByUri(req.params.requestedResourceUri, function (err, project)
        {
            if (isNull(err))
            {
                if (!isNull(project) && project instanceof Project)
                {
                    const offset = parseInt(req.query.offset);
                    const limit = parseInt(req.query.limit);

                    project.getRecentProjectWideChanges(function (err, changes)
                    {
                        if (isNull(err))
                        {
                            res.json(changes);
                        }
                        else
                        {
                            res.status(500).json({
                                result: "error",
                                message: "Error getting recent changes from project : " + project.ddr.humanReadableURI + " : " + changes
                            });
                        }
                    }, offset, limit);
                }
                else
                {
                    res.status(404).json({
                        result: "error",
                        message: "Unable to find project " + req.params.requestedResourceUri
                    });
                }
            }
            else
            {
                res.status(500).json({
                    result: "error",
                    message: "Invalid project : " + req.params.requestedResourceUri + " : " + project
                });
            }
        });
    }
};

exports.stats = function (req, res)
{
    Project.findByUri(req.params.requestedResourceUri, function (err, project)
    {
        if (isNull(err))
        {
            const offset = parseInt(req.query.offset);
            const limit = parseInt(req.query.limit);

            async.waterfall([
                function (callback)
                {
                    project.getRevisionsCount(function (err, revisionsCount)
                    {
                        if (isNull(err))
                        {
                            return callback(err, revisionsCount);
                        }
                        return callback(1,
                            {
                                result: "error",
                                message: "Error calculating calculating number of revisions in project . Error reported : " + JSON.stringify(err) + "."
                            });
                    });
                },
                function (revisionsCount, callback)
                {
                    project.getFoldersCount(function (err, foldersCount)
                    {
                        if (isNull(err))
                        {
                            return callback(err, revisionsCount, foldersCount);
                        }
                        return callback(1,
                            {
                                result: "error",
                                message: "Error calculating calculating number of folders in project . Error reported : " + JSON.stringify(err) + "."
                            });
                    });
                },
                function (revisionsCount, foldersCount, callback)
                {
                    project.getFilesCount(function (err, filesCount)
                    {
                        if (isNull(err))
                        {
                            return callback(err, revisionsCount, foldersCount, filesCount);
                        }
                        return callback(1,
                            {
                                result: "error",
                                message: "Error calculating calculating number of files in project . Error reported : " + JSON.stringify(err) + "."
                            });
                    });
                },
                function (revisionsCount, foldersCount, filesCount, callback)
                {
                    project.getMembersCount(function (err, membersCount)
                    {
                        if (isNull(err))
                        {
                            return callback(err, revisionsCount, foldersCount, filesCount, membersCount);
                        }
                        return callback(1,
                            {
                                result: "error",
                                message: "Error calculating calculating number of members of the project . Error reported : " + JSON.stringify(err) + "."
                            });
                    });
                },
                function (revisionsCount, foldersCount, filesCount, membersCount, callback)
                {
                    project.getStorageSize(function (err, storageSize)
                    {
                        if (isNull(err))
                        {
                            return callback(err, revisionsCount, foldersCount, filesCount, membersCount, storageSize);
                        }
                        return callback(1,
                            {
                                result: "error",
                                message: "Error calculating size of project : " + req.params.requestedResourceUri + " . Error reported : " + JSON.stringify(err) + ".",
                                solution: "Did you install mongodb via apt-get? YOU NEED MONGODB 10GEN to run this, or it will give errors. Install the latest mongodb by .deb package instead of apt-get."
                            });
                    });
                },
                function (revisionsCount, foldersCount, filesCount, membersCount, storageSize)
                {
                    const humanize = require("humanize");

                    res.json({
                        size: storageSize,
                        max_size: Config.maxProjectSize,
                        percent_full: Math.round((storageSize / Config.maxProjectSize) * 100),
                        members_count: membersCount,
                        folders_count: foldersCount,
                        files_count: filesCount,
                        revisions_count: revisionsCount
                    });
                }
            ],
            function (err, result)
            {
                if (err)
                {
                    res.status(500).json(result);
                }
            });
        }
        else
        {
            res.status(500).json({
                result: "error",
                message: "Invalid project : " + req.params.requestedResourceUri + " : " + project
            });
        }
    });
};

exports.interactions = function (req, res)
{
    let username = req.params.username;
    const currentUser = req.user;
    let acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    if (!username)
    {
        username = currentUser.uri;
    }

    /**
     * normal users can only access their own information, admins
     * can access information of all users
     */
    if (acceptsJSON && !acceptsHTML) // will be null if the client does not accept html
    {
        Project.findByUri(req.params.requestedResourceUri, function (err, project)
        {
            if (isNull(err))
            {
                project.getInteractions(function (err, interactions)
                {
                    if (isNull(err))
                    {
                        res.json(interactions);
                    }
                    else
                    {
                        res.status(500).json({
                            result: "Error",
                            message: "Error retrieving interactions for project " + req.params.requestedResourceUri
                        });
                    }
                });
            }
            else
            {
                res.status(404).json({
                    result: "Error",
                    message: "Unable to find project " + req.params.requestedResourceUri
                });
            }
        });
    }
    else
    {
        const msg = "This method is only accessible via API. Accepts:\"application/json\" header missing or is not the only Accept type";
        req.flash("error", "Invalid Request");
        console.log(msg);
        res.status(400).render("",
            {
            }
        );
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
            Project.findByUri(req.params.requestedResourceUri, function (err, project)
            {
                if (isNull(err) && project instanceof Project)
                {
                    res.render("projects/request_access",
                        {
                            project: project
                        });
                }
                else
                {
                    req.flash("error", "Project " + req.params.requestedResourceUri + " not found.");
                    res.redirect("/");
                }
            });
        }
    }
    else if (req.originalMethod === "POST")
    {
        const flash = require("connect-flash");
        console.log(req.user);
        Project.findByUri(req.params.requestedResourceUri, function (err, project)
        {
            if (isNull(err) && project instanceof Project)
            {
                const lastSlash = project.dcterms.creator.lastIndexOf("\/");
                const creatorUsername = project.dcterms.creator.substring(lastSlash + 1);

                User.findByUsername(creatorUsername, function (err, user)
                {
                    if (isNull(err) && user instanceof User)
                    {
                        const userMail = user.foaf.mbox;

                        const client = nodemailer.createTransport("SMTP", {
                            service: "SendGrid",
                            auth: {
                                user: Config.sendGridUser,
                                pass: Config.sendGridPassword
                            }
                        });

                        const email = {
                            from: "support@dendro.fe.up.pt",
                            to: "ffjs1993@gmail.com",
                            subject: "Request for project \"" + project.ddr.handle + "\"",
                            text: "User " + req.user.uri + " requested access for project \"" + project.ddr.handle + "\".\ " +
                            "To accept this, please add him as a contributor."
                        };

                        client.sendMail(email, function (err, info)
                        {
                            if (err)
                            {
                                console.log("[NODEMAILER] " + err);
                                flash("error", "Error sending request to user. Please try again later");
                                res.redirect("/");
                            }
                            else
                            {
                                console.log("[NODEMAILER] email sent: " + info);
                                flash("success", "Sent request to project's owner");
                                res.redirect("/");
                            }
                        });
                    }
                    else
                    {
                        flash("error", "Error finding project's owner. Please try again later");
                        res.redirect("/");
                    }
                });
            }
            else
            {
                flash("error", "Error retrieving project. Please try again later");
                res.redirect("/");
            }
        });
    }
};

exports.import = function (req, res)
{
    let acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    if (req.originalMethod === "GET" && JSON.stringify(req.query) === JSON.stringify({}))
    {
        if (acceptsJSON && acceptsHTML)
        {
            const filesize = require("file-size");

            return res.render("projects/import/import",
                {
                    title: "Import a project",
                    maxUploadSize: filesize(Config.maxUploadSize).human("jedec"),
                    maxProjectSize: filesize(Config.maxProjectSize).human("jedec")
                }
            );
        }
        else if (acceptsJSON && !acceptsHTML)
        {
            return res.status(400).json({
                result: "error",
                message: "API Request not valid for this route."
            });
        }
    }
    else
    {
        const uploader = new Uploader();
        uploader.handleUpload(req, res, function (err, result)
        {
            if (!isNull(result) && result instanceof Array && result.length === 1)
            {
                if (isNull(req.query.imported_project_handle))
                {
                    return res.status(400).json({
                        result: "error",
                        message: "Missing 'imported_project_handle' parameter!"
                    });
                }
                else if (!req.query.imported_project_handle.match(/^[0-9a-z]+$/))
                {
                    return res.status(400).json({
                        result: "error",
                        message: "Invalid 'imported_project_handle' parameter! Should match regex ^[0-9a-z]+$ (only alphanumeric characters, lowercase letters)."
                    });
                }
                else if (isNull(req.query.imported_project_title))
                {
                    return res.status(400).json({
                        result: "error",
                        message: "Missing 'imported_project_title' parameter!"
                    });
                }
                const uploadedBackupAbsPath = result[0].path;
                const projectHandleCannotExist = function (callback)
                {
                    Project.findByHandle(req.query.imported_project_handle, function (err, project)
                    {
                        if (isNull(err))
                        {
                            if (isNull(project))
                            {
                                callback(null);
                            }
                            else
                            {
                                callback(400, {
                                    result: "error",
                                    message: ["A project with handle " + req.query.imported_project_handle + " already exists. Please choose another one."]
                                });
                            }
                        }
                        else
                        {
                            callback(500, {
                                result: "error",
                                message: ["Error checking if project with handle " + req.query.imported_project_handle + " already exists. "],
                                error: project
                            });
                        }
                    });
                };

                const processImport = function (callback)
                {
                    const getMetadata = function (absPathOfBagItBackupRootFolder, callback)
                    {
                        const bagItMetadataFileAbsPath = path.join(absPathOfBagItBackupRootFolder, "bag-info.txt");
                        const projectDescriptors = [];

                        const lineReader = require("readline").createInterface({
                            input: require("fs").createReadStream(bagItMetadataFileAbsPath)
                        });

                        const getDescriptor = function (line)
                        {
                            const fieldMatcher = {
                                "Source-Organization": "dcterms:publisher",
                                "Organization-Address": "schema:address",
                                "Contact-Name": "schema:provider",
                                "Contact-Phone": "schema:telephone",
                                "External-Description": "dcterms:description",
                                "Contact-Email": "schema:email"
                            };

                            const separator = line.indexOf(":");

                            if (separator)
                            {
                                const bagitField = line.substring(0, separator);
                                const bagitValue = line.substring(separator + 2); // 2 extra char after index of : must be rejected, which is the space.
                                const descriptor = fieldMatcher[bagitField];

                                if (descriptor)
                                {
                                    return new Descriptor({
                                        prefixedForm: descriptor,
                                        value: bagitValue
                                    });
                                }
                                return null;
                            }
                            return null;
                        };

                        lineReader.on("line", function (line)
                        {
                            if (!isNull(line))
                            {
                                const descriptor = getDescriptor(line);
                                if (descriptor)
                                {
                                    projectDescriptors.push(descriptor);
                                }
                            }
                        });

                        lineReader.on("close", function (line)
                        {
                            callback(projectDescriptors);
                        });
                    };

                    if (path.extname(uploadedBackupAbsPath) === ".zip")
                    {
                        Project.unzipAndValidateBagItBackupStructure(
                            uploadedBackupAbsPath,
                            Config.maxProjectSize,
                            function (err, valid, absPathOfDataRootFolder, absPathOfUnzippedBagIt)
                            {
                                File.deleteOnLocalFileSystem(uploadedBackupAbsPath, function (err, result)
                                {
                                    if (!isNull(err))
                                    {
                                        console.error("Error occurred while deleting backup zip file at " + uploadedBackupAbsPath + " : " + JSON.stringify(result));
                                    }
                                });

                                if (isNull(err))
                                {
                                    if (valid)
                                    {
                                        getMetadata(absPathOfUnzippedBagIt, function (descriptors)
                                        {
                                            // by default the project is private on import
                                            const newProject = new Project({
                                                ddr: {
                                                    is_being_imported: true,
                                                    handle: req.query.imported_project_handle,
                                                    privacyStatus: "private"
                                                },
                                                dcterms: {
                                                    creator: req.user.uri,
                                                    title: req.query.imported_project_title
                                                }
                                            });

                                            newProject.updateDescriptors(descriptors);

                                            Project.createAndInsertFromObject(newProject, function (err, newProject)
                                            {
                                                if (isNull(err))
                                                {
                                                    newProject.restoreFromFolder(absPathOfDataRootFolder, req.user, true, true, function (err, result)
                                                    {
                                                        if (isNull(err))
                                                        {
                                                            delete newProject.ddr.is_being_imported;
                                                            newProject.save(function (err, result)
                                                            {
                                                                if (isNull(err))
                                                                {
                                                                    callback(null,
                                                                        {
                                                                            result: "ok",
                                                                            message: "Project imported successfully.",
                                                                            new_project: newProject.uri
                                                                        }
                                                                    );
                                                                }
                                                                else
                                                                {
                                                                    callback(500,
                                                                        {
                                                                            result: "error",
                                                                            message: "Error marking project restore as complete.",
                                                                            error: result
                                                                        }
                                                                    );
                                                                }
                                                            });
                                                        }
                                                        else
                                                        {
                                                            callback(500,
                                                                {
                                                                    result: "error",
                                                                    message: "Error restoring project contents from unzipped backup folder",
                                                                    error: result
                                                                }
                                                            );
                                                        }
                                                    });
                                                }
                                                else
                                                {
                                                    callback(500,
                                                        {
                                                            result: "error",
                                                            message: "Error creating new project record before import operation could start",
                                                            error: result
                                                        }
                                                    );
                                                }
                                            });
                                        });
                                    }
                                    else
                                    {
                                        callback(400,
                                            {
                                                result: "error",
                                                message: "Invalid project structure. Is this a BagIt-format Zip file?",
                                                error: result
                                            }
                                        );
                                    }
                                }
                                else
                                {
                                    const msg = "Error restoring zip file to folder : " + valid;
                                    console.error(msg);

                                    callback(500, {
                                        result: "error",
                                        message: msg
                                    });
                                }
                            });
                    }
                    else
                    {
                        callback(400, {
                            result: "error",
                            message: "Backup file is not a .zip file"
                        });
                    }
                };

                async.waterfall([
                    projectHandleCannotExist,
                    processImport
                ], function (err, results)
                {
                    if (isNull(err))
                    {
                        res.json(results);
                    }
                    else
                    {
                        res.status(err).json(results);
                    }
                });
            }
            else
            {
                res.status(400).json({
                    result: "error",
                    message: "Error processing upload"
                });
            }
        });
    }
};

exports.delete = function (req, res)
{
    let acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    const getProject = function (callback)
    {
        Project.findByUri(req.params.requestedResourceUri, function (err, project)
        {
            if (isNull(err))
            {
                if (!isNull(project) && project instanceof Project)
                {
                    callback(null, project);
                }
                else
                {
                    res.render("projects/delete",
                        {
                            title: "Delete a project",
                            success_messages: [ "Project with URI " + req.params.requestedResourceUri + " does not exist" ]
                        }
                    );
                }
            }
            else
            {
                res.status(500).render("projects/delete",
                    {
                        title: "Delete a project",
                        error_messages: [ "Error fetching project with uri " + project.uri ]
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
            getProject(function (err, project)
            {
                res.render("projects/delete",
                    {
                        title: "Delete a project",
                        project: project
                    }
                );
            });
        }
        else if (req.originalMethod === "POST" || req.originalMethod === "DELETE")
        {
            getProject(function (err, project)
            {
                if (!err)
                {
                    if (!isNull(project) && project instanceof Project)
                    {
                        project.delete(function (err, result)
                        {
                            if (isNull(err))
                            {
                                req.flash("success", [ "Project " + project.uri + " deleted successfully" ]);
                                res.redirect("/projects/my");
                            }
                            else
                            {
                                req.flash("error", [ "Error deleting project " + project.uri + " : " + JSON.stringify(result) ]);
                                res.status(500).redirect(req.url);
                            }
                        });
                    }
                    else
                    {
                        req.flash("error", "Project " + req.params.requestedResourceUri + " does not exist");
                        res.status(404).redirect("/projects/my");
                    }
                }
                else
                {
                    req.flash("error", "Error retrieving project " + req.params.requestedResourceUri);
                    req.flash("error", "Error details" + project);
                    res.status(500).redirect("/projects/my");
                }
            });
        }
    }
};

module.exports = exports;
