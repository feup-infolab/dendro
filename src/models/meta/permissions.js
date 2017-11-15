const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const Resource = require(Pathfinder.absPathInSrcFolder("/models/resource.js")).Resource;
const InformationElement = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
const File = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/file.js")).File;
const Folder = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
const User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;
const Project = require(Pathfinder.absPathInSrcFolder("/models/project.js")).Project;
const Post = require(Pathfinder.absPathInSrcFolder("/models/social/post.js")).Post;
const Notification = require(Pathfinder.absPathInSrcFolder("/models/notifications/notification.js")).Notification;

const async = require("async");
const _ = require("underscore");

const db_social = Config.getDBByID("social");
const db_notifications = Config.getDBByID("notifications");

function Permissions ()
{}

Permissions.messages = {
    generic: {
        api: "Action not permitted. You are not logged into the system.",
        user: "Please log into the system."
    }
};

Permissions.sendResponse = function (allow_access, req, res, next, reasonsForAllowingOrDenying, errorMessage)
{
    let acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    if (allow_access)
    {
        if (Config.debug.permissions.log_authorizations)
        {
            let user = "-> NO USER AUTHENTICATED <-";
            if (req.user)
            {
                user = req.user.uri;
            }

            console.log("[ALLOW-ACCESS] User " + user + " granted access to " + req.originalUrl + " .");
        }

        return next();
    }
    let messageAPI = errorMessage;
    let messageUser = errorMessage;

    req.permissions_management = {
        reasons_for_denying: reasonsForAllowingOrDenying
    };

    if (Config.debug.permissions.log_authorizations)
    {
        let user = "-> NO USER AUTHENTICATED <-";
        if (!isNull(req.user))
        {
            user = req.user.uri;
        }

        console.log("[DENY-ACCESS] User " + user + " denied access to " + req.originalUrl + " . Reasons: " + messageUser);
    }

    if (acceptsJSON && !acceptsHTML) // will be null if the client does not accept html
    {
        if (messageAPI === "" || isNull(messageAPI))
        {
            messageAPI = Permissions.messages.generic.api;
        }

        return res.status(401).json(
            {
                result: "error",
                message: messageAPI
            }
        );
    }
    if (messageUser === "" || isNull(messageUser))
    {
        messageUser = Permissions.messages.generic.user;
    }

    req.flash("error", messageUser);

    if (req.user)
    {
        return res.status(401).render("index",
            {
                error_messages: [messageUser]
            });
    }
    return res.status(401).render("auth/login", {
        error_messages: [messageUser],
        redirect: req.url
    });
};

const getOwnerProject = function (requestedResource, callback)
{
    InformationElement.findByUri(requestedResource, function (err, resource)
    {
        if (isNull(err))
        {
            if (!isNull(resource))
            {
                if (resource instanceof InformationElement)
                {
                    resource.getOwnerProject(function (err, project)
                    {
                        if (!isNull(project) && project instanceof Project)
                        {
                            callback(null, project);
                        }
                        else
                        {
                            callback(err, project);
                        }
                    });
                }
                else
                {
                    callback("Resource " + requestedResource + " is of invalid type!", null);
                }
            }
            else
            {
                callback(null, null);
            }
        }
        else
        {
            callback(err, resource);
        }
    });
};

/** Role-based validation **/

const checkRoleInSystem = Permissions.checkRoleInSystem = function (req, user, role, callback)
{
    if (!isNull(user))
    {
        user.checkIfHasPredicateValue(role.predicate, role.object, function (err, result)
        {
            return callback(err, result);
        });
    }
    else
    {
        callback(null, false);
    }
};

const checkUsersRoleInProject = function (req, user, role, project, callback)
{
    if (!isNull(user))
    {
        if (project instanceof Project)
        {
            project.checkIfHasPredicateValue(role.predicate, user.uri, function (err, result)
            {
                return callback(err, result);
            });
        }
        else if (typeof project === "string")
        {
            Project.findByUri(project, function (err, project)
            {
                if (isNull(err) && project instanceof Project)
                {
                    project.checkIfHasPredicateValue(role.predicate, user.uri, function (err, result)
                    {
                        return callback(err, result);
                    });
                }
                else
                {
                    return callback(err, null);
                }
            });
        }
        else
        {
            return callback("Invalid project type supplied!", null);
        }
    }
    else
    {
        return callback(null, false);
    }
};

