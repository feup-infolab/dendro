var _ = require('underscore');

var Permissions = Object.create(require(Config.absPathInSrcFolder("/models/meta/permissions.js")).Permissions);

var QueryBasedRouter = function(){};


QueryBasedRouter.applyRoutes = function(routes, req, res, next)
{
    var method = req.originalMethod.toLowerCase();
    var matchingRoute;
    var routeThatMatchesTheMostQueries;


    function extractFirstElementFromArray(array)
    {
        if(array != null && array instanceof Array && array.length == 1)
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
        var queryKeysSent = Object.keys(req.query);

        if(queryKeysSent.length > 0)
        {

            var routesThatHaveAtLeastOneQuery = _.filter(methodRoutes, function (route) {

                var queryKeysThatNeedToBePresent = route.queryKeys;
                var queryKeysPresent = _.intersection(queryKeysThatNeedToBePresent, queryKeysSent);

                if(queryKeysPresent.length == 0) {
                    return false;
                }
                else {
                    return true;
                }
            });

            if(routesThatHaveAtLeastOneQuery.length > 0)
            {
                routeThatMatchesTheMostQueries = _.max(routesThatHaveAtLeastOneQuery, function(route){
                    var queryKeysThatNeedToBePresent = route.queryKeys;
                    var queryKeysPresent = _.intersection(queryKeysThatNeedToBePresent, queryKeysSent);
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
            if (req.permissions_management.reasons_for_authorizing != null && req.permissions_management.reasons_for_authorizing.length > 0)
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
    if(routes[method] != null) {
        matchingRoute = getMatchingRoute(routes[method]);

        //try all
        if(matchingRoute == null)
        {
            matchingRoute = getMatchingRoute(routes['all']);
        }

        if(matchingRoute != null)
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

        if(matchingRoute != null)
        {
            passRequestToRoute(matchingRoute);
        }
        else
        {
            next();
        }
    }
}

module.exports.QueryBasedRouter = QueryBasedRouter;