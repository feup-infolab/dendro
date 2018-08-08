const rlequire = require("rlequire");

let postController = rlequire("dendro", "src/controllers/posts");
const dbMySQL = rlequire("dendro", "src/mysql_models/index");

exports.my = function (req, res)
{
    const getURIsAndRender = function (useRank, nextPosition, lastAccess, timelineId)
    {
        postController.getUserPostsUris(req.user.uri, 1, useRank, nextPosition, lastAccess, timelineId, function (err, postUris)
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
    let type = "";
    let useRank = req.query.rank === "true" ? 1 : 0;
    if (useRank)
    {
        type = "ranked";
    }
    else
    {
        type = "unranked";
    }
    let newTimeline = {
        userURI: req.userURI,
        type: type
    };
    dbMySQL.timeline
        .findOrCreate({where: {userURI: req.user.uri, type: type}, defaults: newTimeline})
        .spread((timeline, created) =>
        {
            if (!created)
            {
                getURIsAndRender(useRank, timeline.nextPosition, timeline.lastAccess, timeline.id);
                return timeline.update({
                    lastAccess: new Date()
                });
            }
            getURIsAndRender(useRank, timeline.nextPosition, null, timeline.id);
        }).catch(err =>
        {
            console.log(err);
        });
};