const getPostsProject = function (postUri, callback)
{
    Post.findByUri(postUri, function (err, post)
    {
        if (isNull(err))
        {
            if (!isNull(post))
            {
                if (post instanceof Post)
                {
                    post.getOwnerProject(function (err, project)
                    {
                        if (!isNull(project) && project instanceof Project)
                        {
                            callback(null, project);
                        }
                        else
                        {
                            callback(err, project);
                        }
                    });
                }
                else
                {
                    callback("Resource " + postUri + " is of invalid type!", null);
                }
            }
            else
            {
                callback(null, null);
            }
        }
        else
        {
            callback(err, post);
        }
    }, null, db_social.graphUri, false, null, null);
};

const checkUsersRoleInNotification = function (req, user, role, notificationUri, callback)
{
    if (!isNull(user))
    {
        Notification.findByUri(notificationUri, function (err, notification)
        {
            if (isNull(err))
            {
                if (notification instanceof Notification)
                {
                    notification.checkIfHasPredicateValue(role.predicate, user.uri, function (err, result)
                    {
                        return callback(err, result);
                    }, db_notifications.graphUri);
                }
                else
                {
                    return callback(null, false);
                }
            }
            else
            {
                return callback(null, false);
            }
        }, null, db_notifications.graphUri, false, null, null);
    }
    else
    {
        callback(null, false);
    }
};

const checkUsersRoleInPostsProject = function (req, user, role, postUri, callback)
{
    if (!isNull(user))
    {
        getPostsProject(postUri, function (err, project)
        {
            if (isNull(err))
            {
                if (project instanceof Project)
                {
                    checkUsersRoleInProject(req, user, role, project, function (err, hasRole)
                    {
                        return callback(err, hasRole);
                    });
                }
                else
                {
                    return callback(null, false);
                }
            }
            else
            {
                return callback(null, false);
            }
        });
    }
    else
    {
        callback(null, false);
    }
};

const checkUsersRoleInArrayOfPostsProject = function (req, user, role, arrayOfPostsUris, callback)
{
    if (!isNull(user))
    {
        async.mapSeries(arrayOfPostsUris, function (postUri, cb)
        {
            getPostsProject(postUri, function (err, project)
            {
                if (isNull(err))
                {
                    if (project instanceof Project)
                    {
                        checkUsersRoleInProject(req, user, role, project, function (err, hasRole)
                        {
                            if (isNull(err))
                            {
                                if (hasRole === false)
                                {
                                    return callback(err, hasRole);
                                }
                                cb(err, hasRole);
                            }
                            else
                            {
                                return callback(err, false);
                            }
                        });
                    }
                    else
                    {
                        return callback(null, false);
                    }
                }
                else
                {
                    return callback(null, false);
                }
            });
        }, function (err, results)
        {
            return callback(err, true);
        });
    }
    else
    {
        callback(null, false);
    }
};

const checkUsersRoleInParentProject = Permissions.checkUsersRoleInParentProject = function (req, user, role, resource, callback)
{
    if (!isNull(user))
    {
        getOwnerProject(resource, function (err, project)
        {
            if (isNull(err))
            {
                if (project instanceof Project)
                {
                    checkUsersRoleInProject(req, user, role, project, function (err, hasRole)
                    {
                        return callback(err, hasRole);
                    });
                }
                else
                {
                    return callback(null, false);
                }
            }
            else
            {
                return callback(err, false);
            }
        });
    }
    else
    {
        callback(null, false);
    }
};

/** "Privacy status"-based validation **/

const checkPrivacyOfProject = function (req, permission, callback)
{
    Project.findByUri(req.params.requestedResourceUri, function (err, project)
    {
        if (isNull(err))
        {
            if (!isNull(project) && project instanceof Project)
            {
                const privacy = project.ddr.privacyStatus;

                if (!isNull(permission.object) && privacy === permission.object)
                {
                    return callback(null, true);
                }
                return callback(null, false);
            }
            return callback(null, true);
        }
        return callback(err, true);
    });
};

