process.env.NODE_ENV = 'test';

let chai = require('chai');
let chaiHttp = require('chai-http');
chai.use(chaiHttp);

let should = chai.should();

let agent = null;

let demouser1 = require("../mockdata/users/demouser1.js");
let demouser2 = require("../mockdata/users/demouser2.js");

describe('/interactions/:project/data/:filepath?register_interaction', function ()
{
    it('[HTML] should not register an interaction if "application/json" Accept header is absent', function (done)
    {
        const agent = GLOBAL.tests.agent;

        agent
            .post('/interactions/' + + "/data/" + folder + "?register_interaction" )
            .send({
                
            })
            .end((err, res) => {
                res.should.have.status(200);
                res.text.should.not.include('Successfully logged out');
                res.text.should.include.include('Cannot log you out because you are not logged in');
                done();
            });
    });

    it('[JSON] should not register an interaction if information is missing', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should not register an interaction if there is no logged in user', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should not register an interaction if user is unauthenticated', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should not delete all interactions unless the user is a Dendro admin', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should register an interaction of each type for the user ' + demouser1.username, function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should register two interactions of each type for the user ' + demouser2.username, function (done)
    {
        //TODO
        done();
    });
});

