const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Permissions = Object.create(require(Pathfinder.absPathInSrcFolder("/models/meta/permissions.js")).Permissions);
const Resource = Object.create(require(Pathfinder.absPathInSrcFolder("/models/resource.js")).Resource);
const QueryBasedRouter = Object.create(require(Pathfinder.absPathInSrcFolder("/utils/query_based_router.js")).QueryBasedRouter);
let RecommendationUtils = require(Pathfinder.absPathInSrcFolder("/utils/recommendation.js")).RecommendationUtils;

//middlewares
const sendResponse = require(Pathfinder.absPathInSrcFolder("/bootup/middleware/send_response.js")).sendResponse;

//app's own requires
const index = require(Pathfinder.absPathInSrcFolder("/controllers/index"));
const users = require(Pathfinder.absPathInSrcFolder("/controllers/users"));
const vertexes = require(Pathfinder.absPathInSrcFolder("/controllers/vertexes"));
const admin = require(Pathfinder.absPathInSrcFolder("/controllers/admin"));
const projects = require(Pathfinder.absPathInSrcFolder("/controllers/projects"));
const files = require(Pathfinder.absPathInSrcFolder("/controllers/files"));
const records = require(Pathfinder.absPathInSrcFolder("/controllers/records"));
const interactions = require(Pathfinder.absPathInSrcFolder("/controllers/interactions"));
const descriptors = require(Pathfinder.absPathInSrcFolder("/controllers/descriptors"));
const evaluation = require(Pathfinder.absPathInSrcFolder("/controllers/evaluation"));
const ontologies = require(Pathfinder.absPathInSrcFolder("/controllers/ontologies"));
const research_domains = require(Pathfinder.absPathInSrcFolder("/controllers/research_domains"));
const repo_bookmarks = require(Pathfinder.absPathInSrcFolder("/controllers/repo_bookmarks"));
const datasets = require(Pathfinder.absPathInSrcFolder("/controllers/datasets"));
const posts = require(Pathfinder.absPathInSrcFolder("/controllers/posts"));
const timeline = require(Pathfinder.absPathInSrcFolder("/controllers/timeline"));
const notifications = require(Pathfinder.absPathInSrcFolder("/controllers/notifications"));

let recommendation;

const recommendation_mode = RecommendationUtils.getActiveRecommender();

if(recommendation_mode === "dendro_recommender")
{
    recommendation = require(Pathfinder.absPathInSrcFolder("/controllers/dr_recommendation"));
}
else if(recommendation_mode === "standalone")
{
    recommendation = require(Pathfinder.absPathInSrcFolder("/controllers/standalone_recommendation"));
}
else if(recommendation_mode === "project_descriptors")
{
    recommendation = require(Pathfinder.absPathInSrcFolder("/controllers/project_descriptors_recommendation"));
}
else if(recommendation_mode === "none")
{
    recommendation = require(Pathfinder.absPathInSrcFolder("/controllers/no_recommendation"));
}

const auth = require(Pathfinder.absPathInSrcFolder("/controllers/auth"));
const auth_orcid = require(Pathfinder.absPathInSrcFolder("/controllers/auth_orcid"));

const express = require('express'),
    domain = require('domain'),
    passport = require('passport'),
    flash = require("connect-flash"),
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
    /*const regex = "^/r/"+resourceType+"/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";
    return new RegExp(regex);*/
    return Resource.getResourceRegex(resourceType);
};

const extractUriFromRequest = function (req, res, next) {
    const matches = req.path.match(/^\/r\/([^\/]+)\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/);
    if(matches && matches.length === 2) {
        req.params.requestedResourceUri = matches[0];
    }

    return next(null, req, res);
};

