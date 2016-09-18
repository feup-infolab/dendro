var Config = require('../models/meta/config.js').Config;

var Post = require(Config.absPathInSrcFolder("/models/social/post.js")).Post;
var Ontology = require(Config.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;

var db_social = function() { return GLOBAL.db.social; }();

var async = require('async');

exports.all = function(req, res){
    var currentUser = req.session.user;
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        Post.all(req, function (err, posts)
        {
            if (!err)
            {
                async.map(posts, function(post, callback){
                    Post.findByUri(post.uri, function(err, loadedPost){
                        if(!err)
                        {
                            callback(null, loadedPost);
                        }
                        else
                        {
                            callback(err, null);
                        }
                    }, Ontology.getAllOntologiesUris(), db_social.graphUri);
                }, function(err, loadedPosts){
                    if(!err)
                    {
                        res.json(loadedPosts);
                    }
                    else
                    {
                        res.status(500).json({
                            result : "Error",
                            message : "Error retrieving post contents. " + JSON.stringify(err)
                        });
                    }
                });

            }
            else
            {
                res.status(500).json({
                    result : "Error",
                    message : "Error retrieving post URIs. " + JSON.stringify(err)
                });
            }
        }, db_social.graphUri);
    }
    else
    {
        var msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing";
        req.flash('error', "Invalid Request");
        console.log(msg);
        res.status(400).json({
            result : "Error",
            message : msg
        });
    }
};

exports.new = function(req, res){

    var currentUser = req.session.user;

    if(req.body.new_post_content != null)
    {
        var newPost = new Post({
            ddr: {
                hasContent: req.body.new_post_content
            },
            dcterms: {
                creator : currentUser.uri
            }
        });

        newPost.save(function(err, post)
        {
            if (!err)
            {
                res.json({
                    result : "OK",
                    message : "Post saved successfully"
                });
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Error saving post. " + JSON.stringify(post)
                });
            }
        }, false, null, null, null, null, db_social.graphUri);
    }
    else
    {
        res.status(400).json({
            result: "Error",
            message: "Error saving post. The request body does not contain the content of the new post (new_body_content field missing)"
        });
    }
};