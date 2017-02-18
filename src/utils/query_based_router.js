var _ = require('underscore');

var Permissions = Object.create(require(Config.absPathInSrcFolder("/models/meta/permissions.js")).Permissions);

var QueryBasedRouter = function(){};


QueryBasedRouter.applyRoutes = function(routes, req, res)
{
    var method = req.originalMethod.toLowerCase();

    if(routes[method] != null)
    {
        var methodRoutes = routes[method];

        var queryKeysSent = Object.keys(req.query);

        var matchingRoutes = _.filter(methodRoutes, function(route){
            var queryKeysThatNeedToBePresent = route.queryKeys;
            var missingQueryKeys = _.difference(queryKeysSent, queryKeysThatNeedToBePresent);
            return missingQueryKeys.length == 0;
        });

        var routeThatMatchesTheMostQueries = _.max(matchingRoutes, function(route){
            return route.queryKeys.length;
        });

        Permissions.require(routeThatMatchesTheMostQueries.permissions, req, res, function(req, res){
            routeThatMatchesTheMostQueries.handler(req, res);
        });
    }
    else
    {
        res.sendStatus(405);
    }
}

module.exports.QueryBasedRouter = QueryBasedRouter;