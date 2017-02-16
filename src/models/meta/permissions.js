var Config = function() { return GLOBAL.Config; }();

var Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
var InformationElement = require(Config.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
var File = require(Config.absPathInSrcFolder("/models/directory_structure/file.js")).File;
var Folder = require(Config.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
var User = require(Config.absPathInSrcFolder("/models/user.js")).User;
var Project = require(Config.absPathInSrcFolder("/models/project.js")).Project;

var async = require('async');
var _ = require('underscore');

function Permissions (){}

Permissions.messages = {
    generic : {
        api : "Action not permitted. You are not logged into the system.",
        user : "Please log into the system."
    }
}

Permissions.types =
{
    system : "system",
    resource : "resource",
    project : "project"
};

Permissions.roles = {
    system : {
        admin : {
            type : Permissions.types.system,
            predicate : "rdf:type",
            object : "ddr:Administrator",
            error_message_user : "You are not authorized to perform this operation. You must be a Dendro administrator.",
            error_message_api : "Error detected. You are not authorized to perform this operation. You must be a Dendro administrator."
        },
        user : {
            type : Permissions.types.system,
            predicate : "rdf:type",
            object : "ddr:User",
            error_message_user : "You are not authorized to perform this operation. You must be signed into Dendro.",
            error_message_api : "Error detected. You are not authorized to perform this operation. You must be signed into Dendro."
        }
    },
    resource : {
        creator : {
            type : Permissions.types.resource,
            predicate : "dcterms:creator",
            error_message_user : "You are not authorized to perform this operation. You must be the creator of this resource.",
            error_message_api : "Unauthorized access. Must be signed on as the creator of this resource."
        },
        contributor : {
            type : Permissions.types.resource,
            predicate : "dcterms:contributor",
            error_message_user : "You are not authorized to perform this operation. You must be the contributor of this resource.",
            error_message_api : "Unauthorized access. Must be signed on as a contributor of this resource."
        }
    },
    project : {
        creator : {
            type : Permissions.types.project,
            predicate : "dcterms:creator",
            error_message_user : "Error trying to access a project or a file / folder within a project that you have not created.",
            error_message_api : "Unauthorized access. Must be signed on as a creator of this project or as a contributor of the project it belongs to."
        },
        contributor : {
            type : Permissions.types.project,
            predicate : "dcterms:contributor",
            error_message_user : "You are not a contributor of this project or of the project to which this resource belongs to.",
            error_message_api : "Unauthorized access. Must be signed on as a contributor of this project or as a contributor of the project it belongs to."
        }
    }
}

Permissions.acl =
{
    admin :
    {
        roles_required: [Permissions.roles.system.admin]
    },

    user :
    {
        roles_required: [Permissions.roles.system.user]
    },

    creator_or_contributor :
    {
        roles_required: [Permissions.roles.project.creator, Permissions.roles.project.contributor]
    },
    creator :
    {
        roles_required: [Permissions.roles.project.creator]
    }
};

Permissions.resource_access_levels = {
    public : {
        access_level_required : "public",
        error_message_user : "This is a public project.",
        error_message_api : "This is a public project."
    },
    private : {
        access_level_required : "private",
        error_message_user : "This is a private project, and neither data nor metadata can be accessed.",
        error_message_api : "Unauthorized Access. This is a private project, and neither data nor metadata can be accessed."
    },
    metadata_only :  {
        access_level_required : "metadata_only",
        error_message_user : "This is a project with only metadata access. Data metadata cannot be accessed.",
        error_message_api : "Unauthorized Access. This is a project with only metadata access. Data metadata cannot be accessed."
    }
}

Permissions.project =
{
    public :
    {
        roles_required: [Permissions.resource_access_levels.public]
    },

    private :
    {
        roles_required: [Permissions.resource_access_levels.private]
    },
    metadata_only :
    {
        privacy_types_required : ["metadata_only"]
    }
};

Permissions.sendResponse = function(allow_access, req, res, next, reasonsForAllowingOrDenying)
{
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(allow_access)
    {
        if(Config.debug.permissions.log_authorizations)
        {
            var user = "-> NO USER AUTHENTICATED <-";
            if(req.session.user)
            {
                user = req.session.user.uri;
            }

            console.log("[ALLOW-ACCESS] User " + user + " granted access to " + req.originalUrl + " .");
        }

        Permissions.addToReasons(req, reasonsForAllowingOrDenying, true);
        return next();
    }
    else
    {
        var messagesAPI = "";
        var messagesUser = "";

        req.permissions_management = {
            reasons_for_denying : reasonsForAllowingOrDenying
        };

        for(var i = 0; i < reasonsForAllowingOrDenying.length ; i++)
        {
            if(reasonsForAllowingOrDenying[i] instanceof Object)
            {
                var denyingReason = reasonsForAllowingOrDenying[i].role;

                messagesAPI = messagesAPI + denyingReason.error_message_api;
                messagesUser = messagesUser + denyingReason.error_message_user;

                if(i < reasonsForAllowingOrDenying.length - 1)
                {
                    messagesAPI = messagesAPI + " , ";
                    messagesUser = messagesUser + " , ";
                }
            }
            else if(typeof reasonsForAllowingOrDenying[i] == "string")
            {
                var denyingReason = reasonsForAllowingOrDenying[i];

                messagesAPI = messagesAPI + denyingReason;
                messagesUser = messagesUser + denyingReason;

                if(i < denyingReason.length - 1)
                {
                    messagesAPI = messagesAPI + " , ";
                    messagesUser = messagesUser + " , ";
                }
            }
        }

        if(Config.debug.permissions.log_authorizations)
        {
            var user = "-> NO USER AUTHENTICATED <-";
            if(req.session.user)
            {
                user = req.session.user.uri;
            }

            console.log("[DENY-ACCESS] User " + user + " denied access to " + req.originalUrl + " . Reasons: " + messagesUser);
        }

        if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
        {
            if(messagesAPI == "")
            {
                messagesAPI = Permissions.messages.generic.api;
            }

            return res.status(401).json(
                {
                    result : "error",
                    message : messagesAPI
                }
            );
        }
        else
        {
            if(messagesUser == "")
            {
                messagesUser = Permissions.messages.generic.user;
            }

            req.flash('error', messagesUser);

            if(req.session.user)
            {
                if(req.privacy)
                {
                    if(req.privacy === "metadata_only")
                    {
                        return res.redirect(req.originalUrl + '/request_access');
                    }
                    else if(req.privacy === "private")
                    {
                        return res.redirect("/");
                    }
                }
                else
                {
                    return res.redirect('/');
                }
            }
            else
            {
                return res.redirect('/login');
            }
        }
    }
};

var getOwnerProject = function(requestedResource, callback)
{
    Project.getOwnerProjectBasedOnUri(requestedResource, function(err, project){
        callback(err, project);
    });
};

var checkUsersRoleInSystem = function(req, res, next, user, role, callback)
{
    user.checkIfHasPredicateValue(role.predicate, role.object, function(err, result){
        callback(err, result);
    });
};

var checkUsersRoleInProject = function(req, res, next, user, role, project, callback)
{
    project.checkIfHasPredicateValue(role.predicate, user.uri, function(err, result){
        callback(err, result);
    });
};

var checkUsersRoleInResource = function(req, res, next, user, role, resource, callback)
{
    resource.checkIfHasPredicateValue(role.predicate, user.uri, function(err, result){
        callback(err, result);
    });
};

var checkPermissionsForRole = function(req, res, next, user, resource, role, callback)
{
    var async = require('async');
    user = new User(user);

    var rolesRequired = role.roles_required;

    async.map(rolesRequired,
        function (role, callback)
        {
            if(role.type == Permissions.types.system)
            {
                checkUsersRoleInSystem(req, res, next, user, role, function(err, hasRole){
                    callback(err, {authorized : hasRole, role : role});
                });
            }
            else if(role.type == Permissions.types.project)
            {
                getOwnerProject(resource, function(err, project){
                    if(!err)
                    {
                        if(project instanceof Project)
                        {
                            checkUsersRoleInProject(req, res, next, user, role, project, function(err, hasRole){
                                callback(err, {authorized : hasRole, role : role});
                            });
                        }
                        else
                        {
                            callback(null, null);
                        }
                    }
                    else
                    {
                        callback(err, null);
                    }
                });
            }
            else if(role.type == Permissions.types.resource)
            {
                checkUsersRoleInResource(req, res, next, user, role, function(err, hasRole){
                    callback(err, {authorized : hasRole, role : role});
                });
            }
        },
        function (err, results)
        {
            callback(err, results);
        }
    );
};

var checkPermissionsInAcl = function(req, res, next, user, resource, acl_entry, callback){
    if(user)
    {
        checkPermissionsForRole(req, res, next, user, resource, acl_entry, function(err, results){
            callback(err,results);
        });
    }
    else
    {
        callback(null,
            [{
                authorized : false,
                role : Permissions.roles.system.user
            }]
        );
    }
};

Permissions.addToReasons = function(req, reason, authorizing)
{
    if(req.permissions_management == null)
    {
        req.permissions_management = {};
    }

    if(authorizing)
    {
        req.permissions_management.reasons_for_authorizing = _.compact(_.flatten([].concat(req.permissions_management.reasons_for_authorizing).concat([reason])));
    }
    else
    {
        req.permissions_management.reasons_for_denying = _.compact(_.flatten([].concat(req.permissions_management.reasons_for_denying).concat([reason])));
    }

    return req;
}

Permissions.require = function(permissionsRequired, req, res, next)
{
    if(Config.debug.permissions.enable_permissions_system)
    {
        if(Config.debug.permissions.log_requests_and_permissions)
        {
            var rolesString = "";
            permissionsRequired.forEach(function(acl_entry){
                acl_entry.roles_required.forEach(function(role){
                    rolesString = rolesString + " " + role.predicate;
                    if(role.object != null)
                    {
                        rolesString = rolesString + " " + role.object;
                    }
                })
            });

            console.log("[REQUEST] : Checking for permissions "+ rolesString + " on request " + req.originalUrl);
        }

        var async = require('async');

        var user = req.session.user;

        //Global Administrators are God
        if(!req.session.isAdmin)
        {
            var resource = Config.baseUri + require('url').parse(req.url).pathname;

            async.map(permissionsRequired,
                async.apply(checkPermissionsInAcl, req, res, next, user, resource),
                function(err, results)
                {
                    var reasonsForDenying = [];

                    for(var i = 0; i < results.length; i++)
                    {
                        var methodResults = results[i];
                        methodResults = _.flatten(methodResults);
                        methodResults = _.compact(methodResults);

                        var reasonsForAuthorizing = _.filter(methodResults, function(result){return result.authorized});
                        req = Permissions.addToReasons(req, reasonsForAuthorizing, true);

                        reasonsForDenying = reasonsForDenying.concat(_.filter(methodResults, function(result){return !result.authorized}));
                        req = Permissions.addToReasons(req, reasonsForDenying, false);

                        if(req.permissions_management.reasons_for_authorizing.length > 0)
                        {
                            //Since user is involved in the project, the project will be seen the normal way
                            return Permissions.sendResponse(true, req, res, next, reasonsForAuthorizing);
                        }
                    }

                    if(req.permissions_management.reasons_for_denying.length > 0)
                    {
                        if (Config.debug.permissions.log_denials)
                        {
                            console.log("REASONS FOR DENYING");
                            console.log(reasonsForDenying);
                        }

                        return Permissions.sendResponse(false, req, res, next, reasonsForDenying);
                    }
                    else
                    {
                        //ommision case. No reasons to authorize nor to refuse access!
                        return Permissions.sendResponse(true, req, res, next, []);
                    }
                }
            );
        }
        else
        {
            return Permissions.sendResponse(true, req, res, next, [Permissions.roles.system.admin]);
        }
    }
    else
    {
        next();
    }
};

Permissions.project_access_override = function(projectPrivacyTypesAllowedToOverridePermissions, permissionsRequired, req, res, next)
{
    var projectHandle = req.params[0];                      //project handle
    var requestedProjectURI = Config.baseUri + "/project/" + projectHandle;

    Project.findByUri(requestedProjectURI, function(err, project){
        if(!err)
        {
            if(project != null)
            {
                var privacy = project.ddr.privacyStatus;

                for(var i = 0; i < projectPrivacyTypesAllowedToOverridePermissions.length; i++)
                {
                    var privacyType = projectPrivacyTypesAllowedToOverridePermissions[i].access_level_required;

                    if(privacy === privacyType)
                    {
                        req = Permissions.addToReasons(req, projectPrivacyTypesAllowedToOverridePermissions[i], true);
                    }
                }

                Permissions.require(permissionsRequired, req, res, next);
            }
            else
            {
                var reason_for_denying = "Project with uri" + requestedProjectURI + " does not exist.";
                return Permissions.sendResponse(false, req, res, next, [reason_for_denying]);
            }
        }
        else
        {
            var reason_for_denying = "Error accessing project: " + project;
            return Permissions.sendResponse(false, req, res, next, [reason_for_denying]);
        }
    });
};

exports.Permissions = Permissions;
