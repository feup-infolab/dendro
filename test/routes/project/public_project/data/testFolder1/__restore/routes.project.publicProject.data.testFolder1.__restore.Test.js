const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const expect = chai.expect;
const _ = require("underscore");
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("utils/item/itemUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));

const publicProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));
const zipFileForRestoreFolder = require(Pathfinder.absPathInTestsFolder("mockdata/files/zipForFolderRestore.js"));
const restoreFolderWithAZipInside = require(Pathfinder.absPathInTestsFolder("mockdata/files/restoreFolderWithAZipInside.js"));
const restoreFolderWithOnlyOneFileInside = require(Pathfinder.absPathInTestsFolder("mockdata/files/restoreFolderWithOnlyOneFile.js"));

const testFolder1 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/testFolder1.js"));
const addMetadataToFoldersInPublicProjectUnit = require(Pathfinder.absPathInTestsFolder("units/metadata/addMetadataToFoldersPublicProject.Unit.js"));

describe("Public project testFolder1 level restore folder tests", function ()
{
    this.timeout(Config.testsTimeout);
    let testFolder1Data;
    let restoredFolderData;
    let restoredFolderName = "folderDebug";
    before(function (done)
    {
        addMetadataToFoldersInPublicProjectUnit.setup(function (err, results)
        {
            try
            {
                should.equal(err, null);
                projectUtils.getProjectRootContent(true, agent, publicProject.handle, function (err, res)
                {
                    should.equal(err, null);
                    // set here the testFolder1Data
                    testFolder1Data = _.find(res.body, function (folder)
                    {
                        return folder.nie.title === testFolder1.name;
                    });
                    should.exist(testFolder1Data);
                    restoredFolderData = _.find(res.body, function (folder)
                    {
                        return folder.nie.title === restoredFolderName;
                    });
                    should.not.exist(restoredFolderData);
                    done();
                });
            }
            catch (error)
            {
                done(error);
            }
        });
    });

    describe("[POST] [PUBLIC PROJECT] /project/" + publicProject.handle + "/data/testFolder1?restore", function ()
    {
        it("Should give an error if the user is unauthenticated", function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            itemUtils.itemRestoreFolder(true, agent, testFolder1Data.uri, zipFileForRestoreFolder, function (err, res)
            {
                res.statusCode.should.equal(401);
                done();
            });
        });

        it("Should give an error if the user is logged in as demouser3(not a collaborator nor creator of the project)", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                itemUtils.itemRestoreFolder(true, agent, testFolder1Data.uri, zipFileForRestoreFolder, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("Should restore the folder if the folder exists and if the user is logged in as demouser1(the creator of the project)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.itemRestoreFolder(true, agent, testFolder1Data.uri, zipFileForRestoreFolder, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    projectUtils.getProjectRootContent(true, agent, publicProject.handle, function (err, res)
                    {
                        should.equal(err, null);
                        // set here the testFolder1Data
                        testFolder1Data = _.find(res.body, function (folder)
                        {
                            return folder.nie.title === testFolder1.name;
                        });
                        should.not.exist(testFolder1Data);
                        restoredFolderData = _.find(res.body, function (folder)
                        {
                            return folder.nie.title === restoredFolderName;
                        });
                        should.exist(restoredFolderData);
                        expect(restoredFolderData.nie.hasLogicalPart).to.be.an.instanceof(Array);
                        restoredFolderData.nie.hasLogicalPart.length.should.equal(2);
                        done();
                    });
                });
            });
        });

        it("Should restore the folder if the folder exists and if the user is logged in as demouser2(a collaborator on the project)", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                itemUtils.createFolder(true, agent, publicProject.handle, "", "folderDebug2", function (err, res)
                {
                    res.statusCode.should.equal(200);
                    let folderDebug2Uri = res.body.new_folder.uri;
                    itemUtils.itemRestoreFolder(true, agent, folderDebug2Uri, zipFileForRestoreFolder, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        projectUtils.getProjectRootContent(true, agent, publicProject.handle, function (err, res)
                        {
                            should.equal(err, null);
                            // set here the testFolder1Data
                            testFolder1Data = _.find(res.body, function (folder)
                            {
                                return folder.nie.title === testFolder1.name;
                            });
                            should.not.exist(testFolder1Data);
                            let folder2DebugData = _.find(res.body, function (folder)
                            {
                                return folder.nie.title === "folderDebug2";
                            });
                            should.not.exist(folder2DebugData);
                            let secondRestoredFolderData = _.find(res.body, function (folder)
                            {
                                return folder.uri === folderDebug2Uri;
                            });
                            should.exist(secondRestoredFolderData);
                            expect(secondRestoredFolderData.nie.hasLogicalPart).to.be.an.instanceof(Array);
                            secondRestoredFolderData.nie.hasLogicalPart.length.should.equal(2);
                            done();
                        });
                    });
                });
            });
        });

        // test to restore a folder that has a folder(with a file), a txt file and a zip file
        it("Should restore a folder that has a folder(with a file), a txt file and a zip file if the folder exists and if the user is logged in as demouser2(a collaborator on the project)", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                itemUtils.createFolder(true, agent, publicProject.handle, "", "folderDebug3", function (err, res)
                {
                    res.statusCode.should.equal(200);
                    let folderDebug3Uri = res.body.new_folder.uri;
                    itemUtils.itemRestoreFolder(true, agent, folderDebug3Uri, restoreFolderWithAZipInside, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        projectUtils.getProjectRootContent(true, agent, publicProject.handle, function (err, res)
                        {
                            should.equal(err, null);
                            // set here the testFolder1Data
                            testFolder1Data = _.find(res.body, function (folder)
                            {
                                return folder.nie.title === testFolder1.name;
                            });
                            should.not.exist(testFolder1Data);
                            let folderDebug3Data = _.find(res.body, function (folder)
                            {
                                return folder.nie.title === "folderDebug3";
                            });
                            should.not.exist(folderDebug3Data);
                            let thirdRestoredFolderData = _.find(res.body, function (folder)
                            {
                                return folder.uri === folderDebug3Uri;
                            });
                            should.exist(thirdRestoredFolderData);
                            expect(thirdRestoredFolderData.nie.hasLogicalPart).to.be.an.instanceof(Array);
                            thirdRestoredFolderData.nie.hasLogicalPart.length.should.equal(3);
                            done();
                        });
                    });
                });
            });
        });

        // test to restore a folder that only has a txt file
        it("Should restore a folder that only has a txt file if the folder exists and if the user is logged in as demouser2(a collaborator on the project)", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                itemUtils.createFolder(true, agent, publicProject.handle, "", "folderDebug4", function (err, res)
                {
                    res.statusCode.should.equal(200);
                    let folderDebug4Uri = res.body.new_folder.uri;
                    itemUtils.itemRestoreFolder(true, agent, folderDebug4Uri, restoreFolderWithOnlyOneFileInside, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        projectUtils.getProjectRootContent(true, agent, publicProject.handle, function (err, res)
                        {
                            should.equal(err, null);
                            // set here the testFolder1Data
                            testFolder1Data = _.find(res.body, function (folder)
                            {
                                return folder.nie.title === testFolder1.name;
                            });
                            should.not.exist(testFolder1Data);
                            let folderDebug4Data = _.find(res.body, function (folder)
                            {
                                return folder.nie.title === "folderDebug4";
                            });
                            should.not.exist(folderDebug4Data);
                            let fourthRestoredFolderData = _.find(res.body, function (folder)
                            {
                                return folder.uri === folderDebug4Uri;
                            });
                            should.exist(fourthRestoredFolderData);
                            should.exist(fourthRestoredFolderData.nie.hasLogicalPart);
                            expect(fourthRestoredFolderData.nie.hasLogicalPart).to.not.be.an.instanceof(Array);
                            done();
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
            try
            {
                should.equal(err, null);
                done();
            }
            catch (error)
            {
                done(error);
            }
        });
    });
});
