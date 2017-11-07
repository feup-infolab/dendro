const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

module.exports.getRegisterUser = function (jsonOnly, agent, cb)
{
    if (jsonOnly)
    {
        agent
            .get('/register')
            .set('Accept', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get('/register')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

module.exports.postRegisterUser = function (jsonOnly, agent, user, cb)
{
    if (jsonOnly)
    {
        agent
            .post('/register')
            .set('Accept', 'application/json')
            .send(user)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post('/register')
            .send(user)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};
