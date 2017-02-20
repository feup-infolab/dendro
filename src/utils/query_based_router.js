var _ = require('underscore');

var Permissions = Object.create(require(Config.absPathInSrcFolder("/models/meta/permissions.js")).Permissions);

var QueryBasedRouter = function(){};


QueryBasedRouter.applyRoutes = function(routes, req, res, next)
{
    var method = req.originalMethod.toLowerCase();

    var methodRoutes;
    if(routes[method] == null) {
        if(routes['all']== null)
            return res.sendStatus(405);
        else
            methodRoutes = routes['all'];
    }
    else
    {
        methodRoutes = routes[method];
    }

    var queryKeysSent = Object.keys(req.query);

    if(queryKeysSent.length > 0)
    {
        var routeThatMatchesTheMostQueries = _.max(methodRoutes, function(route){

            var queryKeysThatNeedToBePresent = route.queryKeys;
            try{
                var missingQueryKeys = _.intersection(queryKeysThatNeedToBePresent, queryKeysSent);
            }
            catch(e)
            {
                return -1;
            }

            return missingQueryKeys.length;
        });
    }
    else
    {
        var routeThatMatchesTheMostQueries = _.filter(methodRoutes, function(route){
            return (route.queryKeys.length === 0);
        });
    }

    if(routeThatMatchesTheMostQueries != null && routeThatMatchesTheMostQueries instanceof Array && routeThatMatchesTheMostQueries.length == 1)
    {
        routeThatMatchesTheMostQueries = routeThatMatchesTheMostQueries[0];
    }

    Permissions.check(routeThatMatchesTheMostQueries.permissions, req, function(err, req)
    {
        if (req.permissions_management.reasons_for_authorizing != null && req.permissions_management.reasons_for_authorizing.length > 0)
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