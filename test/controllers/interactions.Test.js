process.env.NODE_ENV = 'test';

let chai = require('chai');
let chaiHttp = require('chai-http');
chai.use(chaiHttp);

let should = chai.should();
const async = require('async');

let demouser1 = require("../mockdata/users/demouser1.js");
let demouser2 = require("../mockdata/users/demouser2.js");

let admin = require("../mockdata/users/admin.js");

let interactions = require("../mockdata/interactions/interactions.js");
let folder = require("../mockdata/folders/folder");

const publicProject = require("../mockdata/projects/public_project");

const publicProjectFolderUrl = "/project/"+ publicProject.handle +"/data"+folder.pathInProject+"/"+folder.name;
const nonExistentFolderUrl = "/project/"+ publicProject.handle +"/data"+folder.pathInProject+"/NON_EXISTENT_URL";

const interactionUtils = require("../utils/interactions/interactionsUtils");
const userUtils = require("../utils/user/userUtils");

describe('/interactions/:project/data/:filepath?register_interaction', function ()
{
    it('[HTML] should not register an interaction if Accept "application/json" header is absent', function (done)
    {
        userUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            async.map(interactions, function(interaction,callback){
                interactionUtils.recordInteraction(false, publicProjectFolderUrl, publicProject.handle, interaction, agent, (err, res) => {
                    res.should.have.status(405);
                    JSON.parse(res.text).result.should.equal("error");
                    JSON.parse(res.text).message.should.equal("Method accessible only via API. Please add the \"Accept : application/json\" header to the HTTP request.");
                    callback(null, res.text);
                });
            }, function(err, results){
                console.log("Results " + JSON.stringify(results));
                done(err);
            });
        });
    });

    it('[JSON] should not register an interaction if user is unauthenticated', function (done)
    {
        userUtils.logoutUser(function (err, agent) {
            async.map(interactions, function(interaction,callback){
                interactionUtils.recordInteraction(false, publicProjectFolderUrl, publicProject.handle, interaction, agent, (err, res) => {
                    res.should.have.status(405);
                    JSON.parse(res.text).result.should.equal("error");
                    JSON.parse(res.text).message.should.equal("Please log into Dendro");
                    callback(null, res.text);
                });
            }, function(err, results){
                console.log("Results " + JSON.stringify(results));
                done(err);
            });
        });
    });

    it('[JSON] should not register an interaction if the folder or file does not exist', function (done)
    {
        let interactionsOverNonExistentFile = JSON.parse(JSON.stringify(require("../mockdata/interactions/interactions.js")));

        userUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            async.map(interactionsOverNonExistentFile, function(interaction,callback){
                interaction.ddr.originallyRecommendedFor = nonExistentFolderUrl;
                interactionUtils.recordInteraction(false, publicProjectFolderUrl, publicProject.handle, interaction, agent, (err, res) => {
                        res.should.have.status(401);
                        JSON.parse(res.text).result.should.equal("error");
                        JSON.parse(res.text).message.should.equal("Resource with URI " + nonExistentFolderUrl + " does not exist.");
                        callback(null, res.text);
                    });
            }, function(err, results){
                console.log("Results " + JSON.stringify(results));
                done(err);
            });
        });
    });

    it('[JSON] should not register an interaction if interaction type is missing', function (done)
    {
        let interactionsWithoutType = JSON.parse(JSON.stringify(require("../mockdata/interactions/interactions.js")));

        userUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            async.map(interactionsWithoutType, function(interaction,callback){
                delete interaction.ddr.interactionType;
                interactionUtils.recordInteraction(false, publicProjectFolderUrl, publicProject.handle, interaction, agent, (err, res) => {
                        res.should.have.status(405);
                        JSON.parse(res.text).result.should.equal("error");
                        JSON.parse(res.text).message.should.equal("Resource with URI " + nonExistentFolderUrl + " does not exist.");
                        callback(null, res.text);
                    });
            }, function(err, results){
                console.log("Results " + JSON.stringify(results));
                done(err);
            });
        });
    });

    it('[JSON] should not delete all interactions unless the user is a Dendro admin', function (done)
    {
        //TODO
        done();
    });

    it('[JSON] should delete all interactions if the user is a Dendro admin', function (done)
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

