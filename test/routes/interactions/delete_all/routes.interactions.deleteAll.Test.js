const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
const md5 = require("md5");
const fs = require("fs");
const path = require("path");
chai.use(chaiHttp);

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const projectUtils = rlequire("dendro", "test/utils/project/projectUtils.js");
const appUtils = rlequire("dendro", "test/utils/app/appUtils.js");
const descriptorUtils = rlequire("dendro", "test/utils/descriptor/descriptorUtils.js");
const interactionsUtils = rlequire("dendro", "test/utils/interactions/interactionsUtils.js");
const Interaction = rlequire("dendro", "src/models/recommendation/interaction.js").Interaction;

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1.js");
const demouser2 = rlequire("dendro", "test/mockdata/users/demouser2.js");
const demouser3 = rlequire("dendro", "test/mockdata/users/demouser3.js");
const admin = rlequire("dendro", "test/mockdata/users/admin.js");

const publicProject = rlequire("dendro", "test/mockdata/projects/public_project.js");

const createFilesUnit = rlequire("dendro", "test/units/files/createFiles.Unit.js");

/* let bodyObj = {
    "prefix": "dcterms",
    "shortName": "abstract",
    "ontology": "http://purl.org/dc/terms/",
    "uri": "http://purl.org/dc/terms/abstract",
    "prefixedForm": "dcterms:abstract",
    "type": 3,
    "control": "markdown_box",
    "label": "Abstract",
    "comment": "A summary of the resource.",
    "recommendation_types": {
        "dc_element_forced": true
    },
    "recommendationCallId": "abe11605-5bd4-4669-913e-42d34206df25",
    "recommendationCallTimeStamp": "2018-02-27T16:30:26.545Z",
    "$$hashKey": "object:170",
    "just_added": true,
    "added_from_quick_list": true,
    "rankingPosition": 2,
    "pageNumber": 0,
    "interactionType": "delete_all",
    "recommendedFor": "/r/folder/403de121-d0fc-4329-a534-e87c997b5596"
};*/
let projectRootData = null;
let dctermsDescriptors = null;
let dctermsPrefix = "dcterms";

let demouser1InteractionObj = null;
let demouser2InteractionObj = null;