const checkPrivacyOfOwnerProject = function (req, user, role, resource, callback)
{
    getOwnerProject(resource, function (err, project)
    {
        if (isNull(err))
        {
            if (!isNull(project) && project instanceof Project)
            {
                const privacy = project.ddr.privacyStatus;

                if (!isNull(role.object) && privacy === role.object)
                {
                    return callback(null, true);
                }
                return callback(null, false);
            }
            return callback(null, false);
        }
        return callback(err, null);
    });
};

/** Permission types **/

Permissions.types = {
    role_in_system: {
        validator: checkRoleInSystem
    },
    role_in_project: {
        validator: checkUsersRoleInProject
    },
    role_in_owner_project: {
        validator: checkUsersRoleInParentProject
    },
    role_in_post_s_project: {
        validator: checkUsersRoleInPostsProject
    },
    role_in_array_of_posts_project: {
        validator: checkUsersRoleInArrayOfPostsProject
    },
    role_in_notification_s_resource: {
        validator: checkUsersRoleInNotification
    },
    privacy_of_project: {
        validator: checkPrivacyOfProject
    },
    privacy_of_owner_project: {
        validator: checkPrivacyOfOwnerProject
    }
};

/** Permission parametrization **/

Permissions.settings = {
    role: {
        in_system: {
            admin: {
                type: Permissions.types.role_in_system,
                predicate: "rdf:type",
                object: "ddr:Administrator",
                error_message_user: "You are not authorized to perform this operation. You must be a Dendro administrator.",
                error_message_api: "Error detected. You are not authorized to perform this operation. You must be a Dendro administrator."
            },
            user: {
                type: Permissions.types.role_in_system,
                predicate: "rdf:type",
                object: "ddr:User",
                error_message_user: "You are not authorized to perform this operation. You must be signed into Dendro.",
                error_message_api: "Error detected. You are not authorized to perform this operation. You must be signed into Dendro."
            }
        },
        in_project: {
            creator: {
                type: Permissions.types.role_in_project,
                predicate: "dcterms:creator",
                error_message_user: "Error trying to access a project or a file / folder within a project that you have not created.",
                error_message_api: "Unauthorized access. Must be signed on as a creator of this project."
            },
            contributor: {
                type: Permissions.types.role_in_project,
                predicate: "dcterms:contributor",
                error_message_user: "You are not a contributor of this project or of the project to which this resource belongs to.",
                error_message_api: "Unauthorized access. Must be signed on as a contributor of this project."
            }
        },
        in_owner_project: {
            creator: {
                type: Permissions.types.role_in_owner_project,
                predicate: "dcterms:creator",
                error_message_user: "Error trying to access a project or a file / folder within a project that you have not created.",
                error_message_api: "Unauthorized access. Must be signed on as a creator of the project the resource belongs to."
            },
            contributor: {
                type: Permissions.types.role_in_owner_project,
                predicate: "dcterms:contributor",
                error_message_user: "You are not a contributor of this project or of the project to which this resource belongs to.",
                error_message_api: "Unauthorized access. Must be signed on as a contributor of the project the resource belongs to."
            }
        },
        in_notification_s_resource: {
            author: {
                type: Permissions.types.role_in_notification_s_resource,
                predicate: "ddr:resourceAuthorUri",
                error_message_user: "You are not the author of the resource that this notification points to.",
                error_message_api: "Unauthorized access. Must be signed on as the author of the resource that this notification points to."
            }
        },
        in_post_s_project: {
            creator: {
                type: Permissions.types.role_in_post_s_project,
                predicate: "dcterms:creator",
                error_message_user: "You are not a contributor or creator of the project to which this post belongs to.",
                error_message_api: "Unauthorized access. Must be signed on as a contributor or creator of the project the post belongs to."
            },
            contributor: {
                type: Permissions.types.role_in_post_s_project,
                predicate: "dcterms:contributor",
                error_message_user: "You are not a contributor or creator of the project to which this post belongs to.",
                error_message_api: "Unauthorized access. Must be signed on as a contributor or creator of the project the post belongs to."
            }
        },
        in_array_of_posts_project: {
            creator: {
                type: Permissions.types.role_in_array_of_posts_project,
                predicate: "dcterms:creator",
                error_message_user: "You are not a contributor or creator of the project to which these posts belongs to.",
                error_message_api: "Unauthorized access. Must be signed on as a contributor or creator of the project these posts belong to."
            },
            contributor: {
                type: Permissions.types.role_in_array_of_posts_project,
                predicate: "dcterms:contributor",
                error_message_user: "You are not a contributor or creator of the project to which these posts belongs to.",
                error_message_api: "Unauthorized access. Must be signed on as a contributor or creator of the project these posts belong to."
            }
        }
    },
    privacy: {
        of_project: {
            public: {
                type: Permissions.types.privacy_of_project,
                predicate: "ddr:privacyStatus",
                object: "public",
                error_message_user: "This is a public project.",
                error_message_api: "This is a public project."
            },
            private: {
                type: Permissions.types.privacy_of_project,
                predicate: "ddr:privacyStatus",
                object: "private",
                error_message_user: "This is a private project, and neither data nor metadata can be accessed.",
                error_message_api: "Unauthorized Access. This is a private project, and neither data nor metadata can be accessed."
            },
            metadata_only: {
                type: Permissions.types.privacy_of_project,
                predicate: "ddr:privacyStatus",
                object: "metadata_only",
                error_message_user: "This is a project with only metadata access. Data metadata cannot be accessed.",
                error_message_api: "Unauthorized Access. This is a project with only metadata access. Data metadata cannot be accessed."
            }
        },
        of_owner_project: {
            public: {
                type: Permissions.types.privacy_of_owner_project,
                predicate: "ddr:privacyStatus",
                object: "public",
                error_message_user: "This is a resource that belongs to a public project.",
                error_message_api: "This is a resource that belongs to a public project."
            },
            private: {
                type: Permissions.types.privacy_of_owner_project,
                predicate: "ddr:privacyStatus",
                object: "private",
                error_message_user: "This is a resource that belongs to a private project, and neither data nor metadata can be accessed.",
                error_message_api: "Unauthorized Access. This is a resource that belongs to a private project, and neither data nor metadata can be accessed."
            },
            metadata_only: {
                type: Permissions.types.privacy_of_owner_project,
                predicate: "ddr:privacyStatus",
                object: "metadata_only",
                error_message_user: "This is a resource that belongs to a project with only metadata access. Data metadata cannot be accessed.",
                error_message_api: "Unauthorized Access. This is a resource that belongs to a project with only metadata access. Data metadata cannot be accessed."
            }
        }
    }
};

