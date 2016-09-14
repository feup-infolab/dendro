var Config = require('../models/meta/config.js').Config;

var User = require(Config.absPathInProject("/models/user.js")).User;

var DbConnection = require(Config.absPathInProject("/kb/db.js")).DbConnection;

var db = function() { return GLOBAL.db.default; }();

/*
 * GET users listing.
 */

exports.show = function(req, res){

    var viewVars = {
        title : 'Researchers in the knowledge base'
    };

    viewVars = DbConnection.paginate(req,
        viewVars
    );

    User.all(function(err, users)
    {
        if(!err)
        {
            viewVars.users = users;

            res.render('users/all',
                viewVars
            );
        }
        else
        {
            viewVars.error_messages = [users];
            res.render('users/all',
                viewVars
            );
        }
    });
};

exports.query = function(req, res){
    var username = req.params["username"];

    User.findByUsername(username, function(err, user)
    {
        if(err == null)
        {
            res.render('users/show',
                {
                    title : "Viewing user " + username,
                    user : user
                }
            )
        }
        else
        {
            res.render('users/all',
                {
                    title : "Researchers",
                    error_messages :
                        [
                                "Unable to retrieve information for user " + username ,
                            err
                        ]
                }
            );
        }
    });
};
