const path = require("path");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Elements = rlequire("dendro", "src/models/meta/elements.js").Elements;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;

const User = rlequire("dendro", "src/models/user.js").User;
const DbConnection = rlequire("dendro", "src/kb/db.js").DbConnection;
const db = Config.getDBByID();

/*
 * GET users listing.
 */

exports.show = function (req, res)
{
    let viewVars = {
        title: "Researchers in the knowledge base"
    };

    viewVars = DbConnection.paginate(req,
        viewVars
    );

    User.all(function (err, users)
    {
        if (isNull(err))
        {
            viewVars.users = users;

            res.render("users/all",
                viewVars
            );
        }
        else
        {
            viewVars.error_messages = [users];
            res.render("users/all",
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
            res.render("users/show",
                {
                    title: "Viewing user " + username,
                    user: user
                }
            );
        }
        else
        {
            res.render("users/all",
                {
                    title: "Researchers",
                    error_messages:
          [
              "Unable to retrieve information for user " + username,
              err
          ]
                }
            );
        }
    });
};