/** Permissions checking logic **/

Permissions.addToReasons = function (req, reason, authorizing)
{
    if (isNull(req.permissions_management))
    {
        req.permissions_management = {};
    }

    if (authorizing)
    {
        req.permissions_management.reasons_for_authorizing = _.compact(_.flatten([].concat(req.permissions_management.reasons_for_authorizing).concat([reason])));
    }
    else
    {
        req.permissions_management.reasons_for_denying = _.compact(_.flatten([].concat(req.permissions_management.reasons_for_denying).concat([reason])));
    }

    return req;
};

Permissions.check = function (permissionsRequired, req, callback)
{
    // Global Administrators are God, so they dont go through any checks
    if (!req.session.isAdmin)
    {
        const resource = req.params.requestedResourceUri;
        const user = req.user;

        const checkPermission = function (req, user, resource, permission, cb)
        {
            if (permission.type === Permissions.types.role_in_system)
            {
                Permissions.types.role_in_system.validator(req, user, permission, function (err, result)
                {
                    cb(err, {authorized: result, role: permission});
                });
            }
            else if (permission.type === Permissions.types.role_in_project)
            {
                Permissions.types.role_in_project.validator(req, user, permission, resource, function (err, result)
                {
                    cb(err, {authorized: result, role: permission});
                });
            }
            else if (permission.type.validator.name === Permissions.types.role_in_owner_project.validator.name)
            {
                Permissions.types.role_in_owner_project.validator(req, user, permission, resource, function (err, result)
                {
                    cb(err, {authorized: result, role: permission});
                });
            }
            else if (permission.type === Permissions.types.privacy_of_project)
            {
                Permissions.types.privacy_of_project.validator(req, permission, function (err, result)
                {
                    cb(err, {authorized: result, role: permission});
                });
            }
            else if (permission.type === Permissions.types.privacy_of_owner_project)
            {
                Permissions.types.privacy_of_owner_project.validator(req, user, permission, resource, function (err, result)
                {
                    cb(err, {authorized: result, role: permission});
                });
            }
            else if (permission.type === Permissions.types.role_in_post_s_project)
            {
                Permissions.types.role_in_post_s_project.validator(req, user, permission, resource, function (err, result)
                {
                    cb(err, {authorized: result, role: permission});
                });
            }
            else if (permission.type === Permissions.types.role_in_array_of_posts_project)
            {
                Permissions.types.role_in_array_of_posts_project.validator(req, user, permission, req.query.postsQueryInfo, function (err, result)
                {
                    cb(err, {authorized: result, role: permission});
                });
            }
            else if (permission.type === Permissions.types.role_in_notification_s_resource)
            {
                Permissions.types.role_in_notification_s_resource.validator(req, user, permission, resource, function (err, result)
                {
                    cb(err, {authorized: result, role: permission});
                });
            }
            else
            {
                cb(null,
                    {
                        authorized: false,
                        role: "Type of permission required is badly configured. Ask your administrator to review your Dendro server's configuration."
                    }
                );
            }
        };

        if (permissionsRequired instanceof Array && permissionsRequired.length > 0)
        {
            async.mapSeries(permissionsRequired,
                async.apply(checkPermission, req, user, resource),
                function (err, results)
                {
                    const reasonsForDenying = _.filter(results, function (result)
                    {
                        if (!isNull(result))
                        {
                            return !result.authorized;
                        }
                        return false;
                    });

                    const reasonsForAuthorizing = _.filter(results, function (result)
                    {
                        if (!isNull(result))
                        {
                            return result.authorized;
                        }
                        return false;
                    });

                    req = Permissions.addToReasons(req, reasonsForDenying, false);

                    req = Permissions.addToReasons(req, reasonsForAuthorizing, true);

                    return callback(err, req, results);
                }
            );
        }
        else
        {
            const reasonsForAllowing = [{
                authorized: true,
                role: "Anyone"
            }];

            req = Permissions.addToReasons(req, reasonsForAllowing, true);

            return callback(null, req, reasonsForAllowing);
        }
    }
    else
    {
        const reasonsForAllowing = [{
            authorized: true,
            role: Permissions.role.in_system.admin
        }];

        req = Permissions.addToReasons(req, reasonsForAllowing, true);

        return callback(null, req, reasonsForAllowing);
    }
};

