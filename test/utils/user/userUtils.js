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

exports.logoutUser = function (cb) {
    const app = GLOBAL.tests.app;
    agent = chai.request.agent(app);
    agent
        .get('/logout')
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

exports.getUserInfo= function (user, jsonOnly, agent, cb) {
    if(jsonOnly){
        agent
            .get('/user/' + user)
            .set('Accept','application/json')
            .end(function(err,res){
                cb(err, res);
            });
    }
    else{
        agent
            .get('/user/' + user)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

exports.getCurrentLoggedUser= function (jsonOnly, agent, cb)
{
    if(jsonOnly)
    {
        agent
            .get('/users/loggedUser')
            .set('Accept', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get('/users/loggedUser')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

exports.addUserAscontributorToProject = function (jsonOnly, agent, username, projectHandle, cb) {
    var contributors = {contributors:["http://" + Config.host + "/user/" + username]};
    var path = "/project/" + projectHandle + "?administer";
    if(jsonOnly)
    {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .send(contributors)
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(contributors)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};


exports.newPassword = function (query, cb) {
    var app = GLOBAL.tests.app;
    agent = chai.request.agent(app);
    var path = '/set_new_password';
    if(query){
        path += query;
    }

    agent
        .get(path)
        .end(function (err, res) {
            cb(err, res);
        });

};

exports.sendingPassword = function (email, token, cb) {
    var app = GLOBAL.tests.app;
    agent = chai.request.agent(app);

    agent
        .post('/reset_password')
        .send({'email': email, 'token': token})
        .end(function (err, res) {
            cb(err, res);
        });
};

exports.getResetPasswordView = function (cb) {
    var app = GLOBAL.tests.app;
    agent = chai.request.agent(app);
    agent
        .get('/reset_password')
        .end(function (err, res) {
            cb(err, res);
        });

};


exports.sendingNewPassword = function (email, token, pass, passConfirm, cb) {
    var app = GLOBAL.tests.app;
    agent = chai.request.agent(app);

        agent
            .post('/set_new_password')
            .send({'email': email, 'token': token, 'new_password': pass, 'new_password_confirm': passConfirm})
            .end(function (err, res) {
                cb(err, res);
            });
};

