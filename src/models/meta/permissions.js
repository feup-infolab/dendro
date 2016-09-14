var Config = Object.create(require("./config.js").Config);

var Resource = require(Config.absPathInProject("/models/resource.js")).Resource;
var InformationElement = require(Config.absPathInProject("/models/directory_structure/information_element.js")).InformationElement;
var File = require(Config.absPathInProject("/models/directory_structure/file.js")).File;
var Folder = require(Config.absPathInProject("/models/directory_structure/folder.js")).Folder;
var User = require(Config.absPathInProject("/models/user.js")).User;
var Project = require(Config.absPathInProject("/models/project.js")).Project;

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

Permissions.sendResponse = function(allow_access, req, res, next, reasonsForDenying)
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

        for(var i = 0; i < reasonsForDenying.length ; i++)
        {
            var denyingRole = reasonsForDenying[i].role;

            messagesAPI = messagesAPI + denyingRole.error_message_api;
            messagesUser = messagesUser + denyingRole.error_message_user;

            if(i < reasonsForDenying.length - 1)
            {
                messagesAPI = messagesAPI + " , ";
                messagesUser = messagesUser + " , ";
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
                    if(req.privacy === "metadataOnlyStatus")
                    {
                        return res.redirect(req.originalUrl + '/request_access');
                    }
                    else if(req.privacy === "privateStatus")
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
        var resource = Config.baseUri + require('url').parse(req.url).pathname;
        var projectIndex = resource.indexOf("project\/");
        var slashIndex = resource.indexOf("\/", projectIndex + 8);
        var topProjectResource;

        if(slashIndex == -1)
        {
            topProjectResource = resource;
        }
        else
        {
            topProjectResource = resource.substring(0, slashIndex)
        }

        Project.privacy(topProjectResource, function(err, privacy){
            var slashIndex = privacy.lastIndexOf("\/");
            var privacyType = privacy.substring(slashIndex+1);
            if(privacyType === 'publicStatus')
            {
                req.public = true;
            }

			req.privacy = privacyType;
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
						reasonsForDenying = reasonsForDenying.concat(_.filter(methodResults, function(result){return !result.authorized}));

						if(reasonsForAuthorizing.length > 0)
						{
							//Since user is involved in the project, the project will be seen the normal way
							req.public = false;
							return Permissions.sendResponse(true, req, res, next, reasonsForAuthorizing);
						}
					}

					if(reasonsForDenying.length > 0)
					{
						console.log("REASONS FOR DENYING");
						if(req.public == true){
							return Permissions.sendResponse(true, req, res, next, []);
						}else{
							return Permissions.sendResponse(false, req, res, next, reasonsForDenying);
						}
					}
					else
					{
						//ommision case. No reasons to authorize nor to refuse access!
						return Permissions.sendResponse(true, req, res, next, []);
					}
				}
			);
        });
    }
    else
    {
        next();
    }
};

exports.Permissions = Permissions;