Permissions.require = function (permissionsRequired, req, res, next)
{
    if (Config.debug.permissions.enable_permissions_system)
    {
        if (Config.debug.active && Config.debug.permissions.log_requests_and_permissions)
        {
            console.log("[REQUEST] : Checking for permissions on request " + req.originalUrl);
            console.log(JSON.stringify(permissionsRequired, null, 2));
        }

        const async = require("async");

        // Global Administrators are God, so they dont go through any checks
        if (!req.session.isAdmin)
        {
            Permissions.check(permissionsRequired, req, function (err, req)
            {
                if (req.permissions_management.reasons_for_authorizing.length > 0)
                {
                    if (Config.debug.active && Config.debug.permissions.log_authorizations)
                    {
                        console.log("[AUTHORIZED] : Checking for permissions on request " + req.originalUrl);
                        console.log(JSON.stringify(req.permissions_management.reasons_for_authorizing.length, null, 2));
                    }

                    return Permissions.sendResponse(true, req, res, next, req.permissions_management.reasons_for_authorizing);
                }
                else if (req.permissions_management.reasons_for_denying.length > 0)
                {
                    if (Config.debug.active && Config.debug.permissions.log_denials)
                    {
                        console.log("[DENIED] : Checking for permissions on request " + req.originalUrl);
                        console.log(JSON.stringify(req.permissions_management.reasons_for_authorizing.length, null, 2));
                        console.log(JSON.stringify(req.permissions_management.reasons_for_denying, null, 2));
                    }

                    return Permissions.sendResponse(false, req, res, next, req.permissions_management.reasons_for_denying);
                }
                // ommision case. No reasons to authorize nor to refuse access!
                return Permissions.sendResponse(true, req, res, next, []);
            });
        }
        else
        {
            return Permissions.sendResponse(true, req, res, next, [Permissions.role.in_system.admin]);
        }
    }
    else
    {
        next();
    }
};

exports.Permissions = Permissions;
