const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const Deposit = require(Pathfinder.absPathInSrcFolder("/models/deposit.js")).Deposit;
const User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;


exports.index = function(req, res){
    let registries;
    const loggedIn = req.user instanceof User;

    const sendResponse = function(deposits)
    {
        let acceptsHTML = req.accepts("html");
        let acceptsJSON = req.accepts("json");

        if(acceptsJSON && !acceptsHTML){
            res.json(deposits);
        }
        else
        {
            res.render('index', {
                    deposits : deposits
                }
            )
        }
    };

    if(loggedIn){
        Deposit.getAllowedDeposits(req, function(deposits){
            sendResponse(deposits);
        });
    } else {
        Deposit.getDeposits(req, function(deposits){
            sendResponse(deposits);
        });
    }
};

exports.analytics_tracking_code = function(req, res){
    let acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

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
