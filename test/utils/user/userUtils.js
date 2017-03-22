const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

exports.loginUser = function (username, password, cb) {
    const app = GLOBAL.tests.app;
    agent = chai.request.agent(app);
    agent
        .post('/login')
        .send({'username': username, 'password': password})
        .end(function (err, res) {
            cb(err, agent);
        });
};

exports.getRegisterUser = function (jsonOnly, agent, cb)
{
    if(jsonOnly)
    {
        agent
            .get('/register')
            .set('Accept', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get('/register')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

exports.postRegisterUser = function (jsonOnly, agent, cb)
{
    if(jsonOnly)
    {
        agent
            .post('/register')
            .set('Accept', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post('/register')
            .end(function (err, res) {
                cb(err, res);
            });
    }
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