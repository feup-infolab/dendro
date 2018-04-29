let app = require("../app");
let postController = require("../controllers/posts");

const Pathfinder = global.Pathfinder;
const dbMySQL = require(Pathfinder.absPathInSrcFolder("mysql_models"));

exports.my = function (req, res)
{
    const getURIsAndRender = function (useRank, nextPosition, lastAccess)
    {
        postController.getUserPostsUris(req.user.uri, 1, useRank, nextPosition, lastAccess, function (err, postUris)
        {
            if (!err)
            {
                let postURIS_stringified = JSON.stringify(postUris);
                res.render("social/timeline", {
                    posts: postURIS_stringified,
                    useRank: useRank
                });
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
    let useRank = false;
    if (req.query.rank === "true")
    {
        useRank = true;
    }
    if (useRank)
    {
        let newTimeline = {
            userURI: req.userURI
        };
        dbMySQL.timeline
            .findOrCreate({where: {userURI: req.user.uri}, defaults: newTimeline})
            .spread((timeline, created) => {
                getURIsAndRender(true, timeline.nextPosition, timeline.lastAccess);
                if (!created)
                {
                    return timeline.update({
                        lastAccess: new Date()
                    });
                }
            }).catch(err => {
                console.log(err);
            });
    }
    else
    {
        getURIsAndRender(false, null, null);
    }
};
