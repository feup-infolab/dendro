const path = require('path');
const async = require('async');
const _ = require('underscore');
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;

const isNull = require(Pathfinder.absPathInSrcFolder('/utils/null.js')).isNull;
const Permissions = Object.create(require(Pathfinder.absPathInSrcFolder('/models/meta/permissions.js')).Permissions);

const QueryBasedRouter = function ()
{
};

QueryBasedRouter.applyRoutes = function (routes, req, res, next, validateExistenceOfRequestedResourceUri)
{
    const method = req.originalMethod.toLowerCase();
    let matchingRoute;
    let routeThatMatchesTheMostQueries;

    function resourceExists (callback)
    {
        const resourceUri = req.params.requestedResourceUri;
        if (!isNull(resourceUri))
        {
            const Resource = require(Pathfinder.absPathInSrcFolder('/models/resource.js')).Resource;
            Resource.findByUri(resourceUri, function (err, resource)
            {
                if (isNull(err))
                {
                    if (!isNull(resource))
                    {
                        callback(null);
                    }
                    else
                    {
                        callback(404, 'Resource with URI ' + resourceUri + ' does not exist');
                    }
                }
                else
                {
                    callback(500, exists);
                }
            });
        }
        else
        {
            callback(400, 'Unable to determine which resource is being referenced in this HTTP request.');
        }
    }

    function extractFirstElementFromArray (array)
    {
        if (!isNull(array) && array instanceof Array && array.length === 1)
        {
            return array[0];
        }
        else if (array instanceof Object)
        {
            return array;
        } return null;
    }

    function getMatchingRoute (methodRoutes)
    {
        const queryKeysSent = Object.keys(req.query);

        if (queryKeysSent.length > 0)
        {
            const routesThatHaveAtLeastOneQuery = _.filter(methodRoutes, function (route)
            {
                const queryKeysThatNeedToBePresent = route.queryKeys;
                const queryKeysPresent = _.intersection(queryKeysThatNeedToBePresent, queryKeysSent);

                if (queryKeysPresent.length === 0)
                {
                    return false;
                }
                return true;
            });

            if (routesThatHaveAtLeastOneQuery.length > 0)
            {
                routeThatMatchesTheMostQueries = _.max(routesThatHaveAtLeastOneQuery, function (route)
                {
                    const queryKeysThatNeedToBePresent = route.queryKeys;
                    const queryKeysPresent = _.intersection(queryKeysThatNeedToBePresent, queryKeysSent);
                    return queryKeysPresent.length;
                });

                return extractFirstElementFromArray(routeThatMatchesTheMostQueries);
            }
            return null;
        }
        routeThatMatchesTheMostQueries = _.filter(methodRoutes, function (route)
        {
            return (route.queryKeys.length === 0);
        });

        return extractFirstElementFromArray(routeThatMatchesTheMostQueries);
    }

    function passRequestToRoute (matchingRoute)
    {
        if (!isNull(matchingRoute.permissions))
        {
            Permissions.check(matchingRoute.permissions, req, function (err, req)
            {
                if (typeof req.permissions_management.reasons_for_authorizing !== 'undefined' &&
                    req.permissions_management.reasons_for_authorizing instanceof Array &&
                    req.permissions_management.reasons_for_authorizing.length > 0
                )
                {
                    matchingRoute.handler(req, res);
                }
                else
                {
                    Permissions.sendResponse(false,
                        req,
                        res,
                        next,
                        req.permissions_management.reasons_for_denying,
                        matchingRoute.authentication_error
                    );
                }
            });
        }
        else if (!isNull(matchingRoute))
        {
            if (typeof matchingRoute === 'function')
            {
                matchingRoute.handler(req, res);
            }
            else
            {
                console.error('Matching route is not a function!');
                next();
            }
        }
        else
        {
            next();
        }
    }

    async.series([
        function (callback)
        {
            if (!isNull(validateExistenceOfRequestedResourceUri) && validateExistenceOfRequestedResourceUri)
            {
                resourceExists(function (err, result)
                {
                    callback(err, result);
                });
            }
            else
            {
                callback(null);
            }
        }
    ], function (err, result)
    {
        if (isNull(err))
        {
            if (!isNull(routes[method]))
            {
                matchingRoute = getMatchingRoute(routes[method]);

                // try all
                if (isNull(matchingRoute))
                {
                    matchingRoute = getMatchingRoute(routes.all);
                }

                if (!isNull(matchingRoute))
                {
                    passRequestToRoute(matchingRoute);
                }
                else
                {
                    next();
                }
            }
            else
            {
                // try all
                matchingRoute = getMatchingRoute(routes.all);

                if (!isNull(matchingRoute))
                {
                    passRequestToRoute(matchingRoute);
                }
                else
                {
                    next();
                }
            }
        }
        else
        {
            next();
        }
    });
};

module.exports.QueryBasedRouter = QueryBasedRouter;
