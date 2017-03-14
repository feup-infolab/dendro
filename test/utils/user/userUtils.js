var chai = require('chai');
var chaiHttp = require('chai-http');
chai.use(chaiHttp);

exports.loginUser = function (username, password, cb) {
    var app = GLOBAL.tests.app;
    agent = chai.request.agent(app);
    agent
        .post('/login')
        .send({'username': username, 'password': password})
        .end(function (err, res) {
            cb(err, agent);
        });
};


exports.getLoggedUserDetails = function (jsonOnly, agent, cb)
{
    if(jsonOnly)
    {
        agent
            .get('/me')
            .set('Accept', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get('/me')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

exports.listAllUsers= function (jsonOnly, agent, cb) {
    if(jsonOnly){
        agent
            .get('/users')
            .set('Accept','application/json')
            .end(function(err,res){
                cb(err, res);
            });
    }
    else{
        agent
            .get('/users')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

exports.getUserInfo= function (jsonOnly, agent, cb) {
    if(jsonOnly){
        agent
            .get('/user/demouser1')
            .end(function(err,res){
                cb(err, res);
            });
    }
    else{
        agent
            .get('/user/demouser1')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};