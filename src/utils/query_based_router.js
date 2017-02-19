var _ = require('underscore');

var Permissions = Object.create(require(Config.absPathInSrcFolder("/models/meta/permissions.js")).Permissions);

var QueryBasedRouter = function(){};


QueryBasedRouter.applyRoutes = function(routes, req, res, next)
{
    var method = req.originalMethod.toLowerCase();

    var methodRoutes = routes[method];
    if(methodRoutes == null) {
        return res.sendStatus(405);
    }

    var queryKeysSent = Object.keys(req.query);

    var matchingRoutes = _.filter(methodRoutes, function(route){
        var queryKeysThatNeedToBePresent = route.queryKeys;
        var missingQueryKeys = _.difference(queryKeysThatNeedToBePresent, queryKeysSent);
        return missingQueryKeys.length == 0;
    });

    if(queryKeysSent.length == 0)
    {
        var routeThatMatchesTheMostQueries = _.filter(matchingRoutes, function(route){
            return (route.queryKeys.length === 0);
        });

        if(routeThatMatchesTheMostQueries instanceof Array && routeThatMatchesTheMostQueries.length == 1 )
        {
            routeThatMatchesTheMostQueries = routeThatMatchesTheMostQueries[0];
        }
        else
        {
            next();
        }
    }
    else
    {
        if(matchingRoutes.length > 0)
        {
            var routeThatMatchesTheMostQueries = _.max(matchingRoutes, function(route){
                return route.queryKeys.length;
            });
        }
        else
        {
            next();
        }
    }

    Permissions.check(routeThatMatchesTheMostQueries.permissions, req, function(err, req){
        if(req.permissions_management.reasons_for_authorizing != null && req.permissions_management.reasons_for_authorizing.length > 0)
        {
            routeThatMatchesTheMostQueries.handler(req, res);
        }
        else
        {
            Permissions.sendResponse(false, req, res, next, req.permissions_management.reasons_for_denying);
        }

    });
}

module.exports.QueryBasedRouter = QueryBasedRouter;