const Config = function () {
    return GLOBAL.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const Permissions = Object.create(require(Config.absPathInSrcFolder("/models/meta/permissions.js")).Permissions);
const Resource = Object.create(require(Config.absPathInSrcFolder("/models/resource.js")).Resource);
const QueryBasedRouter = Object.create(require(Config.absPathInSrcFolder("/utils/query_based_router.js")).QueryBasedRouter);
let RecommendationUtils = require(Config.absPathInSrcFolder("/utils/recommendation.js")).RecommendationUtils;

//middlewares

const parseRequest = require(Config.absPathInSrcFolder("/bootup/middleware/parse_request.js")).parseRequest;
const sendResponse = require(Config.absPathInSrcFolder("/bootup/middleware/send_response.js")).sendResponse;

//app's own requires
const index = require(Config.absPathInSrcFolder("/controllers/index"));
const users = require(Config.absPathInSrcFolder("/controllers/users"));
const vertexes = require(Config.absPathInSrcFolder("/controllers/vertexes"));
const admin = require(Config.absPathInSrcFolder("/controllers/admin"));
const projects = require(Config.absPathInSrcFolder("/controllers/projects"));
const files = require(Config.absPathInSrcFolder("/controllers/files"));
const records = require(Config.absPathInSrcFolder("/controllers/records"));
const interactions = require(Config.absPathInSrcFolder("/controllers/interactions"));
const descriptors = require(Config.absPathInSrcFolder("/controllers/descriptors"));
const evaluation = require(Config.absPathInSrcFolder("/controllers/evaluation"));
const ontologies = require(Config.absPathInSrcFolder("/controllers/ontologies"));
const research_domains = require(Config.absPathInSrcFolder("/controllers/research_domains"));
const repo_bookmarks = require(Config.absPathInSrcFolder("/controllers/repo_bookmarks"));
const datasets = require(Config.absPathInSrcFolder("/controllers/datasets"));
const posts = require(Config.absPathInSrcFolder("/controllers/posts"));
const fileVersions = require(Config.absPathInSrcFolder("/controllers/file_versions"));
const notifications = require(Config.absPathInSrcFolder("/controllers/notifications"));
const recommendation_mode = RecommendationUtils.getActiveRecommender();

const auth = require(Config.absPathInSrcFolder("/controllers/auth"));
const auth_orcid = require(Config.absPathInSrcFolder("/controllers/auth_orcid"));
const path = require('path');

const express = require('express'),
    domain = require('domain'),
    passport = require('passport'),
    flash = require('connect-flash'),
    http = require('http'),
    fs = require('fs'),
    morgan = require('morgan'),
    favicon = require('serve-favicon'),
    csrf = require('csurf'),
    csrfProtection = csrf({ cookie: true });

let async = require('async');
let util = require('util');
let mkdirp = require('mkdirp');

const getNonHumanReadableRouteRegex = function(resourceType)
{
    const regex = "^/r/"+resourceType+"/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";
    return new RegExp(regex);
};

const extractUriFromRequest = function (req, res, next) {
    const matches = req.path.match(/^\/r\/([^\/]+)\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/);
    if(matches && matches.length === 2) {
        console.log(req.params);
        req.params.requestedResourceUri = matches[0];
    }

    return next(null, req, res);
};

const loadRoutes = function(app, passport, recommendation, callback)
{
    app.get('/', index.index);

    app.get('/analytics_tracking_code', index.analytics_tracking_code);

    //nodes
    app.get('/vertexes', async.apply(Permissions.require, [Permissions.role.system.admin]), vertexes.all);
    app.get('/vertexes/random', async.apply(Permissions.require, [Permissions.role.system.admin]), vertexes.random);
    app.get('/vertexes/show', async.apply(Permissions.require, [Permissions.role.system.admin]), vertexes.show);

    //search
    app.get('/search', vertexes.search);

    //admin area
    app.get('/admin', async.apply(Permissions.require, [Permissions.role.system.admin]), admin.home);
    app.get('/admin/reindex', async.apply(Permissions.require, [Permissions.role.system.admin]), admin.reindex);
    app.get('/admin/reload', async.apply(Permissions.require, [Permissions.role.system.admin]), admin.reload);

    //low-level sparql endpoint
    //TODO
    //app.get('/sparql', async.apply(Permissions.require, [Permissions.role.system.admin]), sparql.show);

    //authentication

    if(Config.authentication.default.enabled)
    {
        const LocalStrategy = require('passport-local').Strategy;

        passport.use(new LocalStrategy({
                usernameField: 'username',
                passwordField: 'password'
            },
            function(username, password, done) {
                const User = require(Config.absPathInSrcFolder("/models/user.js")).User;
                User.findByUsername(username, function (err, user) {

                    const bcrypt = require('bcryptjs');
                    bcrypt.hash(password, user.ddr.salt, function(err, hashedPassword) {
                        if(!err) {
                            if (!isNull(user)) {
                                if (user.ddr.password === hashedPassword) {
                                    user.isAdmin(function (err, isAdmin) {
                                        if (!err) {
                                            return done(
                                                err,
                                                user,
                                                {
                                                    isAdmin : isAdmin
                                                });
                                        }
                                        else {
                                            return done("Unable to check for admin user when authenticating with username " + username, null);
                                        }
                                    });
                                }
                                else {
                                    return done("Invalid username/password combination.", null);
                                }
                            }
                            else {
                                console.error(err.stack);
                                return done("Unknown error during authentication, calculating password hash.", null);
                            }
                        }
                        else
                        {
                            return done("There is no user with username " + username + " registered in this system.", null);
                        }
                    });
                });
            }
        ));

        app.get('/login', auth.login);
        app.post('/login', auth.login);
    }

    if(Config.authentication.orcid.enabled)
    {
        const OrcidStrategy = require('passport-orcid').Strategy;

        passport.use(new OrcidStrategy({
                clientID: Config.authentication.orcid.client_id,
                clientSecret: Config.authentication.orcid.client_secret,
                callbackURL: Config.baseUri + Config.authentication.orcid.callback_url
            },
            function(accessToken, refreshToken, params, profile, done) {
                const User = require(Config.absPathInSrcFolder("/models/user.js")).User;
                User.findByORCID(params.orcid, function (err, user) {
                    if (err)
                    {
                        return done(err);
                    }
                    if (!user)
                    {
                        return done(null, false,
                            {
                                orcid_data : {
                                    accessToken: accessToken,
                                    refreshToken: refreshToken,
                                    params: params,
                                    profile: profile
                                }
                            });
                    }

                    return done(null, user);
                });
            }
        ));

        app.get('/auth/orcid', passport.authenticate('orcid'));
        app.get('/auth/orcid/callback', csrfProtection, function(req, res, next) {
            passport.authenticate('orcid', auth_orcid.login(req, res, next));
        });
    }

    /**
     * Helper function to add the requested resource URI to the parameters, based on the human readable URI,
     * in case APIs are called with the human readable URI of a resource
     * TODO should this validate if a request is JSON and if so, refuse the request if calling an API over a resource identified by a human-readable URI?
     * @param humanReadableUri
     * @param errorMessage
     * @param viewToRenderOnError
     * @param req
     * @param res
     * @param next
     * @param callback
     */

    const getRequestedResourceUriFromHumanReadableUri = function(humanReadableUri, errorMessage, viewToRenderOnError, req, res, next, callback)
    {
        Resource.getUriFromHumanReadableUri(humanReadableUri, function(err, resourceUri){
            if(isNull(err))
            {
                if(!isNull(resourceUri))
                {
                    callback(null, resourceUri);
                }
                else
                {
                    return sendResponse.notFound(
                        null,
                        {
                            view : viewToRenderOnError,
                            messages : ["Resource not found at uri " + humanReadableUri],
                            error : resourceUri
                        },
                        req,
                        res,
                        next
                    );
                }
            }
            else
            {
                return sendResponse.error(
                    null,
                    {
                        view: viewToRenderOnError,
                        messages: ["Error occurred while translating the human readable uri " + humanReadableUri  + " into the internal uri of a resource." + JSON.stringify(resourceUri)],
                        error : resourceUri
                    },
                    req,
                    res,
                    next
                );
            }
        });
    };

    app.get('/ontologies/public', ontologies.public);
    app.get('/ontologies/all', ontologies.all);
    app.get('/ontologies/autocomplete', async.apply(Permissions.require, [Permissions.role.system.user]), ontologies.ontologies_autocomplete);

    app.get(
        [
            getNonHumanReadableRouteRegex("ontology"),
            '/ontologies/show/:prefix'
        ],
        extractUriFromRequest,
        async.apply(Permissions.require, [Permissions.role.system.user]), ontologies.show);

    app.post('/ontologies/edit', async.apply(Permissions.require, [Permissions.role.system.admin]), ontologies.edit);

    //descriptors
    app.get('/descriptors/from_ontology/:ontology_prefix', async.apply(Permissions.require, [ Permissions.role.project.contributor, Permissions.role.project.creator]), descriptors.from_ontology);

    //research domains

    app.get('/research_domains/autocomplete', async.apply(Permissions.require, [Permissions.role.system.user]), research_domains.autocomplete);
    app.get('/research_domains', async.apply(Permissions.require, [Permissions.role.system.user]), research_domains.all);
    app.post('/research_domains', async.apply(Permissions.require, [Permissions.role.system.admin]), research_domains.edit);
    
    app.delete([
            getNonHumanReadableRouteRegex("research_domain"),
            '/research_domains/:uri',
        ],
        extractUriFromRequest,
        async.apply(Permissions.require, [Permissions.role.system.admin]), research_domains.delete);

    //  registration and login
    app.get('/register', auth.register);
    app.post('/register', auth.register);
    app.get('/logout', async.apply(Permissions.require, [Permissions.role.system.user]), auth.logout);

    //people listing
    app.get('/users', users.all);
    app.get('/username_exists', users.username_exists);
    app.get('/users/loggedUser', users.getLoggedUser);

    app.get([
            getNonHumanReadableRouteRegex("user"),
            '/user/:username'
        ],
        extractUriFromRequest,
        async.apply(Permissions.require, [Permissions.role.system.user]), users.show);


    app.all('/reset_password', users.reset_password);
    app.all('/set_new_password', users.set_new_password);

    app.get('/me', async.apply(Permissions.require, [Permissions.role.system.user]), users.me);

    //projects
    app.get('/projects', projects.all);
    app.get('/projects/my', async.apply(Permissions.require, [Permissions.role.system.user]), projects.my);
    app.get('/projects/new', async.apply(Permissions.require, [Permissions.role.system.user]), projects.new);
    app.post('/projects/new', async.apply(Permissions.require, [Permissions.role.system.user]), projects.new);

    app.get('/projects/import', async.apply(Permissions.require, [Permissions.role.system.user]), projects.import);
    app.post('/projects/import', async.apply(Permissions.require, [Permissions.role.system.user]), projects.import);

    //external repository bookmarks
    app.get('/external_repositories/types', async.apply(Permissions.require, [Permissions.role.system.user]), repo_bookmarks.repository_types);
    app.get('/external_repositories/my', async.apply(Permissions.require, [Permissions.role.system.user ]), repo_bookmarks.my);
    app.get('/external_repositories', async.apply(Permissions.require, [Permissions.role.system.admin]), repo_bookmarks.all);
    app.post('/external_repositories/sword_collections', async.apply(Permissions.require, [Permissions.role.system.user]), datasets.sword_collections);
    app.post('/external_repositories/new', async.apply(Permissions.require, [Permissions.role.system.user]), repo_bookmarks.new);


    app.delete([
            getNonHumanReadableRouteRegex("external_repository"),
            '/external_repository/:username/:title'
        ],
        extractUriFromRequest,
        async.apply(Permissions.require, [Permissions.role.system.user]), repo_bookmarks.delete);

    //view a project's root
    app.all([
            getNonHumanReadableRouteRegex("project"),
            /\/project\/([^\/]+)(\/data)?\/?$/
        ],
        extractUriFromRequest,
        function(req,res, next)
        {
            const getResourceUri = function(requestedResource, callback)
            {
                getRequestedResourceUriFromHumanReadableUri(
                    requestedResource,
                    "Cannot fetch project " + requestedResource,
                    "index",
                    req,
                    res,
                    next,
                    callback);
            };

            const processRequest = function(resourceUri)
            {
                req.params.requestedResourceUri = resourceUri;

                const defaultPermissionsInProjectRoot = [
                    Permissions.project_privacy_status.public,
                    Permissions.project_privacy_status.metadata_only,
                    Permissions.role.project.contributor,
                    Permissions.role.project.creator
                ];

                req.params.handle = req.params[0];

                const modificationPermissions = [
                    Permissions.role.project.contributor,
                    Permissions.role.project.creator
                ];

                const administrationPermissions = [
                    Permissions.role.project.creator
                ];

                req.params.is_project_root = true;

                const queryBasedRoutes = {
                    get: [
                        //downloads
                        {
                            queryKeys: ['download'],
                            handler: files.download,
                            permissions: defaultPermissionsInProjectRoot,
                            authentication_error: "Permission denied : cannot download this project."
                        },
                        //backups
                        {
                            queryKeys: ['backup'],
                            handler: files.serve,
                            permissions: defaultPermissionsInProjectRoot,
                            authentication_error: "Permission denied : cannot backup this project."
                        },
                        //list contents
                        {
                            queryKeys: ['ls'],
                            handler: files.ls,
                            permissions: defaultPermissionsInProjectRoot,
                            authentication_error: "Permission denied : cannot list the contents of this project."
                        },
                        //descriptor recommendations
                        {
                            queryKeys: ['metadata_recommendations'],
                            handler: recommendation.recommend_descriptors,
                            permissions: defaultPermissionsInProjectRoot,
                            authentication_error: "Permission denied : cannot fetch descriptor recommendations for this project."
                        },
                        //recent changes
                        {
                            queryKeys: ['recent_changes'],
                            handler: projects.recent_changes,
                            permissions: defaultPermissionsInProjectRoot,
                            authentication_error: "Permission denied : cannot fetch recent changes for this project."
                        },
                        //project stats
                        {
                            queryKeys: ['stats'],
                            handler: projects.stats,
                            permissions: defaultPermissionsInProjectRoot,
                            authentication_error: "Permission denied : cannot fetch recent changes for this project."
                        },
                        //recommendation ontologies
                        {
                            queryKeys: ['recommendation_ontologies'],
                            handler: ontologies.get_recommendation_ontologies,
                            permissions: defaultPermissionsInProjectRoot,
                            authentication_error: "Permission denied : cannot get recommendation ontologies because you do not have permissions to access this project."
                        },
                        //show versions of resources
                        {
                            queryKeys: ['version'],
                            handler: records.show_version,
                            permissions: defaultPermissionsInProjectRoot,
                            authentication_error: "Permission denied : cannot get versions of this project because you do not have permissions to access this project."
                        },
                        //auto completing descriptors
                        {
                            queryKeys: ['descriptors_autocomplete'],
                            handler: descriptors.descriptors_autocomplete,
                            permissions: defaultPermissionsInProjectRoot,
                            authentication_error: "Permission denied : cannot get descriptor autocompletions in this project because you do not have permissions to access this project."

                        },
                        //auto completing ontologies
                        {
                            queryKeys: ['ontology_autocomplete'],
                            handler: ontologies.ontologies_autocomplete,
                            permissions: defaultPermissionsInProjectRoot,
                            authentication_error: "Permission denied : cannot get ontology autocompletions in this resource because you do not have permissions to access this project."
                        },
                        //auto completing users
                        {
                            queryKeys: ['user_autocomplete'],
                            handler: users.users_autocomplete,
                            permissions: defaultPermissionsInProjectRoot,
                            authentication_error: "Permission denied : cannot get user autocompletions in this resource because you do not have permissions to access this project."
                        },
                        //thumb nails
                        {
                            queryKeys: ['thumbnail'],
                            handler: files.thumbnail,
                            permissions: defaultPermissionsInProjectRoot,
                            authentication_error: "Permission denied : cannot get thumbnail for this project because you do not have permissions to access this project."
                        },
                        {
                            queryKeys: ['get_contributors'],
                            handler: projects.get_contributors,
                            permissions: defaultPermissionsInProjectRoot,
                            authentication_error: "Permission denied : cannot get contributors for this project because you do not have permissions to access this project."
                        },
                        //administration page
                        {
                            queryKeys: ['administer'],
                            handler: projects.administer,
                            permissions: administrationPermissions,
                            authentication_error: "Permission denied : cannot access the administration area of the project because you are not its creator."
                        },
                        //metadata
                        {
                            queryKeys: ['metadata'],
                            handler: projects.show,
                            permissions: defaultPermissionsInProjectRoot,
                            authentication_error: "Permission denied : cannot get metadata for this project because you do not have permissions to access this project."
                        },
                        //metadata deep
                        {
                            queryKeys: ['metadata', 'deep'],
                            handler: projects.show,
                            permissions: defaultPermissionsInProjectRoot,
                            authentication_error: "Permission denied : cannot get metadata (recursive) for this project because you do not have permissions to access this project."
                        },
                        //request access
                        {
                            queryKeys: ['request_access'],
                            handler: projects.requestAccess,
                            permissions: [Permissions.role.system.user],
                            authentication_error: "Permission denied : cannot request access to this project."
                        },
                        //default case
                        {
                            queryKeys: [],
                            handler: projects.show,
                            permissions: defaultPermissionsInProjectRoot,
                            authentication_error: "Permission denied : cannot show the project because you do not have permissions to access this project."
                        }
                    ],
                    post: [
                        {
                            queryKeys: ['mkdir'],
                            handler: files.mkdir,
                            permissions: modificationPermissions,
                            authentication_error: "Permission denied : cannot create new folder because you do not have permissions to edit this project."
                        },
                        {
                            queryKeys: ['restore'],
                            handler: files.restore,
                            permissions: modificationPermissions,
                            authentication_error: "Permission denied : cannot restore project from backup because you do not have permissions to edit this project."
                        },
                        {
                            queryKeys: ['administer'],
                            handler: projects.administer,
                            permissions: administrationPermissions,
                            authentication_error: "Permission denied : cannot access the administration area of the project because you are not its creator."
                        },
                        {
                            queryKeys: ['export_to_repository'],
                            handler: datasets.export_to_repository,
                            permissions: modificationPermissions,
                            authentication_error: "Permission denied : cannot export project because you do not have permissions to edit this project."
                        },
                        {
                            queryKeys: ['request_access'],
                            handler: projects.requestAccess,
                            permissions: [Permissions.role.system.user],
                            authentication_error: "Permission denied : cannot request access to this project."
                        },
                        {
                            queryKeys: ['delete'],
                            handler: projects.delete,
                            permissions: administrationPermissions,
                            authentication_error: "Permission denied : cannot delete project because you do not have permissions to administer this project."
                        },
                        {
                            queryKeys: ['undelete'],
                            handler: projects.undelete,
                            permissions: administrationPermissions,
                            authentication_error: "Permission denied : cannot undelete project because you do not have permissions to administer this project."
                        }
                    ]
                    /*all: [
                     //uploads
                     {
                     queryKeys: ['upload'],
                     handler: files.upload,
                     permissions: modificationPermissions
                     }
                     ]*/
                };

                QueryBasedRouter.applyRoutes(queryBasedRoutes, req, res, next);
            };

            async.waterfall([
                function(callback)
                {
                    if(!isNull(req.params.requestedResourceUri))
                    {
                        callback(null, req.params.requestedResourceUri);
                    }
                    else
                    {
                        const requestedProjectUrl = Config.baseUri + "/project/" + req.params[0];
                        getResourceUri(requestedProjectUrl, callback);
                    }
                },
                processRequest
            ]);
        }
    );

    //      files and folders (data)
    //      downloads
    app.all([
            getNonHumanReadableRouteRegex("folder"),
            getNonHumanReadableRouteRegex("file"),
            /\/project\/([^\/]+)(\/data\/.+\/?)$/
        ],
        extractUriFromRequest,
        function(req,res, next)
        {
            const getResourceUri = function(requestedResource, callback)
            {
                getRequestedResourceUriFromHumanReadableUri(
                    requestedResource,
                    "Cannot fetch resource " + requestedResource,
                    "index",
                    req,
                    res,
                    next,
                    callback);
            };

            const processRequest = function(resourceUri){
                req.params.requestedResourceUri = resourceUri;
                const defaultPermissionsInProjectBranch = [
                    Permissions.project_privacy_status.public,
                    Permissions.role.project.contributor,
                    Permissions.role.project.creator
                ];

                const modificationPermissionsBranch = [
                    Permissions.role.project.contributor,
                    Permissions.role.project.creator
                ];

                req.params.handle = req.params[0];                      //project handle
                req.params.filepath = req.params[1];

                req.params.is_project_root = false;

                const queryBasedRoutes = {
                    get: [
                        //downloads
                        {
                            queryKeys: ['download'],
                            handler: files.download,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot download this resource because you do not have permissions to access its project."
                        },
                        //backups
                        {
                            queryKeys: ['backup'],
                            handler: files.serve,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot backup this resource because you do not have permissions to access its project."
                        },
                        //bagits
                        //{
                        //    queryKeys : ['bagit'],
                        //    handler : projects.download,
                        //    permissions : defaultPermissionsInProjectBranch,
                        //    authentication_error : "Permission denied : cannot bagit this resource because you do not have permissions to access its project."
                        //},
                        //list contents
                        {
                            queryKeys: ['ls'],
                            handler: files.ls,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot list the contents of this resource because you do not have permissions to access its project."
                        },
                        //descriptor recommendations
                        {
                            queryKeys: ['metadata_recommendations'],
                            handler: recommendation.recommend_descriptors,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot get descriptor recommendations for this resource because you do not have permissions to access its project."
                        },
                        //recent changes
                        {
                            queryKeys: ['recent_changes'],
                            handler: files.recent_changes,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot get recent changes for this resource because you do not have permissions to access its project."
                        },
                        //project stats
                        {
                            queryKeys: ['stats'],
                            handler: projects.stats,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot get project stats because you do not have permissions to access this project."
                        },
                        //recommendation ontologies
                        {
                            queryKeys: ['recommendation_ontologies'],
                            handler: ontologies.get_recommendation_ontologies,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot get recommendation ontologies because you do not have permissions to access this project."
                        },
                        //show versions of resources
                        {
                            queryKeys: ['version'],
                            handler: records.show_version,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot get versions of this resource because you do not have permissions to access this project."
                        },
                        //auto completing descriptors
                        {
                            queryKeys: ['descriptor_autocomplete'],
                            handler: descriptors.descriptors_autocomplete,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot get descriptor autocompletions in this resource because you do not have permissions to access this project."
                        },
                        //auto completing ontologies
                        {
                            queryKeys: ['ontology_autocomplete'],
                            handler: ontologies.ontologies_autocomplete,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot get ontology autocompletions in this resource because you do not have permissions to access this project."
                        },
                        //thumb nails
                        {
                            queryKeys: ['thumbnail'],
                            handler: files.thumbnail,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot get thumbnail for this resource because you do not have permissions to access this project."
                        },
                        //metadata
                        {
                            queryKeys: ['metadata'],
                            handler: records.show,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot get metadata for this resource because you do not have permissions to access this project."
                        },
                        //metadata deep
                        {
                            queryKeys: ['metadata', 'deep'],
                            handler: records.show_deep,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot get metadata (recursive) for this resource because you do not have permissions to access this project."
                        },
                        //parent metadata
                        {
                            queryKeys: ['parent_metadata'],
                            handler: records.show_parent,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot get parent metadata for this resource because you do not have permissions to access this project."
                        },
                        //change_log
                        {
                            queryKeys: ['change_log'],
                            handler: projects.change_log,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot get the change log of this resource because you do not have permissions to access this project."
                        },
                        //recommendation_ontologies
                        {
                            queryKeys: ['recommendation_ontologies'],
                            handler: ontologies.get_recommendation_ontologies,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot get the recommended ontologies for this resource because you do not have permissions to access this project."
                        },
                        //serve files
                        {
                            queryKeys: ['serve'],
                            handler: files.serve,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot serve this file because you do not have permissions to access this project."
                        },
                        //serve files in base64
                        {
                            queryKeys: ['serve_base64'],
                            handler: files.serve_base64,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot serve this file (base64) because you do not have permissions to access this project."
                        },
                        //serve files serialized
                        {
                            queryKeys: ['data'],
                            handler: files.data,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot serve serialized data for this resource because you do not have permissions to access this project."
                        },
                        //metadata_evaluation
                        {
                            queryKeys: ['metadata_evaluation'],
                            handler: evaluation.metadata_evaluation,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot calculate metadata evaluation for this resource because you do not have permissions to access this project."
                        },
                        //default case
                        {
                            queryKeys: [],
                            handler: projects.show,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot show the resource because you do not have permissions to access this project."
                        }
                    ],
                    post: [
                        {
                            queryKeys: ['update_metadata'],
                            handler: records.update,
                            permissions: modificationPermissionsBranch,
                            authentication_error: "Permission denied : cannot update the resource metadata because you do not have permissions to edit this project."
                        },
                        {
                            queryKeys: ['restore_metadata_version'],
                            handler: records.restore_metadata_version,
                            permissions: modificationPermissionsBranch,
                            authentication_error: "Permission denied : cannot restore the resource metadata because you do not have permissions to edit this project."
                        },
                        {
                            queryKeys: ['register_interaction'],
                            handler: interactions.register,
                            permissions: modificationPermissionsBranch,
                            authentication_error: "Permission denied : cannot register the interaction because you do not have permissions to edit this project."
                        },
                        {
                            queryKeys: ['remove_recommendation_ontology'],
                            handler: interactions.reject_ontology_from_quick_list,
                            permissions: modificationPermissionsBranch,
                            authentication_error: "Permission denied : cannot remove the recommendation ontology interaction because you do not have permissions to edit this project."
                        },
                        {
                            queryKeys: ['mkdir'],
                            handler: files.mkdir,
                            permissions: modificationPermissionsBranch,
                            authentication_error: "Permission denied : cannot create new folder because you do not have permissions to edit this project."
                        },
                        {
                            queryKeys: ['restore'],
                            handler: files.restore,
                            permissions: modificationPermissionsBranch,
                            authentication_error: "Permission denied : cannot restore previous version of resource because you do not have permissions to edit this project."
                        },
                        {
                            queryKeys: ['undelete'],
                            handler: files.undelete,
                            permissions: modificationPermissionsBranch,
                            authentication_error: "Permission denied : cannot undelete resource because you do not have permissions to edit this project."
                        },
                        {
                            queryKeys: ['export_to_repository'],
                            handler: datasets.export_to_repository,
                            permissions: modificationPermissionsBranch,
                            authentication_error: "Permission denied : cannot export resource because you do not have permissions to edit this project."
                        }
                    ],
                    delete: [
                        {
                            queryKeys: ['really_delete'],
                            handler: files.rm,
                            permissions: modificationPermissionsBranch,
                            authentication_error: "Permission denied : cannot delete resource because you do not have permissions to edit this project."
                        },
                        {
                            queryKeys: [],
                            handler: files.rm,
                            permissions: modificationPermissionsBranch,
                            authentication_error: "Permission denied : cannot delete resource because you do not have permissions to edit this project."
                        }
                    ],
                    all: [
                        //uploads
                        {
                            queryKeys: ['upload'],
                            handler: files.upload,
                            permissions: modificationPermissionsBranch,
                            authentication_error: "Permission denied : cannot upload resource because you do not have permissions to edit this project."
                        }
                    ]
                };

                QueryBasedRouter.applyRoutes(queryBasedRoutes, req, res, next);
            };

            async.waterfall([
                function(callback)
                {
                    if(!isNull(req.params.requestedResourceUri))
                    {
                        callback(null, req.params.requestedResourceUri);
                    }
                    else
                    {
                        const requestedResource = Config.baseUri + "/project/" + req.params[0] + req.params[1];
                        getResourceUri(requestedResource, callback);
                    }
                },
                processRequest
            ]);
        }
    );

    //      social
    app.get('/posts/all', async.apply(Permissions.require, [Permissions.role.system.user]), posts.all);
    app.post('/posts/post', async.apply(Permissions.require, [Permissions.role.system.user]), posts.getPost_controller);
    app.post('/posts/new', async.apply(Permissions.require, [Permissions.role.system.user]), posts.new);
    app.post('/posts/like', async.apply(Permissions.require, [Permissions.role.system.user]), posts.like);
    app.post('/posts/like/liked', async.apply(Permissions.require, [Permissions.role.system.user]), posts.checkIfPostIsLikedByUser);
    app.post('/posts/post/likesInfo', async.apply(Permissions.require, [Permissions.role.system.user]), posts.postLikesInfo);
    app.post('/posts/comment', async.apply(Permissions.require, [Permissions.role.system.user]), posts.comment);
    app.post('/posts/comments', async.apply(Permissions.require, [Permissions.role.system.user]), posts.getPostComments);
    app.post('/posts/share', async.apply(Permissions.require, [Permissions.role.system.user]), posts.share);
    app.post('/posts/shares', async.apply(Permissions.require, [Permissions.role.system.user]), posts.getPostShares);
    app.get('/posts/countNum', async.apply(Permissions.require, [Permissions.role.system.user]), posts.numPostsDatabase);
    
    app.get([
            getNonHumanReadableRouteRegex("post"),
            '/posts/:uri'
        ],
        extractUriFromRequest,
        async.apply(Permissions.require, [Permissions.role.system.user]), posts.post);
    
    //file versions
    app.get('/fileVersions/all', async.apply(Permissions.require, [Permissions.role.system.user]), fileVersions.all);
    app.get('/fileVersions/countNum', async.apply(Permissions.require, [Permissions.role.system.user]), fileVersions.numFileVersionsInDatabase);
    app.post('/fileVersions/fileVersion', async.apply(Permissions.require, [Permissions.role.system.user]), fileVersions.getFileVersion);
    app.post('/fileVersions/like', async.apply(Permissions.require, [Permissions.role.system.user]), fileVersions.like);
    app.post('/fileVersions/comment', async.apply(Permissions.require, [Permissions.role.system.user]), fileVersions.comment);
    app.post('/fileVersions/share', async.apply(Permissions.require, [Permissions.role.system.user]), fileVersions.share);
    app.post('/fileVersions/fileVersion/likesInfo', async.apply(Permissions.require, [Permissions.role.system.user]), fileVersions.fileVersionLikesInfo);
    app.post('/fileVersions/shares', async.apply(Permissions.require, [Permissions.role.system.user]), fileVersions.getFileVersionShares);
    
    app.get([
            getNonHumanReadableRouteRegex("file_version"),
            '/fileVersions/:uri'
        ],
        extractUriFromRequest,
        async.apply(Permissions.require, [Permissions.role.system.user]), fileVersions.fileVersion);

    //shares
    app.get([
            getNonHumanReadableRouteRegex("file_version"),
            '/shares/:uri'
        ],
        extractUriFromRequest,
        async.apply(Permissions.require, [Permissions.role.system.user]), posts.getShare);

    //notifications
    app.get('/notifications/all', async.apply(Permissions.require, [Permissions.role.system.user]), notifications.get_unread_user_notifications);
    app.get('/notifications/notification', async.apply(Permissions.require, [Permissions.role.system.user]), notifications.get_notification_info);
    app.delete('/notifications/notification', async.apply(Permissions.require, [Permissions.role.system.user]), notifications.delete);

    //interactions
    app.post("/interactions/accept_descriptor_from_quick_list", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.accept_descriptor_from_quick_list);
    app.post("/interactions/accept_descriptor_from_quick_list_while_it_was_a_project_favorite", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.accept_descriptor_from_quick_list_while_it_was_a_project_favorite);
    app.post("/interactions/accept_descriptor_from_quick_list_while_it_was_a_user_favorite", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.accept_descriptor_from_quick_list_while_it_was_a_user_favorite);
    app.post("/interactions/accept_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.accept_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite);

    app.post("/interactions/accept_descriptor_from_manual_list", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.accept_descriptor_from_manual_list);
    app.post("/interactions/accept_descriptor_from_manual_list_while_it_was_a_project_favorite", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.accept_descriptor_from_manual_list_while_it_was_a_project_favorite);
    app.post("/interactions/accept_descriptor_from_manual_list_while_it_was_a_user_favorite", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.accept_descriptor_from_manual_list_while_it_was_a_user_favorite);
    app.post("/interactions/accept_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.accept_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite);

    app.post("/interactions/hide_descriptor_from_quick_list_for_project", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.hide_descriptor_from_quick_list_for_project);
    app.post("/interactions/unhide_descriptor_from_quick_list_for_project", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.unhide_descriptor_from_quick_list_for_project);
    app.post("/interactions/hide_descriptor_from_quick_list_for_user", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.hide_descriptor_from_quick_list_for_user);
    app.post("/interactions/unhide_descriptor_from_quick_list_for_user", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.unhide_descriptor_from_quick_list_for_user);
    app.post("/interactions/favorite_descriptor_from_quick_list_for_project", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.favorite_descriptor_from_quick_list_for_project);
    app.post("/interactions/favorite_descriptor_from_quick_list_for_user", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.favorite_descriptor_from_quick_list_for_user);

    app.post("/interactions/unfavorite_descriptor_from_quick_list_for_user", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.unfavorite_descriptor_from_quick_list_for_user);
    app.post("/interactions/unfavorite_descriptor_from_quick_list_for_project", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.unfavorite_descriptor_from_quick_list_for_project);

    app.post("/interactions/accept_descriptor_from_autocomplete", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.accept_descriptor_from_autocomplete);
    app.post("/interactions/reject_ontology_from_quick_list", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.reject_ontology_from_quick_list);
    app.post("/interactions/select_ontology_manually", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.select_ontology_manually);
    app.post("/interactions/select_descriptor_from_manual_list", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.select_descriptor_manually);

    app.post("/interactions/accept_smart_descriptor_in_metadata_editor", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.accept_smart_descriptor_in_metadata_editor);
    app.post("/interactions/accept_favorite_descriptor_in_metadata_editor", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.accept_favorite_descriptor_in_metadata_editor);

    app.post("/interactions/delete_descriptor_in_metadata_editor", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.delete_descriptor_in_metadata_editor);

    app.post("/interactions/fill_in_descriptor_from_manual_list_in_metadata_editor", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.fill_in_descriptor_from_manual_list_in_metadata_editor);
    app.post("/interactions/fill_in_descriptor_from_manual_list_while_it_was_a_project_favorite", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.fill_in_descriptor_from_manual_list_while_it_was_a_project_favorite);
    app.post("/interactions/fill_in_descriptor_from_manual_list_while_it_was_a_user_favorite", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.fill_in_descriptor_from_manual_list_while_it_was_a_user_favorite);
    app.post("/interactions/fill_in_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.fill_in_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite);


    app.post("/interactions/fill_in_descriptor_from_quick_list_in_metadata_editor", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.fill_in_descriptor_from_quick_list_in_metadata_editor);
    app.post("/interactions/fill_in_descriptor_from_quick_list_while_it_was_a_project_favorite", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.fill_in_descriptor_from_quick_list_while_it_was_a_project_favorite);
    app.post("/interactions/fill_in_descriptor_from_quick_list_while_it_was_a_user_favorite", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.fill_in_descriptor_from_quick_list_while_it_was_a_user_favorite);
    app.post("/interactions/fill_in_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.fill_in_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite);

    app.post("/interactions/fill_in_inherited_descriptor", async.apply(Permissions.require, [Permissions.role.system.user]), interactions.fill_in_inherited_descriptor);


    app.delete("/interactions/delete_all", async.apply(Permissions.require, [Permissions.role.system.admin]), interactions.delete_all_interactions);

    //serve angular JS ejs-generated html partials
    app.get(/(\/app\/views\/.+)\.html$/,
        function(req, res, next){

            const requestedEJSPath = path.join(Config.getPathToPublicFolder(), req.params[0]) + ".ejs";

            fs.exists(requestedEJSPath, function(exists) {
                if (exists) {
                    fs.readFile(requestedEJSPath, 'utf-8', function(err, data) {
                        if(!err) {
                            const ejs = require('ejs');
                            res.send(ejs.render(data, { locals : res.locals} ));
                        }
                        else
                        {
                            res.status(500).render("/errors/500");
                        }
                    });
                }
                else
                {
                    //fallback to other routes
                    next();
                }
            });
        });

    callback(null);
};

module.exports.loadRoutes = loadRoutes;