const loadRoutes = function(app, callback)
{
    app.get('/', index.index);

    app.get('/analytics_tracking_code', index.analytics_tracking_code);

    //nodes
    app.get('/vertexes', async.apply(Permissions.require, [Permissions.settings.role.in_system.admin]), vertexes.all);
    app.get('/vertexes/random', async.apply(Permissions.require, [Permissions.settings.role.in_system.admin]), vertexes.random);
    app.get('/vertexes/show', async.apply(Permissions.require, [Permissions.settings.role.in_system.admin]), vertexes.show);

    //search
    app.get('/search', vertexes.search);

    //admin area
    app.get('/admin', async.apply(Permissions.require, [Permissions.settings.role.in_system.admin]), admin.home);
    app.get('/admin/reindex', async.apply(Permissions.require, [Permissions.settings.role.in_system.admin]), admin.reindex);
    app.get('/admin/reload', async.apply(Permissions.require, [Permissions.settings.role.in_system.admin]), admin.reload);

    //low-level sparql endpoint
    //TODO
    //app.get('/sparql', async.apply(Permissions.require, [Permissions.settings.role.in_system.admin]), sparql.show);

    //authentication

    if(Config.authentication.default.enabled)
    {
        const LocalStrategy = require('passport-local').Strategy;

        passport.use(new LocalStrategy({
                usernameField: 'username',
                passwordField: 'password'
            },
            function(username, password, done) {
                const User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;
                const Administrator = require(Pathfinder.absPathInSrcFolder("/models/administrator.js")).Administrator;
                User.findByUsername(username, function (err, user) {
                    if(isNull(err))
                    {
                        if(!isNull(user))
                        {
                            const bcrypt = require('bcryptjs');
                            bcrypt.hash(password, user.ddr.salt, function(err, hashedPassword) {
                                if (user.ddr.password === hashedPassword) {
                                    Administrator.findByUri(user.uri, function (err, adminUser) {
                                        if (isNull(err)) {
                                            if(!isNull(adminUser))
                                            {
                                                return done(
                                                    err,
                                                    adminUser,
                                                    {
                                                        isAdmin : true
                                                    });
                                            }
                                            else
                                            {
                                                return done(
                                                    err,
                                                    user,
                                                    {
                                                        isAdmin : false
                                                    });
                                            }
                                        }
                                        else {
                                            console.error(err.stack);
                                            return done("Unable to check for admin user when authenticating with username " + username + " calculating password hash.", null);
                                        }
                                    });
                                }
                                else {
                                    return done("Invalid username/password combination.", null);
                                }
                            });
                        }
                        else
                        {
                            return done("There is no user with username " + username + " registered in this system.", null);
                        }
                    }
                    else
                    {
                        console.error(err.stack);
                        return done("Unknown error during authentication, fetching user with username " + username, null);
                    }
                });
            })
        );

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
                const User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;
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
            req.passport.authenticate('orcid', auth_orcid.login(req, res, next));
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
    app.get('/ontologies/autocomplete', async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), ontologies.ontologies_autocomplete);

    app.get(
        [
            getNonHumanReadableRouteRegex("ontology"),
            '/ontologies/show/:prefix'
        ],
        extractUriFromRequest,
        async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), ontologies.show);

    app.post('/ontologies/edit', async.apply(Permissions.require, [Permissions.settings.role.in_system.admin]), ontologies.edit);

    //descriptors
    app.get('/descriptors', function(req, res, next){

        const authenticatedUserPermissions = [
            Permissions.settings.role.in_system.user
        ];

        const queryBasedRoutes = {
            // route : "/descriptors?from_ontology=<<<uri>>>
            get: [
                //from_ontology
                {
                    queryKeys: ['from_ontology'],
                    handler: descriptors.from_ontology,
                    permissions: authenticatedUserPermissions,
                    authentication_error: "Permission denied : You cannot access the list of descriptors of this ontology because you are not authenticated in the system."
                }
            ]
        };

        QueryBasedRouter.applyRoutes(queryBasedRoutes,req, res, next);
    });

    //research domains

    app.get('/research_domains/autocomplete', async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), research_domains.autocomplete);
    app.get('/research_domains', async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), research_domains.all);
    app.post('/research_domains', async.apply(Permissions.require, [Permissions.settings.role.in_system.admin]), research_domains.edit);
    
    app.delete([
            getNonHumanReadableRouteRegex("research_domain"),
            '/research_domains/:uri',
        ],
        extractUriFromRequest,
        async.apply(Permissions.require, [Permissions.settings.role.in_system.admin]), research_domains.delete);

    //  registration and login
    app.get('/register', auth.register);
    app.post('/register', auth.register);
    app.get('/logout', auth.logout);

    //people listing
    app.get('/users', users.all);
    app.get('/username_exists', users.username_exists);
    app.get('/users/loggedUser', users.getLoggedUser);

    app.get([
        getNonHumanReadableRouteRegex("user"),
        '/user/:username'
    ],
    extractUriFromRequest,
    function(req,res, next)
    {
        const processRequest = function(resourceUri){
            req.params.requestedResourceUri = resourceUri;
            const queryBasedRoutes = {
                get: [
                    {
                        queryKeys: ['avatar'],
                        handler: users.get_avatar,
                        permissions: [],
                        authentication_error: "Permission denied : cannot get the avatar of a user because you do not have permissions to do so."
                    },
                    {
                        queryKeys: [],
                        handler: users.show,
                        permissions: [Permissions.settings.role.in_system.user],
                        authentication_error: "Permission denied : cannot get information of the user because you are not logged in."
                    },
                ]
            };

            QueryBasedRouter.applyRoutes(queryBasedRoutes, req, res, next);
        };

        processRequest(req.params.requestedResourceUri);
    });

    app.post('/user/edit', async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), users.edit);
    app.post('/user_avatar', async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), users.upload_avatar);

    app.all('/reset_password', users.reset_password);
    app.all('/set_new_password', users.set_new_password);

    app.get('/me', async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), users.me);

    //projects
    app.get('/projects', projects.all);
    app.get('/projects/my', async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), projects.my);
    app.get('/projects/new', async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), projects.new);
    app.post('/projects/new', async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), projects.new);

    app.get('/projects/import', async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), projects.import);
    app.post('/projects/import', async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), projects.import);

    //external repository bookmarks
    app.get('/external_repositories/types', async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), repo_bookmarks.repository_types);
    app.get('/external_repositories/my', async.apply(Permissions.require, [Permissions.settings.role.in_system.user ]), repo_bookmarks.my);
    app.get('/external_repositories', async.apply(Permissions.require, [Permissions.settings.role.in_system.admin]), repo_bookmarks.all);
    app.post('/external_repositories/sword_collections', async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), datasets.sword_collections);
    app.post('/external_repositories/new', async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), repo_bookmarks.new);

    app.get([
            getNonHumanReadableRouteRegex("archived_resource"),
        ],
        extractUriFromRequest,
        records.show_version
    );

    app.delete([
            getNonHumanReadableRouteRegex("external_repository"),
            '/external_repository/:username/:title'
        ],
        extractUriFromRequest,
        async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), repo_bookmarks.delete);

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
                    Permissions.settings.privacy.of_project.public,
                    Permissions.settings.privacy.of_project.metadata_only,
                    Permissions.settings.role.in_project.contributor,
                    Permissions.settings.role.in_project.creator
                ];

                const modificationPermissions = [
                    Permissions.settings.role.in_project.contributor,
                    Permissions.settings.role.in_project.creator
                ];

                const administrationPermissions = [
                    Permissions.settings.role.in_project.creator
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
                            authentication_error: "Permission denied : cannot get recommendation ontologies because you do not have permissions to access it."
                        },
                        //show versions of resources
                        {
                            queryKeys: ['version'],
                            handler: records.show_version,
                            permissions: defaultPermissionsInProjectRoot,
                            authentication_error: "Permission denied : cannot get versions of this project because you do not have permissions to access it."
                        },
                        //auto completing descriptors
                        {
                            queryKeys: ['descriptors_autocomplete'],
                            handler: descriptors.descriptors_autocomplete,
                            permissions: defaultPermissionsInProjectRoot,
                            authentication_error: "Permission denied : cannot get descriptor autocompletions in this project because you do not have permissions to access it."

                        },
                        //auto completing ontologies
                        {
                            queryKeys: ['ontology_autocomplete'],
                            handler: ontologies.ontologies_autocomplete,
                            permissions: defaultPermissionsInProjectRoot,
                            authentication_error: "Permission denied : cannot get ontology autocompletions in this resource because you do not have permissions to access it."
                        },
                        //auto completing users
                        {
                            queryKeys: ['user_autocomplete'],
                            handler: users.users_autocomplete,
                            permissions: defaultPermissionsInProjectRoot,
                            authentication_error: "Permission denied : cannot get user autocompletions in this resource because you do not have permissions to access it."
                        },
                        //thumb nails
                        {
                            queryKeys: ['thumbnail'],
                            handler: files.thumbnail,
                            permissions: defaultPermissionsInProjectRoot,
                            authentication_error: "Permission denied : cannot get thumbnail for this project because you do not have permissions to access it."
                        },
                        {
                            queryKeys: ['get_contributors'],
                            handler: projects.get_contributors,
                            permissions: defaultPermissionsInProjectRoot,
                            authentication_error: "Permission denied : cannot get contributors for this project because you do not have permissions to access it."
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
                            authentication_error: "Permission denied : cannot get metadata for this project because you do not have permissions to access it."
                        },
                        //metadata deep
                        {
                            queryKeys: ['metadata', 'deep'],
                            handler: projects.show,
                            permissions: defaultPermissionsInProjectRoot,
                            authentication_error: "Permission denied : cannot get metadata (recursive) for this project because you do not have permissions to access it."
                        },
                        //request access
                        {
                            queryKeys: ['request_access'],
                            handler: projects.requestAccess,
                            permissions: [Permissions.settings.role.in_system.user],
                            authentication_error: "Permission denied : cannot request access to this project."
                        },
                        //descriptors with annotations
                        {
                            queryKeys: ['descriptors_from_ontology'],
                            handler: descriptors.from_ontology_in_project,
                            permissions: modificationPermissions,
                            authentication_error: "Permission denied : cannot fetch descriptors from ontology in this project because you do not have permissions to access resources inside it."
                        },
                        //auto completing descriptors
                        {
                            queryKeys: ['descriptors_autocomplete'],
                            handler: descriptors.descriptors_autocomplete,
                            permissions: defaultPermissionsInProjectRoot,
                            authentication_error: "Permission denied : cannot get descriptor autocompletions in this project because you do not have permissions to access it."

                        },
                        {
                           queryKeys : ['bagit'],
                           handler : projects.bagit,
                           permissions : [Permissions.settings.privacy.of_project.public, Permissions.settings.role.in_project.contributor, Permissions.settings.role.in_project.creator],
                           authentication_error : "Permission denied : cannot backup this project because you do not have permissions to access it."
                        },
                        //default case
                        {
                            queryKeys: [],
                            handler: projects.show,
                            permissions: defaultPermissionsInProjectRoot,
                            authentication_error: "Permission denied : cannot show the project because you do not have permissions to access it."
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
                            queryKeys: ['calculate_ckan_repository_diffs'],
                            handler: datasets.calculate_ckan_repository_diffs,
                            permissions: modificationPermissions,
                            authentication_error: "Permission denied : cannot calculate ckan repository diffs because you do not have permissions to edit this project."
                        },
                        {
                            queryKeys: ['request_access'],
                            handler: projects.requestAccess,
                            permissions: [Permissions.settings.role.in_system.user],
                            authentication_error: "Permission denied : cannot request access to this project."
                        },
                        {
                            queryKeys: ['cut'],
                            handler: files.cut,
                            permissions: modificationPermissions,
                            authentication_error: "Permission denied : cannot cut resources into this folder because you do not have permissions to edit resources inside this project."
                        },
                        {
                            queryKeys: ['copy'],
                            handler: files.copy,
                            permissions: modificationPermissions,
                            authentication_error: "Permission denied : cannot paste resources into this folder because you do not have permissions to edit resources inside this project."
                        }
                    ],
                    all:
                    [
                         //uploads
                         {
                             queryKeys: ['upload'],
                             handler: files.upload,
                             permissions: modificationPermissions,
                             authentication_error: "Permission denied : cannot upload to this project because you do not have permissions to modify it."
                         },
                         //delete projects
                         {
                             queryKeys: ['delete'],
                             handler: projects.delete,
                             permissions: administrationPermissions,
                             authentication_error: "Permission denied : cannot delete project because you do not have permissions to administer this project."
                         }

                    ]
                };

                QueryBasedRouter.applyRoutes(queryBasedRoutes, req, res, next, true);
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
                    Permissions.settings.privacy.of_owner_project.public,
                    Permissions.settings.role.in_owner_project.contributor,
                    Permissions.settings.role.in_owner_project.creator,
                ];

                const modificationPermissionsBranch = [
                    Permissions.settings.role.in_owner_project.contributor,
                    Permissions.settings.role.in_owner_project.creator
                ];

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
                            authentication_error: "Permission denied : cannot get project stats because you do not have permissions to access resources inside this project."
                        },
                        //recommendation ontologies
                        {
                            queryKeys: ['recommendation_ontologies'],
                            handler: ontologies.get_recommendation_ontologies,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot get recommendation ontologies because you do not have permissions to access resources inside this project."
                        },
                        //show versions of resources
                        {
                            queryKeys: ['version'],
                            handler: records.show_version,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot get versions of this resource because you do not have permissions to access resources inside this project."
                        },
                        //auto completing descriptors
                        {
                            queryKeys: ['descriptor_autocomplete'],
                            handler: descriptors.descriptors_autocomplete,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot get descriptor autocompletions in this resource because you do not have permissions to access resources inside this project."
                        },
                        //auto completing ontologies
                        {
                            queryKeys: ['ontology_autocomplete'],
                            handler: ontologies.ontologies_autocomplete,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot get ontology autocompletions in this resource because you do not have permissions to access resources inside this project."
                        },
                        //thumb nails
                        {
                            queryKeys: ['thumbnail'],
                            handler: files.thumbnail,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot get thumbnail for this resource because you do not have permissions to access resources inside this project."
                        },
                        //metadata
                        {
                            queryKeys: ['metadata'],
                            handler: records.show,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot get metadata for this resource because you do not have permissions to access resources inside this project."
                        },
                        //metadata deep
                        {
                            queryKeys: ['metadata', 'deep'],
                            handler: records.show_deep,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot get metadata (recursive) for this resource because you do not have permissions to access resources inside this project."
                        },
                        //parent metadata
                        {
                            queryKeys: ['parent_metadata'],
                            handler: records.show_parent,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot get parent metadata for this resource because you do not have permissions to access resources inside this project."
                        },
                        //change_log
                        {
                            queryKeys: ['change_log'],
                            handler: projects.change_log,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot get the change log of this resource because you do not have permissions to access resources inside this project."
                        },
                        //recommendation_ontologies
                        {
                            queryKeys: ['recommendation_ontologies'],
                            handler: ontologies.get_recommendation_ontologies,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot get the recommended ontologies for this resource because you do not have permissions to access resources inside this project."
                        },
                        //get project root
                        {
                            queryKeys: ['owner_project'],
                            handler: files.owner_project,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot retrieve the owner project of this resource because you do not have permissions to access that project."
                        },
                        //serve files
                        {
                            queryKeys: ['serve'],
                            handler: files.serve,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot serve this file because you do not have permissions to access resources inside this project."
                        },
                        //serve files in base64
                        {
                            queryKeys: ['serve_base64'],
                            handler: files.serve_base64,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot serve this file (base64) because you do not have permissions to access resources inside this project."
                        },
                        //serve files serialized
                        {
                            queryKeys: ['data'],
                            handler: files.data,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot serve serialized data for this resource because you do not have permissions to access resources inside this project."
                        },
                        //metadata_evaluation
                        {
                            queryKeys: ['metadata_evaluation'],
                            handler: evaluation.metadata_evaluation,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot calculate metadata evaluation for this resource because you do not have permissions to access resources inside this project."
                        },
                        //descriptors with annotations
                        {
                            queryKeys: ['descriptors_from_ontology'],
                            handler: descriptors.from_ontology_in_project,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot fetch descriptors from ontology in this project because you do not have permissions to access resources inside it."
                        },
                        //default case
                        {
                            queryKeys: [],
                            handler: projects.show,
                            permissions: defaultPermissionsInProjectBranch,
                            authentication_error: "Permission denied : cannot show the resource because you do not have permissions to access the project that contains this resource."
                        }
                    ],
                    post: [
                        {
                            queryKeys: ['update_metadata'],
                            handler: records.update,
                            permissions: modificationPermissionsBranch,
                            authentication_error: "Permission denied : cannot update the resource metadata because you do not have permissions to edit resources inside this project."
                        },
                        {
                            queryKeys: ['restore_metadata_version'],
                            handler: records.restore_metadata_version,
                            permissions: modificationPermissionsBranch,
                            authentication_error: "Permission denied : cannot restore the resource metadata because you do not have permissions to edit resources inside this project."
                        },
                        {
                            queryKeys: ['register_interaction'],
                            handler: interactions.register,
                            permissions: modificationPermissionsBranch,
                            authentication_error: "Permission denied : cannot register the interaction because you do not have permissions to edit resources inside this project."
                        },
                        {
                            queryKeys: ['remove_recommendation_ontology'],
                            handler: interactions.reject_ontology_from_quick_list,
                            permissions: modificationPermissionsBranch,
                            authentication_error: "Permission denied : cannot remove the recommendation ontology interaction because you do not have permissions to edit resources inside this project."
                        },
                        {
                            queryKeys: ['mkdir'],
                            handler: files.mkdir,
                            permissions: modificationPermissionsBranch,
                            authentication_error: "Permission denied : cannot create new folder because you do not have permissions to edit resources inside this project."
                        },
                        {
                            queryKeys: ['restore'],
                            handler: files.restore,
                            permissions: modificationPermissionsBranch,
                            authentication_error: "Permission denied : cannot restore previous version of resource because you do not have permissions to edit resources inside this project."
                        },
                        {
                            queryKeys: ['undelete'],
                            handler: files.undelete,
                            permissions: modificationPermissionsBranch,
                            authentication_error: "Permission denied : cannot undelete resource because you do not have permissions to edit resources inside this project."
                        },
                        {
                            queryKeys: ['export_to_repository'],
                            handler: datasets.export_to_repository,
                            permissions: modificationPermissionsBranch,
                            authentication_error: "Permission denied : cannot export resource because you do not have permissions to edit resources inside this project."
                        },
                        {
                            queryKeys: ['rename'],
                            handler: files.rename,
                            permissions: modificationPermissionsBranch,
                            authentication_error: "Permission denied : cannot rename resource because you do not have permissions to edit resources inside this project."
                        },
                        {
                            queryKeys: ['cut'],
                            handler: files.cut,
                            permissions: modificationPermissionsBranch,
                            authentication_error: "Permission denied : cannot move resources because you do not have permissions to edit resources inside this project."
                        },
                        {
                            queryKeys: ['copy'],
                            handler: files.copy,
                            permissions: modificationPermissionsBranch,
                            authentication_error: "Permission denied : cannot copy resources because you do not have permissions to edit resources inside this project."
                        },
                        {
                            queryKeys: ['calculate_ckan_repository_diffs'],
                            handler: datasets.calculate_ckan_repository_diffs,
                            permissions: modificationPermissionsBranch,
                            authentication_error: "Permission denied : cannot calculate ckan repository diffs because you do not have permissions to edit this project."
                        }
                    ],
                    delete: [
                        {
                            queryKeys: ['really_delete'],
                            handler: files.rm,
                            permissions: modificationPermissionsBranch,
                            authentication_error: "Permission denied : cannot delete resource because you do not have permissions to edit resources inside this project."
                        },
                        {
                            queryKeys: [],
                            handler: files.rm,
                            permissions: modificationPermissionsBranch,
                            authentication_error: "Permission denied : cannot delete resource because you do not have permissions to edit resources inside this project."
                        }
                    ],
                    all: [
                        //uploads
                        {
                            queryKeys: ['upload'],
                            handler: files.upload,
                            permissions: modificationPermissionsBranch,
                            authentication_error: "Permission denied : cannot upload resource because you do not have permissions to edit resources inside this project."
                        }
                    ]
                };

                QueryBasedRouter.applyRoutes(queryBasedRoutes, req, res, next, true);
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
    const defaultSocialDendroPostPermissions = [
        Permissions.settings.role.in_post_s_project.creator,
        Permissions.settings.role.in_post_s_project.contributor
    ];
    app.get('/socialDendro/my', async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), timeline.my);
    app.get('/posts/all', async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), posts.all);
    app.get('/posts/post', function (req, res, next) {
        const processRequest = function(postUri){
            req.query.postID = postUri;
            req.params.requestedResourceUri = postUri;
            const queryBasedRoutes = {
                get: [
                    {
                        queryKeys: ['postID'],
                        handler: posts.getPost_controller,
                        permissions: defaultSocialDendroPostPermissions,
                        authentication_error: "Permission denied : You are not a contributor or creator of the project to which this post belongs to."
                    },
                ]
            };

            QueryBasedRouter.applyRoutes(queryBasedRoutes, req, res, next);
        };

        processRequest(req.query.postID);
    });

    const defaultSocialDendroArrayOfPostsPermissions = [
        Permissions.settings.role.in_array_of_posts_project.creator,
        Permissions.settings.role.in_array_of_posts_project.contributor
    ];
    app.get('/posts/posts', function (req, res, next) {
        const processRequest = function(postsQueryInfo){
            req.query.postsQueryInfo = postsQueryInfo;
            const queryBasedRoutes = {
                get: [
                    {
                        queryKeys: ['postsQueryInfo'],
                        handler: posts.getPosts_controller,
                        permissions: defaultSocialDendroArrayOfPostsPermissions,
                        authentication_error: "Permission denied : You are not a contributor or creator of the project to which the posts belongs to."
                    },
                ]
            };

            QueryBasedRouter.applyRoutes(queryBasedRoutes, req, res, next);
        };

        let postQueryInfo;
        try {
            postQueryInfo = JSON.parse(req.query.postsQueryInfo);
        }
        catch(err) {
            postQueryInfo = req.query.postsQueryInfo
        }
        processRequest(postQueryInfo);
    });

    app.post('/posts/new', function (req, res, next) {
        const processRequest = function(postContent, postTitle, postProjectUri){
            req.body.newPostContent = postContent;
            req.body.newPostTitle = postTitle;
            req.body.newPostProjectUri = postProjectUri;
            req.params.requestedResourceUri = postProjectUri;
            const queryBasedRoutes = {
                post: [
                    {
                        queryKeys: [],
                        handler: posts.new,
                        permissions: [Permissions.settings.role.in_project.contributor, Permissions.settings.role.in_project.creator],
                        authentication_error: "Permission denied : You are not a contributor or creator of the project where you want to create the manual post"
                    },
                ]
            };

            QueryBasedRouter.applyRoutes(queryBasedRoutes, req, res, next);
        };

        processRequest(req.body.newPostContent, req.body.newPostTitle, req.body.newPostProjectUri);
    });

    app.post('/posts/like', function (req, res, next) {
        const processRequest = function(postURI){
            req.body.postID = postURI;
            req.params.requestedResourceUri = postURI;
            const queryBasedRoutes = {
                post: [
                    {
                        queryKeys: [],
                        handler: posts.like,
                        permissions: defaultSocialDendroPostPermissions,
                        authentication_error: "Permission denied : You are not a contributor or creator of the project to which the post you want to like belongs to."
                    },
                ]
            };

            QueryBasedRouter.applyRoutes(queryBasedRoutes, req, res, next);
        };

        processRequest(req.body.postID);
    });

    app.get('/posts/post/likes', function (req, res, next) {
        const processRequest = function(postURI){
            req.query.postURI = postURI;
            req.params.requestedResourceUri = postURI;
            const queryBasedRoutes = {
                get: [
                    {
                        queryKeys: ['postURI'],
                        handler: posts.postLikesInfo,
                        permissions: defaultSocialDendroPostPermissions,
                        authentication_error: "Permission denied : You are not a contributor or creator of the project to which the post you want to obtain likes information belongs to."
                    },
                ]
            };

            QueryBasedRouter.applyRoutes(queryBasedRoutes, req, res, next);
        };
        processRequest(req.query.postURI);
    });

    app.post('/posts/comment', function (req, res, next) {
        const processRequest = function(postURI, commentMsg){
            req.body.postID = postURI;
            req.body.commentMsg = commentMsg;
            req.params.requestedResourceUri = postURI;
            const queryBasedRoutes = {
                post: [
                    {
                        queryKeys: [],
                        handler: posts.comment,
                        permissions: defaultSocialDendroPostPermissions,
                        authentication_error: "Permission denied : You are not a contributor or creator of the project to which the post you want to comment belongs to."
                    },
                ]
            };

            QueryBasedRouter.applyRoutes(queryBasedRoutes, req, res, next);
        };
        processRequest(req.body.postID, req.body.commentMsg);
    });

    app.get('/posts/comments', function (req, res, next) {
        const processRequest = function(postURI){
            req.query.postID = postURI;
            req.params.requestedResourceUri = postURI;
            const queryBasedRoutes = {
                get: [
                    {
                        queryKeys: ['postID'],
                        handler: posts.getPostComments,
                        permissions: defaultSocialDendroPostPermissions,
                        authentication_error: "Permission denied : You are not a contributor or creator of the project to which the post you want to obtain comments information belongs to."
                    },
                ]
            };

            QueryBasedRouter.applyRoutes(queryBasedRoutes, req, res, next);
        };
        processRequest(req.query.postID);
    });

    app.post('/posts/share', function (req, res, next) {
        const processRequest = function(postURI, shareMsg){
            req.body.postID = postURI;
            req.body.shareMsg = shareMsg;
            req.params.requestedResourceUri = postURI;
            const queryBasedRoutes = {
                post: [
                    {
                        queryKeys: [],
                        handler: posts.share,
                        permissions: defaultSocialDendroPostPermissions,
                        authentication_error: "Permission denied : You are not a contributor or creator of the project to which the post you want to share belongs to."
                    },
                ]
            };

            QueryBasedRouter.applyRoutes(queryBasedRoutes, req, res, next);
        };
        processRequest(req.body.postID, req.body.shareMsg);
    });

    app.get('/posts/shares', function (req, res, next) {
        const processRequest = function(postURI){
            req.query.postID = postURI;
            req.params.requestedResourceUri = postURI;
            const queryBasedRoutes = {
                get: [
                    {
                        queryKeys: ['postID'],
                        handler: posts.getPostShares,
                        permissions: defaultSocialDendroPostPermissions,
                        authentication_error: "Permission denied : You are not a contributor or creator of the project to which the post you want to obtain shares information belongs to."
                    },
                ]
            };

            QueryBasedRouter.applyRoutes(queryBasedRoutes, req, res, next);
        };
        processRequest(req.query.postID);
    });

    app.get('/posts/count', async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), posts.numPostsDatabase);

    app.get([
            getNonHumanReadableRouteRegex("post"),
            '/posts/:uri'
        ],
        extractUriFromRequest, function (req, res, next) {
            const processRequest = function(){
                const queryBasedRoutes = {
                    get: [
                        {
                            queryKeys: [],
                            handler: posts.post,
                            permissions: defaultSocialDendroPostPermissions,
                            authentication_error: "Permission denied : You are not a contributor or creator of the project to which the post you want to obtain information belongs to."
                        },
                    ]
                };

                QueryBasedRouter.applyRoutes(queryBasedRoutes, req, res, next);
            };
            processRequest();
        });

    app.get([
            getNonHumanReadableRouteRegex("share"),
            '/shares/:uri'
        ],
        extractUriFromRequest, function (req, res, next) {
            const processRequest = function(){
                const queryBasedRoutes = {
                    get: [
                        {
                            queryKeys: [],
                            handler: posts.getShare,
                            permissions: defaultSocialDendroPostPermissions,
                            authentication_error: "Permission denied : You are not a contributor or creator of the project to which the Share you want to obtain information belongs to."
                        },
                    ]
                };

                QueryBasedRouter.applyRoutes(queryBasedRoutes, req, res, next);
            };
            processRequest();
        });

    //notifications
    app.get('/notifications/all', async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), notifications.get_unread_user_notifications);

    const defaultNotificationsPermissions = [
        Permissions.settings.role.in_notification_s_resource.author
    ];
    app.get('/notifications/notification', function (req, res, next) {
        const processRequest = function(notificationUri){
            req.query.notificationUri = notificationUri;
            req.params.requestedResourceUri = notificationUri;
            const queryBasedRoutes = {
                get: [
                    {
                        queryKeys: ['notificationUri'],
                        handler: notifications.get_notification_info,
                        permissions: defaultNotificationsPermissions,
                        authentication_error: "Permission denied : You are not the author of the resource that this notification points to."
                    },
                ]
            };

            QueryBasedRouter.applyRoutes(queryBasedRoutes, req, res, next);
        };
        processRequest(req.query.notificationUri);
    });

    app.delete('/notifications/notification', function (req, res, next) {
        const processRequest = function(notificationUri){
            req.query.notificationUri = notificationUri;
            req.params.requestedResourceUri = notificationUri;
            const queryBasedRoutes = {
                delete: [
                    {
                        queryKeys: ['notificationUri'],
                        handler: notifications.delete,
                        permissions: defaultNotificationsPermissions,
                        authentication_error: "Permission denied : You are not the author of the resource that this notification points to."
                    },
                ]
            };

            QueryBasedRouter.applyRoutes(queryBasedRoutes, req, res, next);
        };
        processRequest(req.query.notificationUri);
    });

    //interactions
    app.post("/interactions/accept_descriptor_from_quick_list", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.accept_descriptor_from_quick_list);
    app.post("/interactions/accept_descriptor_from_quick_list_while_it_was_a_project_favorite", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.accept_descriptor_from_quick_list_while_it_was_a_project_favorite);
    app.post("/interactions/accept_descriptor_from_quick_list_while_it_was_a_user_favorite", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.accept_descriptor_from_quick_list_while_it_was_a_user_favorite);
    app.post("/interactions/accept_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.accept_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite);

    app.post("/interactions/accept_descriptor_from_manual_list", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.accept_descriptor_from_manual_list);
    app.post("/interactions/accept_descriptor_from_manual_list_while_it_was_a_project_favorite", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.accept_descriptor_from_manual_list_while_it_was_a_project_favorite);
    app.post("/interactions/accept_descriptor_from_manual_list_while_it_was_a_user_favorite", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.accept_descriptor_from_manual_list_while_it_was_a_user_favorite);
    app.post("/interactions/accept_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.accept_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite);

    app.post("/interactions/hide_descriptor_from_quick_list_for_project", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.hide_descriptor_from_quick_list_for_project);
    app.post("/interactions/unhide_descriptor_from_quick_list_for_project", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.unhide_descriptor_from_quick_list_for_project);
    app.post("/interactions/hide_descriptor_from_quick_list_for_user", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.hide_descriptor_from_quick_list_for_user);
    app.post("/interactions/unhide_descriptor_from_quick_list_for_user", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.unhide_descriptor_from_quick_list_for_user);
    app.post("/interactions/favorite_descriptor_from_quick_list_for_project", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.favorite_descriptor_from_quick_list_for_project);
    app.post("/interactions/favorite_descriptor_from_quick_list_for_user", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.favorite_descriptor_from_quick_list_for_user);

    app.post("/interactions/unfavorite_descriptor_from_quick_list_for_user", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.unfavorite_descriptor_from_quick_list_for_user);
    app.post("/interactions/unfavorite_descriptor_from_quick_list_for_project", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.unfavorite_descriptor_from_quick_list_for_project);

    app.post("/interactions/accept_descriptor_from_autocomplete", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.accept_descriptor_from_autocomplete);
    app.post("/interactions/reject_ontology_from_quick_list", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.reject_ontology_from_quick_list);
    app.post("/interactions/select_ontology_manually", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.select_ontology_manually);
    app.post("/interactions/select_descriptor_from_manual_list", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.select_descriptor_manually);

    app.post("/interactions/accept_smart_descriptor_in_metadata_editor", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.accept_smart_descriptor_in_metadata_editor);
    app.post("/interactions/accept_favorite_descriptor_in_metadata_editor", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.accept_favorite_descriptor_in_metadata_editor);

    app.post("/interactions/delete_descriptor_in_metadata_editor", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.delete_descriptor_in_metadata_editor);

    app.post("/interactions/fill_in_descriptor_from_manual_list_in_metadata_editor", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.fill_in_descriptor_from_manual_list_in_metadata_editor);
    app.post("/interactions/fill_in_descriptor_from_manual_list_while_it_was_a_project_favorite", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.fill_in_descriptor_from_manual_list_while_it_was_a_project_favorite);
    app.post("/interactions/fill_in_descriptor_from_manual_list_while_it_was_a_user_favorite", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.fill_in_descriptor_from_manual_list_while_it_was_a_user_favorite);
    app.post("/interactions/fill_in_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.fill_in_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite);


    app.post("/interactions/fill_in_descriptor_from_quick_list_in_metadata_editor", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.fill_in_descriptor_from_quick_list_in_metadata_editor);
    app.post("/interactions/fill_in_descriptor_from_quick_list_while_it_was_a_project_favorite", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.fill_in_descriptor_from_quick_list_while_it_was_a_project_favorite);
    app.post("/interactions/fill_in_descriptor_from_quick_list_while_it_was_a_user_favorite", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.fill_in_descriptor_from_quick_list_while_it_was_a_user_favorite);
    app.post("/interactions/fill_in_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.fill_in_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite);

    app.post("/interactions/fill_in_inherited_descriptor", async.apply(Permissions.require, [Permissions.settings.role.in_system.user]), interactions.fill_in_inherited_descriptor);


    app.delete("/interactions/delete_all", async.apply(Permissions.require, [Permissions.settings.role.in_system.admin]), interactions.delete_all_interactions);

    //serve angular JS ejs-generated html partials
    app.get(/\/images\/icons\/extensions\/file_extension_([a-z0-9]+)\.png$/, files.extension_icon);

    //serve angular JS ejs-generated html partials
    app.get(/(\/app\/views\/.+)\.html$/,
        function(req, res, next){

            const requestedEJSPath = path.join(Pathfinder.getPathToPublicFolder(), req.params[0]) + ".ejs";

            fs.exists(requestedEJSPath, function(exists) {
                if (exists) {
                    fs.readFile(requestedEJSPath, 'utf-8', function(err, data) {
                        if(isNull(err)) {
                            const ejs = require('ejs');
                            res.send(ejs.render(data, { Config : Config } ));
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