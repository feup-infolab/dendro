const async = require("async");
const path = require("path");
const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const expect = chai.expect;
const _ = require("underscore");
chai.use(chaiHttp);

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const itemUtils = rlequire("dendro", "test/utils/item/itemUtils.js");
const fileUtils = rlequire("dendro", "test/utils/file/fileUtils.js");
const appUtils = rlequire("dendro", "test/utils/app/appUtils.js");
const projectUtils = rlequire("dendro", "test/utils/project/projectUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1.js");
const demouser2 = rlequire("dendro", "test/mockdata/users/demouser2.js");
const demouser3 = rlequire("dendro", "test/mockdata/users/demouser3.js");

const publicProject = rlequire("dendro", "test/mockdata/projects/public_project.js");
const metadataProject = rlequire("dendro", "test/mockdata/projects/metadata_only_project.js");
const invalidProject = rlequire("dendro", "test/mockdata/projects/invalidProject.js");
const zipFileForRestoreFolder = rlequire("dendro", "test/mockdata/files/zipForFolderRestore.js");
const restoreFolderWithAZipInside = rlequire("dendro", "test/mockdata/files/restoreFolderWithAZipInside.js");
const restoreFolderWithOnlyOneFileInside = rlequire("dendro", "test/mockdata/files/restoreFolderWithOnlyOneFile.js");

const testFolder1 = rlequire("dendro", "test/mockdata/folders/testFolder1.js");
const notFoundFolder = rlequire("dendro", "test/mockdata/folders/notFoundFolder.js");
const folderForDemouser2 = rlequire("dendro", "test/mockdata/folders/folderDemoUser2");
const addMetadataToFoldersUnit = appUtils.requireUncached(rlequire.absPathInApp("dendro", "test/units/metadata/addMetadataToFolders.Unit.js"));
const db = appUtils.requireUncached(rlequire.absPathInApp("dendro", "test/utils/db/db.Test.js"));
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;

const addMetadataToFoldersInPublicProjectUnit = rlequire("dendro", "test/units/metadata/addMetadataToFoldersPublicProject.Unit.js");

const createTempFileFromData = function (fileData, fileName, callback)
{
    const tmp = require("tmp");
    const fs = require("fs");
    tmp.dir(
        {
            mode: Config.tempFilesCreationMode,
            dir: Config.tempFilesDir
        },
        function (err, tempFolderPath)
        {
            if (isNull(err))
            {
                let filePath = path.join(tempFolderPath, fileName);
                fs.writeFile(filePath, fileData, "binary", function (err)
                {
                    if (isNull(err))
                    {
                        callback(err, filePath);
                    }
                    else
                    {
                        let msg = "Error when creating a temp file for the restore folder tests, error: " + JSON.stringify(err);
                        Logger.log("error", msg);
                        callback(err, err);
                    }
                });
            }
            else
            {
                let msg = "Error when creating a temp dir for the restore folder tests, error: " + JSON.stringify(err);
                Logger.log("error", msg);
                callback(err, msg);
            }
        }
    );
};

describe("Public project testFolder1 level restore folder tests", function ()
{
    this.timeout(Config.testsTimeout);
    let testFolder1Data;
    let restoredFolderData;
    let restoredFolderName = "folderDebug";
    let metadataProjectTestFolder1Data;
    let metadataProjectRestoredFolderData;
    let folderDebug3Uri;
    before(function (done)
    {
        addMetadataToFoldersInPublicProjectUnit.setup(function (err, results)
        {
            try
            {
                const app = global.tests.app;
                const agent = chai.request.agent(app);
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
                    folderDebug3Uri = res.body.new_folder.uri;
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

        it("Should restore restoreFolderWithAZipInside in the metadata_project and the folder should exist in both public and metadata projects independently", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                let folderDebug3ZipData = {};
                const md5File = require("md5-file");
                itemUtils.backupFolderByUri(true, agent, folderDebug3Uri, function (err, res)
                {
                    should.equal(err, null);
                    res.statusCode.should.equal(200);
                    createTempFileFromData(res.body, "folderInProjectMetadata.zip", function (err, filePath)
                    {
                        should.equal(err, null);
                        should.exist(filePath);
                        folderDebug3ZipData.location = filePath;
                        folderDebug3ZipData.md5 = md5File.sync(filePath);
                        itemUtils.createFolder(true, agent, metadataProject.handle, "", "folderInProjectMetadata", function (err, res)
                        {
                            res.statusCode.should.equal(200);
                            let folderInProjectMetadataUri = res.body.new_folder.uri;
                            // itemUtils.itemRestoreFolder(true, agent, folderInProjectMetadataUri, restoreFolderWithAZipInside, function (err, res)
                            itemUtils.itemRestoreFolder(true, agent, folderInProjectMetadataUri, folderDebug3ZipData, function (err, res)
                            {
                                res.statusCode.should.equal(200);
                                projectUtils.getProjectRootContent(true, agent, metadataProject.handle, function (err, res)
                                {
                                    should.equal(err, null);
                                    let folderInProjectMetadataData = _.find(res.body, function (folder)
                                    {
                                        return folder.nie.title === "folderInProjectMetadata";
                                    });
                                    should.not.exist(folderInProjectMetadataData);
                                    let metadataProjectRestoredFolderData = _.find(res.body, function (folder)
                                    {
                                        return folder.uri === folderInProjectMetadataUri;
                                    });
                                    should.exist(metadataProjectRestoredFolderData);
                                    expect(metadataProjectRestoredFolderData.nie.hasLogicalPart).to.be.an.instanceof(Array);
                                    metadataProjectRestoredFolderData.nie.hasLogicalPart.length.should.equal(3);

                                    fileUtils.downloadFileByUri(true, agent, folderInProjectMetadataUri, function (error, res)
                                    {
                                        should.equal(error, null);
                                        res.statusCode.should.equal(200);
                                        fileUtils.downloadFileByUri(true, agent, folderDebug3Uri, function (error, res)
                                        {
                                            should.equal(error, null);
                                            res.statusCode.should.equal(200);
                                            itemUtils.deleteItemByUri(true, agent, folderDebug3Uri, function (err, res)
                                            {
                                                should.equal(error, null);
                                                res.statusCode.should.equal(200);
                                                // have to delete twice so that the file is really deleted even if the really_delete parameter is set to true
                                                itemUtils.deleteItemByUri(true, agent, folderDebug3Uri, function (err, res)
                                                {
                                                    should.equal(error, null);
                                                    res.statusCode.should.equal(200);
                                                    fileUtils.downloadFileByUri(true, agent, folderDebug3Uri, function (error, res)
                                                    {
                                                        res.statusCode.should.equal(404);
                                                        fileUtils.downloadFileByUri(true, agent, folderInProjectMetadataUri, function (error, res)
                                                        {
                                                            should.equal(error, null);
                                                            res.statusCode.should.equal(200);
                                                            done();
                                                        });
                                                    });
                                                }, true);
                                            }, true);
                                        });
                                    });

                                    /*
                                    itemUtils.getItemMetadataDeepByUri(true, agent, folderInProjectMetadataUri, function (err, res) {
                                        should.equal(err, null);
                                        res.statusCode.should.equal(200);
                                        itemUtils.getItemMetadataDeepByUri(true, agent, folderDebug3Uri, function (err, res) {
                                            should.equal(err, null);
                                            res.statusCode.should.equal(200);
                                            done();
                                        });
                                    });*/
                                });
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
