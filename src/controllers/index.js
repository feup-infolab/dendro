const Config = function () {
    return GLOBAL.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const registry = require(Config.absPathInSrcFolder("/models/registry"));


exports.index = function(req, res){

    registry.getDeposits();

    //TODO query to get latest deposits
    res.render('index',
        {}
    );
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
