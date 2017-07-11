let app = require('../app');
let postController = require("../controllers/posts");

exports.my = function (req, res) {
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    postController.getUserPostsUris(req.user.uri, 1, function (err, postUris) {
        if(!err)
        {
            res.render('social/timeline', {
                posts : JSON.stringify(postUris)
            });
        }
        else
        {
            res.render('index',
                {
                    error_messages : ["Timeline error: " +  err]
                }
            );
        }
    });
};