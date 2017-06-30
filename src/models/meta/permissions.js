const Config = function () {
    return global.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;

const Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
const InformationElement = require(Config.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
const File = require(Config.absPathInSrcFolder("/models/directory_structure/file.js")).File;
const Folder = require(Config.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
const User = require(Config.absPathInSrcFolder("/models/user.js")).User;
const Project = require(Config.absPathInSrcFolder("/models/project.js")).Project;

const async = require('async');
const _ = require('underscore');

function Permissions (){}

Permissions.messages = {
    generic : {
        api : "Action not permitted. You are not logged into the system.",
        user : "Please log into the system."
    }
};

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
};

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
};

Permissions.sendResponse = function(allow_access, req, res, next, reasonsForAllowingOrDenying, errorMessage)
{
    let acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');

    if(allow_access)
    {
        if(Config.debug.permissions.log_authorizations)
        {
            var user = "-> NO USER AUTHENTICATED <-";
            if(req.user)
            {
                user = req.user.uri;
            }

            console.log("[ALLOW-ACCESS] User " + user + " granted access to " + req.originalUrl + " .");
        }

        return next();
    }
    else
    {
        let messageAPI = errorMessage;
        let messageUser = errorMessage;

        req.permissions_management = {
            reasons_for_denying : reasonsForAllowingOrDenying
        };

        if(Config.debug.permissions.log_authorizations)
        {
            var user = "-> NO USER AUTHENTICATED <-";
            if(!isNull(req.user))
            {
                user = req.user.uri;
            }

            console.log("[DENY-ACCESS] User " + user + " denied access to " + req.originalUrl + " . Reasons: " + messageUser);
        }

        if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
        {
            if(messageAPI === "" || isNull(messageAPI))
            {
                messageAPI = Permissions.messages.generic.api;
            }

            return res.status(401).json(
                {
                    result : "error",
                    message : messageAPI
                }
            );
        }
        else
        {
            if(messageUser === "" || isNull(messageUser))
            {
                messageUser = Permissions.messages.generic.user;
            }

            req.flash('error', messageUser);

            if(req.user)
            {
                return res.status(401).render('index',
                {
                    error_messages : [messageUser]
                });
            }
            else
            {
                return res.status(401).render('auth/login', {
                    error_messages : [messageUser]
                });
            }
        }
    }
};

const getOwnerProject = function (requestedResource, callback) {

    async.tryEach([
        function(callback)
        {
            Project.findByUri(requestedResource, function(err, project){
                if(isNull(err))
                {
                    if(isNull(project) || !(project instanceof Project))
                    {
                        callback(null, null);
                    }
                    else
                    {
                        callback(null, project);
                    }
                }
                else
                {
                    callback(err, null);
                }
            });
        },
        function(callback)
        {
            InformationElement.findByUri(requestedResource, function(err, resource){
                if(isNull(err) && (resource instanceof InformationElement))
                {
                    if(isNull(resource) || !(resource instanceof InformationElement))
                    {
                        callback(null, resource)
                    }
                    else
                    {
                        resource.getOwnerProject(function(err, project){
                            if(isNull(project) || !(project instanceof Project))
                            {
                                callback(null, project);
                            }
                            else
                            {
                                callback(null, null);
                            }
                        });
                    }
                }
                else
                {
                    callback(err, null);
                }
            });
        }
    ], function(err, result){
        callback(err, result);
    });
};

const checkUsersRoleInSystem = function (req, user, role, callback) {
    user.checkIfHasPredicateValue(role.predicate, role.object, function (err, result) {
        return callback(err, result);
    });
};

const checkUsersRoleInProject = function (req, user, role, project, callback) {
    project.checkIfHasPredicateValue(role.predicate, user.uri, function (err, result) {
        return callback(err, result);
    });
};

const checkUsersRoleInResource = function (req, user, role, resource, callback) {
    resource.checkIfHasPredicateValue(role.predicate, user.uri, function (err, result) {
        return callback(err, result);
    });
};

const checkPermissionsForRole = function (req, user, resource, role, callback) {
    if (!(user instanceof User) && user instanceof Object)
        user = new User(user);

    if (role.type === Permissions.types.system) {
        checkUsersRoleInSystem(req, user, role, function (err, hasRole) {
            return callback(err, {authorized: hasRole, role: role});
        });
    }
    else if (role.type === Permissions.types.project) {
        getOwnerProject(resource, function (err, project) {
            if (!err) {
                if (project instanceof Project) {
                    checkUsersRoleInProject(req, user, role, project, function (err, hasRole) {
                        return callback(err, {authorized: hasRole, role: role});
                    });
                }
                else {
                    return callback(null, null);
                }
            }
            else {
                return callback(err, null);
            }
        });
    }
    else if (role.type === Permissions.types.resource) {
        checkUsersRoleInResource(req, user, role, resource, function (err, hasRole) {
            return callback(err, {authorized: hasRole, role: role});
        });
    }
};

const checkPermissionsForProject = function (req, permission, callback) {
    Project.findByUri(req.params.requestedResourceUri, function (err, project) {
        if (!err) {
            if (!isNull(project) && project instanceof Project) {
                const privacy = project.ddr.privacyStatus;

                if (!isNull(permission.object) && privacy === permission.object) {
                    return callback(null,
                        {
                            authorized: true,
                            role: Permissions.project_privacy_status[permission.object]
                        }
                    );
                }
                else {
                    return callback(null,
                        {
                            authorized: false,
                            role: permission
                        }
                    );
                }
            }
            else {
                return callback(null,
                    {
                        authorized: true,
                        role: ["Project with uri" + req.requestedResourceUri + " does not exist."]
                    }
                );
            }
        }
        else {
            return callback(null,
                {
                    authorized: true,
                    role: ["Error accessing project: " + project]
                }
            );
        }
    });
};


Permissions.addToReasons = function(req, reason, authorizing)
{
    if(typeof req.permissions_management === "undefined")
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
};

Permissions.check = function(permissionsRequired, req, callback)
{
    //Global Administrators are God, so they dont go through any checks
    if(!req.session.isAdmin)
    {
        const resource = req.params.requestedResourceUri;
        const user = req.user;

        const checkPermissions = function (req, user, resource, permission, cb) {
            if (permission.type === Permissions.types.system) {
                if (!isNull(user)) {
                    checkPermissionsForRole(req, user, resource, permission, function (err, results) {
                        cb(err, results);
                    });
                }
                else {
                    cb(null, {authorized: false, role: permission});
                }

            }
            else if (permission.type === Permissions.types.project) {
                if (!isNull(user)) {
                    checkPermissionsForRole(req, user, resource, permission, function (err, results) {
                        cb(err, results);
                    });
                }
                else {
                    cb(null, {authorized: false, role: permission});
                }

            }
            else if (permission.type === Permissions.types.resource) {
                if (!isNull(user)) {
                    checkPermissionsForRole(req, user, resource, permission, function (err, results) {
                        cb(err, results);
                    });
                }
                else {
                    cb(null, {authorized: hasRole, role: permission});
                }
            }
            else if (permission.type === Permissions.types.project_privacy_status) {
                checkPermissionsForProject(req, permission, function (err, results) {
                    cb(err, results);
                });
            }
            else {
                cb(null,
                    {
                        authorized: false,
                        role: "Permission required is badly configured. Ask your administrator to review your Dendro server's configuration"
                    }
                );
            }
        };

        async.map(permissionsRequired,
            async.apply(checkPermissions, req, user, resource),
            function(err, results)
            {
                const reasonsForDenying = _.filter(results, function (result) {
                    if (!isNull(result)) {
                        return !result.authorized
                    }
                    else {
                        return false;
                    }
                });

                req = Permissions.addToReasons(req, reasonsForDenying, false);

                const reasonsForAuthorizing = _.filter(results, function (result) {
                    if (!isNull(result)) {
                        return result.authorized
                    }
                    else {
                        return false;
                    }
                });

                req = Permissions.addToReasons(req, reasonsForAuthorizing, true);

                return callback(err, req, results);
            }
        );
    }
    else
    {
        const reasonsForAllowing = [{
            authorized: true,
            role: Permissions.role.system.admin
        }];

        req = Permissions.addToReasons(req, reasonsForAllowing, true);

        return callback(null, req , reasonsForAllowing);
    }
};

Permissions.require = function(permissionsRequired, req, res, next)
{
    if(Config.debug.permissions.enable_permissions_system)
    {
        if(Config.debug.permissions.log_requests_and_permissions)
        {
            console.log("[REQUEST] : Checking for permissions on request " + req.originalUrl);
            console.log(JSON.stringify(permissionsRequired, null, 2));

        }

        const async = require('async');

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
