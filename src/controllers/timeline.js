let app = require("../app");
let postController = require("../controllers/posts");

exports.my = function (req, res)
{
    let acceptsHTML = req.accepts("html");
    let acceptsJSON = req.accepts("json");
    let useRank = false;
    if (req.query.rank === "true")
    {
        useRank = true;
    }
    postController.getUserPostsUris(req.user.uri, 1, useRank, function (err, postUris)
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