describe("[" + publicProject.handle + "]" + "[INTERACTION TESTS] delete_all", function ()
{
    this.timeout(Config.tests.timeout);
    before(function (done)
    {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        {
            should.equal(err, null);
            projectUtils.getProjectRootContent(true, agent, publicProject.handle, function (err, res)
            {
                should.equal(err, null);
                should.exist(res);
                projectRootData = res.body;
                should.exist(projectRootData);
                descriptorUtils.getDescriptorsFromOntology(true, agent, dctermsPrefix, function (err, res)
                {
                    should.equal(err, null);
                    should.exist(res);
                    dctermsDescriptors = res.body.descriptors;
                    should.exist(dctermsDescriptors);
                    demouser1InteractionObj = dctermsDescriptors[0];
                    demouser1InteractionObj.just_added = true;
                    demouser1InteractionObj.added_from_quick_list = true;
                    // demouser1InteractionObj.rankingPosition = index;
                    demouser1InteractionObj.rankingPosition = 0;
                    // demouser1InteractionObj.pageNumber = $scope.recommendations_page;
                    demouser1InteractionObj.pageNumber = 2;
                    demouser1InteractionObj.interactionType = "accept_descriptor_from_quick_list";
                    demouser1InteractionObj.recommendedFor = projectRootData[0].uri;

                    demouser2InteractionObj = dctermsDescriptors[1];
                    demouser2InteractionObj.just_added = true;
                    demouser2InteractionObj.added_from_quick_list = true;
                    demouser2InteractionObj.rankingPosition = 0;
                    demouser2InteractionObj.pageNumber = 2;
                    demouser2InteractionObj.interactionType = "accept_descriptor_from_quick_list";
                    demouser2InteractionObj.recommendedFor = projectRootData[0].uri;

                    userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
                    {
                        userUtils.getUserInfo(demouser1.username, true, agent, function (err, res)
                        {
                            should.equal(err, null);
                            should.exist(res);
                            should.exist(res.body);
                            should.exist(res.body.uri);
                            let demouser1Uri = res.body.uri;
                            interactionsUtils.acceptDescriptorFromQuickList(true, agent, demouser1InteractionObj, function (err, res)
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
                                        info[0].pageNumber.should.equal(demouser1InteractionObj.pageNumber);
                                        info[0].performedBy.should.equal(demouser1Uri);
                                        info[0].rankingPosition.should.equal(demouser1InteractionObj.rankingPosition);
                                        info[0].recommendationCallId.should.equal(demouser1InteractionObj.recommendationCallId);
                                        should.exist(info[0].uri);
                                        info[0].uri.should.contain("interaction");
                                        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
                                        {
                                            userUtils.getUserInfo(demouser2.username, true, agent, function (err, res)
                                            {
                                                should.equal(err, null);
                                                should.exist(res);
                                                should.exist(res.body);
                                                should.exist(res.body.uri);
                                                let demouser2Uri = res.body.uri;
                                                interactionsUtils.acceptDescriptorFromQuickList(true, agent, demouser2InteractionObj, function (err, res)
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
                                                            info[0].pageNumber.should.equal(demouser2InteractionObj.pageNumber);
                                                            info[0].performedBy.should.equal(demouser2Uri);
                                                            info[0].rankingPosition.should.equal(demouser2InteractionObj.rankingPosition);
                                                            info[0].recommendationCallId.should.equal(demouser2InteractionObj.recommendationCallId);
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
                            });
                        });
                    });
                });
            });
        });
    });

    describe("[POST] [Invalid Cases] /interactions/delete_all", function ()
    {
        it("Should give an error and not delete all interactions when unauthenticated", function (done)
        {
            const app = Config.tests.app;
            let agent = chai.request.agent(app);
            interactionsUtils.deleteAll(true, agent, function (err, res)
            {
                should.exist(err);
                res.statusCode.should.equal(401);
                res.body.message.should.equal("Error detected. You are not authorized to perform this operation. You must be a Dendro administrator.");
                Interaction.all(function (err, info)
                {
                    should.equal(err, null);
                    should.exist(info);
                    info.length.should.equal(2);
                    done();
                });
            });
        });

        it("Should give an error and not delete all interactions when logged in as demouser3, who is not an admin", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                interactionsUtils.deleteAll(true, agent, function (err, res)
                {
                    should.exist(err);
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Error detected. You are not authorized to perform this operation. You must be a Dendro administrator.");
                    Interaction.all(function (err, info)
                    {
                        should.equal(err, null);
                        should.exist(info);
                        info.length.should.equal(2);
                        done();
                    });
                });
            });
        });

        it("Should give an error and not delete all interactions even if logged in as demouser1 (creator of the project), only admins can", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                let copyOfDemouser1InteractionObj = JSON.parse(JSON.stringify(demouser1InteractionObj));
                copyOfDemouser1InteractionObj.interactionType = "invalid_interaction_type";
                interactionsUtils.deleteAll(true, agent, function (err, res)
                {
                    should.exist(err);
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Error detected. You are not authorized to perform this operation. You must be a Dendro administrator.");
                    Interaction.all(function (err, info)
                    {
                        should.equal(err, null);
                        should.exist(info);
                        info.length.should.equal(2);
                        done();
                    });
                });
            });
        });

        it("Should give an error and not delete all interactions even if logged in as demouser2 (collaborator on the project), only admins can", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                let copyOfDemouser1InteractionObj = JSON.parse(JSON.stringify(demouser1InteractionObj));
                copyOfDemouser1InteractionObj.interactionType = "invalid_interaction_type";
                interactionsUtils.deleteAll(true, agent, function (err, res)
                {
                    should.exist(err);
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Error detected. You are not authorized to perform this operation. You must be a Dendro administrator.");
                    Interaction.all(function (err, info)
                    {
                        should.equal(err, null);
                        should.exist(info);
                        info.length.should.equal(2);
                        done();
                    });
                });
            });
        });
    });

    describe("[POST] [Valid Cases] /interactions/delete_all", function ()
    {
        it("Should delete all interactions when logged in as admin (a user with admin rights)", function (done)
        {
            userUtils.loginUser(admin.username, admin.password, function (err, agent)
            {
                interactionsUtils.deleteAll(true, agent, function (err, res)
                {
                    should.equal(err, null);
                    should.exist(res);
                    res.statusCode.should.equal(200);
                    res.body.message.should.equal("All interactions successfully deleted.");
                    Interaction.all(function (err, info)
                    {
                        should.equal(err, null);
                        should.exist(info);
                        info.length.should.equal(0);
                        done();
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
