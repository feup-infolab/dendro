const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
const md5 = require("md5");
const fs = require("fs");
const path = require("path");
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const interactionsUtils = require(Pathfinder.absPathInTestsFolder("utils/interactions/interactionsUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));

const publicProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));

const createFilesUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/files/createFiles.Unit.js"));

let projectRootData = null;
let dctermsUri = "http://purl.org/dc/terms/";
let foafUri = "http://xmlns.com/foaf/0.1/";

let demouser1InteractionObj = {uri: dctermsUri};
let demouser2InteractionObj = {uri: foafUri};

describe("[" + publicProject.handle + "]" + "[INTERACTION TESTS] select_ontology_manually", function ()
{
    this.timeout(Config.testsTimeout);
    before(function (done)
    {
        createFilesUnit.setup(function (err, results)
        {
            should.equal(err, null);
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                should.equal(err, null);
                projectUtils.getProjectRootContent(true, agent, publicProject.handle, function (err, res)
                {
                    should.equal(err, null);
                    should.exist(res);
                    projectRootData = res.body;
                    should.exist(projectRootData);
                    demouser1InteractionObj.interactionType = "select_ontology_manually";
                    demouser1InteractionObj.recommendedFor = projectRootData[0].uri;
                    demouser1InteractionObj.rankingPosition = 0;
                    demouser2InteractionObj.interactionType = "select_ontology_manually";
                    demouser2InteractionObj.recommendedFor = projectRootData[0].uri;
                    demouser2InteractionObj.rankingPosition = 0;
                    done();
                });
            });
        });
    });

    describe("[POST] [Invalid Cases] /interactions/select_ontology_manually", function ()
    {
        it("Should give an error and not accept and register an interaction when an ontology is selected manually when unauthenticated", function (done)
        {
            const app = global.tests.app;
            let agent = chai.request.agent(app);
            interactionsUtils.selectOntologyManually(true, agent, demouser1InteractionObj, function (err, res)
            {
                should.exist(err);
                res.statusCode.should.equal(401);
                // SHOULD NOT BE IN THE MYSQL DATABASE
                interactionsUtils.getNumberOfInteractionsInDB(function (err, info)
                {
                    should.equal(err, null);
                    should.exist(info);
                    info[0].nInteractions.should.equal(0);
                    done();
                });
            });
        });

        it("Should give an error and not accept and register an interaction when an ontology is selected manually from the quick list when logged in as demouser3, who is not a creator or collaborator of the project where the current resource belongs to", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                interactionsUtils.selectOntologyManually(true, agent, demouser1InteractionObj, function (err, res)
                {
                    should.exist(err);
                    console.log("Error message is: " + res.body.message);
                    res.statusCode.should.equal(400);
                    res.body.message.should.contain("Unable to record interactions for resources of projects of which you are not a creator or contributor.");
                    // SHOULD NOT BE IN THE MYSQL DATABASE
                    interactionsUtils.getNumberOfInteractionsInDB(function (err, info)
                    {
                        should.equal(err, null);
                        should.exist(info);
                        info[0].nInteractions.should.equal(0);
                        done();
                    });
                });
            });
        });

        it("Should give an error and not accept and register an interaction if the interaction type field is invalid, even if logged in as demouser1 (creator of the project)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                let copyOfDemouser1InteractionObj = JSON.parse(JSON.stringify(demouser1InteractionObj));
                copyOfDemouser1InteractionObj.interactionType = "invalid_interaction_type";
                interactionsUtils.selectOntologyManually(true, agent, copyOfDemouser1InteractionObj, function (err, res)
                {
                    should.exist(err);
                    should.exist(res);
                    res.statusCode.should.equal(500);
                    res.body.message.should.equal("Invalid interaction type in the request's body. It should be : select_ontology_manually");
                    // SHOULD NOT BE IN THE MYSQL DATABASE
                    interactionsUtils.getNumberOfInteractionsInDB(function (err, info)
                    {
                        should.equal(err, null);
                        should.exist(info);
                        info[0].nInteractions.should.equal(0);
                        done();
                    });
                });
            });
        });

        it("Should give an error and not accept and register an interaction if the interaction type field is missing, even if logged in as demouser1 (creator of the project)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                let copyOfDemouser1InteractionObj = JSON.parse(JSON.stringify(demouser1InteractionObj));
                delete copyOfDemouser1InteractionObj.interactionType;
                interactionsUtils.selectOntologyManually(true, agent, copyOfDemouser1InteractionObj, function (err, res)
                {
                    should.exist(err);
                    should.exist(res);
                    res.statusCode.should.equal(500);
                    res.body.message.should.equal("Invalid interaction type in the request's body. It should be : select_ontology_manually");
                    // SHOULD NOT BE IN THE MYSQL DATABASE
                    interactionsUtils.getNumberOfInteractionsInDB(function (err, info)
                    {
                        should.equal(err, null);
                        should.exist(info);
                        info[0].nInteractions.should.equal(0);
                        done();
                    });
                });
            });
        });

        it("Should give an error and not accept and register an interaction if the interaction type field is null, even if logged in as demouser1 (creator of the project)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                let copyOfDemouser1InteractionObj = JSON.parse(JSON.stringify(demouser1InteractionObj));
                copyOfDemouser1InteractionObj.interactionType = null;
                interactionsUtils.selectOntologyManually(true, agent, copyOfDemouser1InteractionObj, function (err, res)
                {
                    should.exist(err);
                    should.exist(res);
                    res.statusCode.should.equal(500);
                    res.body.message.should.equal("Invalid interaction type in the request's body. It should be : select_ontology_manually");
                    // SHOULD NOT BE IN THE MYSQL DATABASE
                    interactionsUtils.getNumberOfInteractionsInDB(function (err, info)
                    {
                        should.equal(err, null);
                        should.exist(info);
                        info[0].nInteractions.should.equal(0);
                        done();
                    });
                });
            });
        });

        it("Should give an error and not accept and register an interaction if the recommendedFor field is invalid, even if logged in as demouser1 (creator of the project)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                let copyOfDemouser1InteractionObj = JSON.parse(JSON.stringify(demouser1InteractionObj));
                copyOfDemouser1InteractionObj.recommendedFor = "invalid_recomended_for";
                interactionsUtils.selectOntologyManually(true, agent, copyOfDemouser1InteractionObj, function (err, res)
                {
                    should.exist(err);
                    should.exist(res);
                    res.statusCode.should.equal(404);
                    res.body.message.should.equal("Resource with uri invalid_recomended_for not found in this system.");
                    // SHOULD NOT BE IN THE MYSQL DATABASE
                    interactionsUtils.getNumberOfInteractionsInDB(function (err, info)
                    {
                        should.equal(err, null);
                        should.exist(info);
                        info[0].nInteractions.should.equal(0);
                        done();
                    });
                });
            });
        });

        it("Should give an error and not accept and register an interaction if the recommendedFor field is missing, even if logged in as demouser1 (creator of the project)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                let copyOfDemouser1InteractionObj = JSON.parse(JSON.stringify(demouser1InteractionObj));
                delete copyOfDemouser1InteractionObj.recommendedFor;
                interactionsUtils.selectOntologyManually(true, agent, copyOfDemouser1InteractionObj, function (err, res)
                {
                    should.exist(err);
                    should.exist(res);
                    res.statusCode.should.equal(400);
                    res.body.message.should.equal("Request Body JSON is invalid since it has no 'recommendedFor' field, which should contain the current URL when the interaction took place. Either that, or the field is not a string as it should be.");
                    // SHOULD NOT BE IN THE MYSQL DATABASE
                    interactionsUtils.getNumberOfInteractionsInDB(function (err, info)
                    {
                        should.equal(err, null);
                        should.exist(info);
                        info[0].nInteractions.should.equal(0);
                        done();
                    });
                });
            });
        });

        it("Should give an error and not accept and register an interaction if the recommendedFor field is null, even if logged in as demouser1 (creator of the project)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                let copyOfDemouser1InteractionObj = JSON.parse(JSON.stringify(demouser1InteractionObj));
                copyOfDemouser1InteractionObj.recommendedFor = null;
                interactionsUtils.selectOntologyManually(true, agent, copyOfDemouser1InteractionObj, function (err, res)
                {
                    should.exist(err);
                    should.exist(res);
                    res.statusCode.should.equal(400);
                    res.body.message.should.equal("Request Body JSON is invalid since it has no 'recommendedFor' field, which should contain the current URL when the interaction took place. Either that, or the field is not a string as it should be.");
                    // SHOULD NOT BE IN THE MYSQL DATABASE
                    interactionsUtils.getNumberOfInteractionsInDB(function (err, info)
                    {
                        should.equal(err, null);
                        should.exist(info);
                        info[0].nInteractions.should.equal(0);
                        done();
                    });
                });
            });
        });

        it("Should give an error and not accept and register an interaction if the executorOver(ontology uri) field is invalid, even if logged in as demouser1 (creator of the project)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                let copyOfDemouser1InteractionObj = JSON.parse(JSON.stringify(demouser1InteractionObj));
                copyOfDemouser1InteractionObj.uri = "invalid_executed_over";
                interactionsUtils.selectOntologyManually(true, agent, copyOfDemouser1InteractionObj, function (err, res)
                {
                    should.exist(err);
                    should.exist(res);
                    res.statusCode.should.equal(500);
                    res.body.message.should.equal("Interaction type select_ontology_manually requires a valid ontology 'uri' in the request's body. It represents the ontology to be selected.");
                    // SHOULD NOT BE IN THE MYSQL DATABASE
                    interactionsUtils.getNumberOfInteractionsInDB(function (err, info)
                    {
                        should.equal(err, null);
                        should.exist(info);
                        info[0].nInteractions.should.equal(0);
                        done();
                    });
                });
            });
        });

        it("Should give an error and not accept and register an interaction if the executorOver(ontology uri) field is missing, even if logged in as demouser1 (creator of the project)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                let copyOfDemouser1InteractionObj = JSON.parse(JSON.stringify(demouser1InteractionObj));
                delete copyOfDemouser1InteractionObj.uri;
                interactionsUtils.selectOntologyManually(true, agent, copyOfDemouser1InteractionObj, function (err, res)
                {
                    should.exist(err);
                    should.exist(res);
                    res.statusCode.should.equal(500);
                    res.body.message.should.equal("Interaction type select_ontology_manually requires field uri in the request's body. It represents the ontology to be selected.");
                    // SHOULD NOT BE IN THE MYSQL DATABASE
                    interactionsUtils.getNumberOfInteractionsInDB(function (err, info)
                    {
                        should.equal(err, null);
                        should.exist(info);
                        info[0].nInteractions.should.equal(0);
                        done();
                    });
                });
            });
        });

        it("Should give an error and not accept and register an interaction if the executorOver(ontology uri) field is null, even if logged in as demouser1 (creator of the project)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                let copyOfDemouser1InteractionObj = JSON.parse(JSON.stringify(demouser1InteractionObj));
                copyOfDemouser1InteractionObj.uri = null;
                interactionsUtils.selectOntologyManually(true, agent, copyOfDemouser1InteractionObj, function (err, res)
                {
                    should.exist(err);
                    should.exist(res);
                    res.statusCode.should.equal(500);
                    res.body.message.should.equal("Interaction type select_ontology_manually requires field uri in the request's body. It represents the ontology to be selected.");
                    // SHOULD NOT BE IN THE MYSQL DATABASE
                    interactionsUtils.getNumberOfInteractionsInDB(function (err, info)
                    {
                        should.equal(err, null);
                        should.exist(info);
                        info[0].nInteractions.should.equal(0);
                        done();
                    });
                });
            });
        });

        it("Should give an error and not accept and register an interaction if the rankingPosition field is invalid, even if logged in as demouser1 (creator of the project)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                let copyOfDemouser1InteractionObj = JSON.parse(JSON.stringify(demouser1InteractionObj));
                copyOfDemouser1InteractionObj.rankingPosition = "invalid_ranking_position";
                interactionsUtils.selectOntologyManually(true, agent, copyOfDemouser1InteractionObj, function (err, res)
                {
                    should.exist(err);
                    should.exist(res);
                    res.statusCode.should.equal(500);
                    res.body.message.should.equal("Invalid ranking position in the request's body. It should be an integer");
                    // SHOULD NOT BE IN THE MYSQL DATABASE
                    interactionsUtils.getNumberOfInteractionsInDB(function (err, info)
                    {
                        should.equal(err, null);
                        should.exist(info);
                        info[0].nInteractions.should.equal(0);
                        done();
                    });
                });
            });
        });

        it("Should give an error and not accept and register an interaction if the rankingPosition field is missing, even if logged in as demouser1 (creator of the project)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                let copyOfDemouser1InteractionObj = JSON.parse(JSON.stringify(demouser1InteractionObj));
                delete copyOfDemouser1InteractionObj.rankingPosition;
                interactionsUtils.selectOntologyManually(true, agent, copyOfDemouser1InteractionObj, function (err, res)
                {
                    should.exist(err);
                    should.exist(res);
                    res.statusCode.should.equal(500);
                    res.body.message.should.equal("Invalid ranking position in the request's body. It should be an integer");
                    // SHOULD NOT BE IN THE MYSQL DATABASE
                    interactionsUtils.getNumberOfInteractionsInDB(function (err, info)
                    {
                        should.equal(err, null);
                        should.exist(info);
                        info[0].nInteractions.should.equal(0);
                        done();
                    });
                });
            });
        });

        it("Should give an error and not accept and register an interaction if the rankingPosition field is null, even if logged in as demouser1 (creator of the project)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                let copyOfDemouser1InteractionObj = JSON.parse(JSON.stringify(demouser1InteractionObj));
                copyOfDemouser1InteractionObj.rankingPosition = null;
                interactionsUtils.selectOntologyManually(true, agent, copyOfDemouser1InteractionObj, function (err, res)
                {
                    should.exist(err);
                    should.exist(res);
                    res.statusCode.should.equal(500);
                    res.body.message.should.equal("Invalid ranking position in the request's body. It should be an integer");
                    // SHOULD NOT BE IN THE MYSQL DATABASE
                    interactionsUtils.getNumberOfInteractionsInDB(function (err, info)
                    {
                        should.equal(err, null);
                        should.exist(info);
                        info[0].nInteractions.should.equal(0);
                        done();
                    });
                });
            });
        });

        it("Should give an error and not accept and register an interaction if all the required fields are missing, even if logged in as demouser1 (creator of the project)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                let copyOfDemouser1InteractionObj = JSON.parse(JSON.stringify(demouser1InteractionObj));
                delete copyOfDemouser1InteractionObj.recommendationCallTimeStamp;
                delete copyOfDemouser1InteractionObj.interactionType;
                delete copyOfDemouser1InteractionObj.uri;
                delete copyOfDemouser1InteractionObj.recommendedFor;
                delete copyOfDemouser1InteractionObj.rankingPosition;
                delete copyOfDemouser1InteractionObj.pageNumber;
                delete copyOfDemouser1InteractionObj.recommendationCallId;
                delete copyOfDemouser1InteractionObj.recommendationCallTimeStamp;
                interactionsUtils.selectOntologyManually(true, agent, copyOfDemouser1InteractionObj, function (err, res)
                {
                    should.exist(err);
                    should.exist(res);
                    res.statusCode.should.equal(500);
                    // because it is the first validation that fails when checking on the server side, even if all fields are missing
                    res.body.message.should.equal("Invalid interaction type in the request's body. It should be : select_ontology_manually");
                    // SHOULD NOT BE IN THE MYSQL DATABASE
                    interactionsUtils.getNumberOfInteractionsInDB(function (err, info)
                    {
                        should.equal(err, null);
                        should.exist(info);
                        info[0].nInteractions.should.equal(0);
                        done();
                    });
                });
            });
        });

        it("Should give an error and not accept and register an interaction if the body contents is null, even if logged in as demouser1 (creator of the project)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                let copyOfDemouser1InteractionObj = null;
                interactionsUtils.selectOntologyManually(true, agent, copyOfDemouser1InteractionObj, function (err, res)
                {
                    should.exist(err);
                    should.exist(res);
                    res.statusCode.should.equal(500);
                    // because it is the first validation that fails when checking on the server side, even if all fields are missing
                    res.body.message.should.equal("Invalid interaction type in the request's body. It should be : select_ontology_manually");
                    // SHOULD NOT BE IN THE MYSQL DATABASE
                    interactionsUtils.getNumberOfInteractionsInDB(function (err, info)
                    {
                        should.equal(err, null);
                        should.exist(info);
                        info[0].nInteractions.should.equal(0);
                        done();
                    });
                });
            });
        });
    });

    describe("[POST] [Valid Cases] /interactions/select_ontology_manually", function ()
    {
        it("Should accept and register an interaction when an ontology is selected manually when logged in as demouser1 (the creator of the current project)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                userUtils.getUserInfo(demouser1.username, true, agent, function (err, res)
                {
                    should.equal(err, null);
                    should.exist(res);
                    should.exist(res.body);
                    should.exist(res.body.uri);
                    let demouser1Uri = res.body.uri;
                    interactionsUtils.selectOntologyManually(true, agent, demouser1InteractionObj, function (err, res)
                    {
                        should.equal(err, null);
                        res.statusCode.should.equal(200);
                        // SHOULD ALSO BE IN THE MYSQL DATABASE
                        interactionsUtils.getNumberOfInteractionsInDB(function (err, info)
                        {
                            should.equal(err, null);
                            should.exist(info);
                            info[0].nInteractions.should.equal(1);
                            interactionsUtils.getLatestInteractionInDB(function (err, info)
                            {
                                should.equal(err, null);
                                should.exist(info);
                                info.length.should.equal(1);
                                demouser1InteractionObj.uri.should.not.equal(demouser2InteractionObj.uri);
                                info[0].executedOver.should.equal(demouser1InteractionObj.uri);
                                info[0].interactionType.should.equal(demouser1InteractionObj.interactionType);
                                info[0].originallyRecommendedFor.should.equal(demouser1InteractionObj.recommendedFor);
                                info[0].performedBy.should.equal(demouser1Uri);
                                info[0].rankingPosition.should.equal(demouser1InteractionObj.rankingPosition);
                                should.exist(info[0].uri);
                                info[0].uri.should.contain("interaction");
                                done();
                            });
                        });
                    });
                });
            });
        });

        it("Should accept and register an interaction when an ontology is selected manually when logged in as demouser2 (a collaborator on the current project)", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                userUtils.getUserInfo(demouser2.username, true, agent, function (err, res)
                {
                    should.equal(err, null);
                    should.exist(res);
                    should.exist(res.body);
                    should.exist(res.body.uri);
                    let demouser2Uri = res.body.uri;
                    interactionsUtils.selectOntologyManually(true, agent, demouser2InteractionObj, function (err, res)
                    {
                        should.equal(err, null);
                        res.statusCode.should.equal(200);
                        // SHOULD ALSO BE IN THE MYSQL DATABASE
                        interactionsUtils.getNumberOfInteractionsInDB(function (err, info)
                        {
                            should.equal(err, null);
                            should.exist(info);
                            info[0].nInteractions.should.equal(2);
                            interactionsUtils.getLatestInteractionInDB(function (err, info)
                            {
                                should.equal(err, null);
                                should.exist(info);
                                info.length.should.equal(1);
                                demouser1InteractionObj.uri.should.not.equal(demouser2InteractionObj.uri);
                                info[0].executedOver.should.equal(demouser2InteractionObj.uri);
                                info[0].interactionType.should.equal(demouser2InteractionObj.interactionType);
                                info[0].originallyRecommendedFor.should.equal(demouser2InteractionObj.recommendedFor);
                                info[0].performedBy.should.equal(demouser2Uri);
                                info[0].rankingPosition.should.equal(demouser2InteractionObj.rankingPosition);
                                should.exist(info[0].uri);
                                info[0].uri.should.contain("interaction");
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    after(function (done)
    {
        // destroy graphs

        appUtils.clearAppState(function (err, data)
        {
            should.equal(err, null);
            done(err);
        });
    });
});
