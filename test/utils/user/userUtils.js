const chai = require("chai");
const chaiHttp = require("chai-http");
chai.use(chaiHttp);

exports.loginUser = function (username, password, cb) {
    const app = global.tests.app;
    agent = chai.request.agent(app);
    agent
        .post('/login')
        .send({'username': username, 'password': password})
        .then(function (response, res) {
            if(response.ok)
            {
                cb(null, agent);
            }
            else
            {
                cb("Error authenticating user " + username, agent);
            }
        });
};

exports.logoutUser = function (agent, cb) {
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
            .set("Accept", "application/json")
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
            .set('Accept',"application/json")
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
            .set('Accept',"application/json")
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
            .set("Accept", "application/json")
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
    var contributors = {contributors:[username]};
    var path = "/project/" + projectHandle + "?administer";
    if(jsonOnly)
    {
        agent
            .post(path)
            .set("Accept", "application/json")
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
    var app = global.tests.app;
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
    var app = global.tests.app;
    agent = chai.request.agent(app);

    agent
        .post('/reset_password')
        .send({'email': email, 'token': token})
        .end(function (err, res) {
            cb(err, res);
        });
};

exports.getResetPasswordView = function (cb) {
    var app = global.tests.app;
    agent = chai.request.agent(app);
    agent
        .get('/reset_password')
        .end(function (err, res) {
            cb(err, res);
        });

};


exports.sendingNewPassword = function (email, token, pass, passConfirm, cb) {
    var app = global.tests.app;
    agent = chai.request.agent(app);

    agent
        .post('/set_new_password')
        .send({'email': email, 'token': token, 'new_password': pass, 'new_password_confirm': passConfirm})
        .end(function (err, res) {
            cb(err, res);
        });
};

exports.editUser = function (jsonOnly, agent, dataToEdit, cb) {
    let path = "/user/edit";
    if(jsonOnly){
        agent
            .post(path)
            .set('Accept',"application/json")
            .send(dataToEdit)
            .end(function(err,res){
                cb(err, res);
            });
    }
    else{
        agent
            .post(path)
            .send(dataToEdit)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

exports.uploadAvatar = function (jsonOnly, agent, avatar, cb) {
    let path = "/user_avatar";
    if(jsonOnly){
        agent
            .post(path)
            .set('Accept',"application/json")
            .send(avatar)
            .end(function(err,res){
                cb(err, res);
            });
    }
    else{
        agent
            .post(path)
            .send(avatar)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};


function binaryParser(res, callback) {
    res.setEncoding('binary');
    res.data = '';
    res.on('data', function (chunk) {
        res.data += chunk;
    });
    res.on("end", function () {
        callback(null, new Buffer(res.data, 'binary'));
    });
}

/*// example mocha test
 it('my test', function(done) {
 request(app)
 .get('/path/to/image.png')
 .expect(200)
 .expect("Content-Type", 'image.png')
 .buffer()
 .parse(binaryParser)
 .end(function(err, res) {
 if (err) return done(err);

 // binary response data is in res.body as a buffer
 assert.ok(Buffer.isBuffer(res.body));
 console.log("res=", res.body);

 done();
 });
 });*/


exports.getAvatar = function (jsonOnly, username, agent, cb) {
    let path = "/user/" + username + "?avatar";
    if(jsonOnly)
    {
        agent
            .get(path)
            //.set('Accept', 'image/webp,image/apng,image/*,*/*;q=0.8')
            //.set("Accept", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            //.set('Accept', 'image/webp,image/apng,image/*,*/*;q=0.8')
            .buffer()
            .parse(binaryParser)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

module.exports = exports;

