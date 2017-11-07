const path = require('path');
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;
const Elements = require(Pathfinder.absPathInSrcFolder('/models/meta/elements.js')).Elements;

const isNull = require(Pathfinder.absPathInSrcFolder('/utils/null.js')).isNull;

const User = require(Pathfinder.absPathInSrcFolder('/models/user.js')).User;
const DbConnection = require(Pathfinder.absPathInSrcFolder('/kb/db.js')).DbConnection;
const db = Config.getDBByID();

/*
 * GET users listing.
 */

exports.show = function (req, res)
{
    let viewVars = {
        title: 'Researchers in the knowledge base'
    };

    viewVars = DbConnection.paginate(req,
        viewVars
    );

    User.all(function (err, users)
    {
        if (isNull(err))
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

exports.query = function (req, res)
{
    const username = req.params.username;

    User.findByUsername(username, function (err, user)
    {
        if (isNull(err))
        {
            res.render('users/show',
                {
                    title: 'Viewing user ' + username,
                    user: user
                }
            );
        }
        else
        {
            res.render('users/all',
                {
                    title: 'Researchers',
                    error_messages:
          [
              'Unable to retrieve information for user ' + username,
              err
          ]
                }
            );
        }
    });
};
