var chai = require('chai');
var chaiHttp = require('chai-http');
var _ = require('underscore');
chai.use(chaiHttp);

var getAllPostsFromUserProjects = function (jsonOnly, agent, cb) {
    // /posts/all
    var path = '/posts/all';
    if(jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

module.exports = {
    getAllPostsFromUserProjects: getAllPostsFromUserProjects
};
