let app = require("../app");
let postController = require("../controllers/posts");

exports.my = function (req, res)
{
    var acceptsHTML = req.accepts("html");
    var acceptsJSON = req.accepts("json");

    postController.getUserPostsUris(req.user.uri, 1, function (err, postUris)
    {
        if (!err)
        {
            let postURIS_stringified = JSON.stringify(postUris);
            res.render("social/timeline", {
                posts: postURIS_stringified
            });

            /* res.render('social/timeline', {
                posts : postUris
            }); */
        }
        else
        {
            res.render("index",
                {
                    error_messages: ["Timeline error: " + err]
                }
            );
        }
    });
};
