const Config = function () {
    return GLOBAL.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;

const _ = require('underscore');

const Permissions = Object.create(require(Config.absPathInSrcFolder("/models/meta/permissions.js")).Permissions);

const QueryBasedRouter = function () {
};


QueryBasedRouter.applyRoutes = function(routes, req, res, next)
{
    const method = req.originalMethod.toLowerCase();
    let matchingRoute;
    let routeThatMatchesTheMostQueries;


    function extractFirstElementFromArray(array)
    {
        if(!isNull(array) && array instanceof Array && array.length === 1)
        {
            return array[0];
        }
        else if( array instanceof Object)
        {
            return array;
        }
        else
            return null;

    }

    function getMatchingRoute(methodRoutes)
    {
        const queryKeysSent = Object.keys(req.query);

        if(queryKeysSent.length > 0)
        {

            const routesThatHaveAtLeastOneQuery = _.filter(methodRoutes, function (route) {

                const queryKeysThatNeedToBePresent = route.queryKeys;
                const queryKeysPresent = _.intersection(queryKeysThatNeedToBePresent, queryKeysSent);

                if (queryKeysPresent.length === 0) {
                    return false;
                }
                else {
                    return true;
                }
            });

            if(routesThatHaveAtLeastOneQuery.length > 0)
            {
                routeThatMatchesTheMostQueries = _.max(routesThatHaveAtLeastOneQuery, function(route){
                    const queryKeysThatNeedToBePresent = route.queryKeys;
                    const queryKeysPresent = _.intersection(queryKeysThatNeedToBePresent, queryKeysSent);
                    return queryKeysPresent.length;
                });

                return extractFirstElementFromArray(routeThatMatchesTheMostQueries);
            }
            else
            {
                return null;
            }
        }
        else
        {
            routeThatMatchesTheMostQueries = _.filter(methodRoutes, function(route){
                return (route.queryKeys.length === 0);
            });

            return extractFirstElementFromArray(routeThatMatchesTheMostQueries);
        }
    }

    function passRequestToRoute (matchingRoute)
    {
        Permissions.check(matchingRoute.permissions, req, function(err, req)
        {
            if (typeof req.permissions_management.reasons_for_authorizing !== "undefined" && req.permissions_management.reasons_for_authorizing.length > 0)
            {
                matchingRoute.handler(req, res);
            }
            else
            {
                Permissions.sendResponse(false, req, res, next, req.permissions_management.reasons_for_denying, matchingRoute.authentication_error);
            }
        });
    }

    var methodRoutes;
    if(!isNull(routes[method])) {
        matchingRoute = getMatchingRoute(routes[method]);

        //try all
        if(isNull(matchingRoute))
        {
            matchingRoute = getMatchingRoute(routes['all']);
        }

        if(!isNull(matchingRoute))
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
        //try all
        matchingRoute = getMatchingRoute(routes['all']);

        if(!isNull(matchingRoute))
        {
            passRequestToRoute(matchingRoute);
        }
        else
        {
            next();
        }
    }
};

module.exports.QueryBasedRouter = QueryBasedRouter;