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
const fileUtils = require(Pathfinder.absPathInTestsFolder("utils/file/fileUtils.js"));
const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("utils/item/itemUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const descriptorUtils = require(Pathfinder.absPathInTestsFolder("utils/descriptor/descriptorUtils.js"));
const interactionsUtils = require(Pathfinder.absPathInTestsFolder("utils/interactions/interactionsUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));

const publicProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));

const createFilesUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/files/createFiles.Unit.js"));

/*var bodyObj = {
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
    "interactionType": "accept_descriptor_from_quick_list",
    "recommendedFor": "/r/folder/403de121-d0fc-4329-a534-e87c997b5596"
};*/
let bodyObj = null;
let projectRootData = null;
let dctermsDescriptors = null;
let dctermsPrefix = "dcterms";

describe("[" + publicProject.handle + "]"   + "[INTERACTION TESTS] accept_descriptor_from_quick_list", function ()
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
                    descriptorUtils.getDescriptorsFromOntology(true, agent, dctermsPrefix, function (err, res) {
                        should.equal(err, null);
                        should.exist(res);
                        dctermsDescriptors = res.body.descriptors;
                        should.exist(dctermsDescriptors);
                        // TODO recommendationCallId and recommendedFor must be added after the unit runs
                        // TODO recommendedFor maybe for a uri of a folder on the root of the project
                        // TODO recommendationCallId is I think from the descriptor associated to the resource
                        bodyObj = dctermsDescriptors[0];
                        bodyObj.just_added = true;
                        bodyObj.added_from_quick_list = true;
                        //bodyObj.rankingPosition = index;
                        bodyObj.rankingPosition = 0;
                        //bodyObj.pageNumber = $scope.recommendations_page;
                        bodyObj.pageNumber = 2;
                        bodyObj.interactionType = "accept_descriptor_from_quick_list";
                        bodyObj.recommendedFor = projectRootData[0].uri;
                        done();
                    });
                });
            });
        });
    });

    /*
    describe("[POST] [Invalid Cases] /interactions/accept_descriptor_from_quick_list", function ()
    {

    });*/

    describe("[POST] [Valid Cases] /interactions/accept_descriptor_from_quick_list", function ()
    {
        //Because the current project is a public one
        it("Should accept and register an interaction when a descriptor is added from the quick list when unauthenticated", function (done)
        {
            const app = global.tests.app;
            let agent = chai.request.agent(app);
            interactionsUtils.acceptDescriptorFromQuickList(true, agent, bodyObj, function (err, res)
            {
                should.equal(err, null);
                res.statusCode.should.equal(200);
                //TODO SHOULD ALSO BE IN THE MYSQL DATABASE
                done();
            });
        });

        //Because the current project is a public one
        /*
        it("Should accept and register an interaction when a descriptor is added from the quick list when logged in as demouser3, who is not a creator or collaborator of the project where the current resource belongs to", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                interactionsUtils.acceptDescriptorFromQuickList(true, agent, bodyObj, function (err, res)
                {
                    should.equal(err, null);
                    res.statusCode.should.equal(200);
                    //TODO SHOULD ALSO BE IN THE MYSQL DATABASE
                    done();
                });
            });
        });*/

        it("Should accept and register an interaction when a descriptor is added from the quick list when logged in as demouser1 (the creator of the current project)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                interactionsUtils.acceptDescriptorFromQuickList(true, agent, bodyObj, function (err, res)
                {
                    should.equal(err, null);
                    res.statusCode.should.equal(200);
                    //TODO SHOULD ALSO BE IN THE MYSQL DATABASE
                    done();
                });
            });
        });

        it("Should accept and register an interaction when a descriptor is added from the quick list when logged in as demouser2 (a collaborator on the current project)", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                interactionsUtils.acceptDescriptorFromQuickList(true, agent, bodyObj, function (err, res)
                {
                    should.equal(err, null);
                    res.statusCode.should.equal(200);
                    //TODO SHOULD ALSO BE IN THE MYSQL DATABASE
                    done();
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
