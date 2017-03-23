                                                            /*
 * GET home page.
 */

exports.index = function(req, res){

    res.render('index',
        {}
    );
};

exports.analytics_tracking_code = function(req, res){
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(Config.analytics_tracking_code != null)
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
