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

Permissions.types = {
    system : "system",
    resource : "resource",
    project : "project",
    project_privacy_status : "project_privacy_status"
};

Permissions.role = {
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

Permissions.project_privacy_status = {
    public : {
        type : Permissions.types.project_privacy_status,
        predicate : "ddr:privacyStatus",
        object : "public",
        error_message_user : "This is a public project.",
        error_message_api : "This is a public project."
    },
    private : {
        type : Permissions.types.project_privacy_status,
        predicate : "ddr:privacyStatus",
        object : "private",
        error_message_user : "This is a private project, and neither data nor metadata can be accessed.",
        error_message_api : "Unauthorized Access. This is a private project, and neither data nor metadata can be accessed."
    },
    metadata_only :  {
        type : Permissions.types.project_privacy_status,
        predicate : "ddr:privacyStatus",
        object : "metadata_only",
        error_message_user : "This is a project with only metadata access. Data metadata cannot be accessed.",
        error_message_api : "Unauthorized Access. This is a project with only metadata access. Data metadata cannot be accessed."
    }
}

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

var checkUsersRoleInSystem = function(req, user, role, callback)
{
    user.checkIfHasPredicateValue(role.predicate, role.object, function(err, result){
        callback(err, result);
    });
};

var checkUsersRoleInProject = function(req, user, role, project, callback)
{
    project.checkIfHasPredicateValue(role.predicate, user.uri, function(err, result){
        callback(err, result);
    });
};

var checkUsersRoleInResource = function(req, user, role, resource, callback)
{
    resource.checkIfHasPredicateValue(role.predicate, user.uri, function(err, result){
        callback(err, result);
    });
};

var checkPermissionsForRole = function(req, user, resource, role, callback)
{
    if(!(user instanceof User) && user instanceof Object)
        user = new User(user);

    if(role.type == Permissions.types.system)
    {
        checkUsersRoleInSystem(req, user, role, function(err, hasRole){
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
                    checkUsersRoleInProject(req, user, role, project, function(err, hasRole){
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
        checkUsersRoleInResource(req, user, role, resource, function(err, hasRole){
            callback(err, {authorized : hasRole, role : role});
        });
    }
};

var checkPermissionsForProject = function(req, permission, callback)
{
    var projectHandle = req.params[0];                      //project handle
    var requestedProjectURI = Config.baseUri + "/project/" + projectHandle;

    Project.findByUri(requestedProjectURI, function(err, project){
        if(!err)
        {
            if(project != null)
            {
                var privacy = project.ddr.privacyStatus;

                if(permission.object != null && privacy === permission.object)
                {
                    callback(null,
                        {
                            authorized : true,
                            role : Permissions.project_privacy_status[permission.object]
                        }
                    );
                }
                else
                {
                    callback(null,
                        {
                            authorized : false,
                            role : permission
                        }
                    );
                }
            }
            else
            {
                callback(null,
                    {
                        authorized : true,
                        role : ["Project with uri" + requestedProjectURI + " does not exist."]
                    }

                );
            }
        }
        else
        {
            callback(null,
                {
                    authorized: true,
                    role: ["Error accessing project: " + project]
                }
            );
        }
    });
}


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

Permissions.check = function(permissionsRequired, req, callback)
{
    //Global Administrators are God, so they dont go through any checks
    if(!req.session.isAdmin)
    {
        var resource = Config.baseUri + require('url').parse(req.url).pathname;
        var user = req.session.user;

        var checkPermissions = function(req, user, resource, permission, cb){
            if(permission.type == Permissions.types.system && user != null)
            {
                checkPermissionsForRole(req, user, resource, permission, function(err, results){
                    cb(err, results);
                });
            }
            else if(permission.type == Permissions.types.project && user != null)
            {
                checkPermissionsForRole(req, user, resource, permission, function(err, results){
                    cb(err, results);
                });
            }
            else if(permission.type == Permissions.types.resource && user != null)
            {
                checkPermissionsForRole(req, user, resource, permission, function(err, results){
                    cb(err, results);
                });
            }
            else if (permission.type == Permissions.types.project_privacy_status) {
                checkPermissionsForProject(req, permission, function (err, results) {
                    cb(err, results);
                });
            }
            else
            {
                cb(null,
                    {
                        authorized : false,
                        role : "Permission required is badly configured. Ask your administrator to review your Dendro server's configuration"
                    }
                );
            }
        };

        async.map(permissionsRequired,
            async.apply(checkPermissions, req, user, resource),
            function(err, results)
            {
                var reasonsForDenying = _.filter(results, function(result){
                    if(result != null)
                    {
                        return !result.authorized
                    }
                    else
                    {
                        return false;
                    }
                });

                req = Permissions.addToReasons(req, reasonsForDenying, false);

                var reasonsForAuthorizing = _.filter(results, function(result){
                    if(result != null)
                    {
                        return result.authorized
                    }
                    else
                    {
                        return false;
                    }
                });

                req = Permissions.addToReasons(req, reasonsForAuthorizing, true);

                callback(err, req, results);
            }
        );
    }
    else
    {
        var reasonsForAllowing = [{
            authorized: true,
            role: Permissions.role.system.admin
        }];

        req = Permissions.addToReasons(req, reasonsForAllowing, true);

        callback(null, req , reasonsForAllowing);
    }
}

Permissions.require = function(permissionsRequired, req, res, next)
{
    if(Config.debug.permissions.enable_permissions_system)
    {
        if(Config.debug.permissions.log_requests_and_permissions)
        {
            console.log("[REQUEST] : Checking for permissions on request " + req.originalUrl);
            console.log(JSON.stringify(permissionsRequired, null, 2));

        }

        var async = require('async');

        //Global Administrators are God, so they dont go through any checks
        if(!req.session.isAdmin)
        {
            Permissions.check(permissionsRequired, req, function(err, req){
                if(req.permissions_management.reasons_for_authorizing.length > 0)
                {
                    if(Config.debug.permissions.log_authorizations)
                    {
                        console.log("[AUTHORIZED] : Checking for permissions on request " + req.originalUrl);
                        console.log(JSON.stringify(req.permissions_management.reasons_for_authorizing.length, null, 2));
                    }

                    return Permissions.sendResponse(true, req, res, next, req.permissions_management.reasons_for_authorizing);
                }
                else if(req.permissions_management.reasons_for_denying.length > 0)
                {
                    if (Config.debug.permissions.log_denials)
                    {
                        console.log("[DENIED] : Checking for permissions on request " + req.originalUrl);
                        console.log(JSON.stringify(req.permissions_management.reasons_for_authorizing.length, null, 2));
                    }

                    return Permissions.sendResponse(false, req, res, next, req.permissions_management.reasons_for_denying);
                }
                else
                {
                    //ommision case. No reasons to authorize nor to refuse access!
                    return Permissions.sendResponse(true, req, res, next, []);
                }
            });
        }
        else
        {
            return Permissions.sendResponse(true, req, res, next, [Permissions.role.system.admin]);
        }
    }
    else
    {
        next();
    }
};

exports.Permissions = Permissions;
