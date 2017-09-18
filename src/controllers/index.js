const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const Registry = require(Pathfinder.absPathInSrcFolder("/models/registry.js")).Registry;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;


exports.index = function(req, res){

    Registry.getDeposits(req, function(deposits){
        //TODO query to get latest deposits
        res.render('index', {
                registries: deposits
            }
        )
    });


};

exports.analytics_tracking_code = function(req, res){
    let acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');

    if(typeof Config.analytics_tracking_code !== "undefined")
    {
        if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
        {
            res.json(
                Config.analytics_tracking_code
            );
        }
        else
        {
            res.sendStatus(405);
        }
    }
};
