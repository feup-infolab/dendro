const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
const md5 = require("md5");
const fs = require("fs");
const path = require("path");
const async = require("async");
chai.use(chaiHttp);

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const fileUtils = rlequire("dendro", "test/utils/file/fileUtils.js");
const itemUtils = rlequire("dendro", "test/utils/item/itemUtils.js");
const appUtils = rlequire("dendro", "test/utils/app/appUtils.js");
const projectUtils = rlequire("dendro", "test/utils/project/projectUtils.js");
const versionUtils = rlequire("dendro", "test/utils/versions/versionUtils.js");
const descriptorUtils = rlequire("dendro", "test/utils/descriptor/descriptorUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1.js");
const demouser2 = rlequire("dendro", "test/mockdata/users/demouser2.js");
const demouser3 = rlequire("dendro", "test/mockdata/users/demouser3.js");

const privateProject = rlequire("dendro", "test/mockdata/projects/private_project.js");
const invalidProject = rlequire("dendro", "test/mockdata/projects/invalidProject.js");

const testFolder1 = rlequire("dendro", "test/mockdata/folders/testFolder1.js");
const notFoundFolder = rlequire("dendro", "test/mockdata/folders/notFoundFolder.js");
const folderForDemouser2 = rlequire("dendro", "test/mockdata/folders/folderDemoUser2");
const createFoldersUnit = rlequire("dendro", "test/units/folders/createFolders.Unit.js");
const db = rlequire("dendro", "test/utils/db/db.Test.js");

describe("Creation of archived versions", function ()
{
    this.timeout(Config.testsTimeout);
    before(function (done)
    {
        createFoldersUnit.setup(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    // describe("[POST] [PRIVATE PROJECT] [Invalid Cases] /r/archived_resource/{uuid}", function()
    // {
    //     it("Should give an error message when a project does not exist", function (done)
    //     {
    //         done();
    //     });
    //
    //     it("Should give an error message when a project does not exist", function (done)
    //     {
    //         done();
    //     });
    // });

    describe("[POST] [PRIVATE PROJECT] [Valid Cases] /r/archived_resource/{uuid}", function ()
    {
        it("Should update a folder's metadata and create the adequate archived versions", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.getProjectRootContent(true, agent, privateProject.handle, function (err, res)
                {
                    should.equal(err, null);
                    should.not.equal(res.body, null);
                    res.body.should.be.instanceof(Array);

                    let buildUpdatedMetadata = function (newValue, change_type)
                    {
                        let updateRequest = {};
                        updateRequest.changes = JSON.parse(JSON.stringify(testFolder1.metadata));
                        for (let i = 0; i < updateRequest.changes.length; i++)
                        {
                            updateRequest.changes[i].value = newValue;
                        }

                        updateRequest.change_type = change_type;

                        return updateRequest;
                    };

                    let firstVersion = buildUpdatedMetadata("ALKAL", "add");
                    let secondVersion = buildUpdatedMetadata("LUX", "update");
                    let thirdVersion = buildUpdatedMetadata("MALM", "update");
                    let fourthVersion = buildUpdatedMetadata("BESTA", "update");
                    let fifthVersion = buildUpdatedMetadata("BILLY", "update");
                    let sixthVersion = buildUpdatedMetadata("KALLAX", "update");
                    let seventhVersion = buildUpdatedMetadata(null, "delete");

                    const allVersions = [firstVersion, secondVersion, thirdVersion, fourthVersion, fifthVersion, sixthVersion, seventhVersion];

                    async.mapSeries(res.body, function (folder, callback)
                    {
                        should.not.equal(null, folder.uri);

                        const updateMetadata = function (updateRequest, folderUri, callback)
                        {
                            let metadata = updateRequest.changes;
                            if (updateRequest.change_type === "delete")
                            {
                                metadata = [];
                            }

                            itemUtils.updateItemMetadataByUri(true, agent, folderUri, metadata, function (err, res)
                            {
                                res.statusCode.should.equal(200);
                                // jsonOnly, agent, projectHandle, itemPath, cb
                                itemUtils.getItemMetadataByUri(true, agent, folder.uri, function (error, response)
                                {
                                    response.statusCode.should.equal(200);
                                    let containsAllMetadata = descriptorUtils.containsAllMetadata(metadata, JSON.parse(response.text).descriptors);
                                    should.equal(containsAllMetadata, true);
                                    callback(error, response);
                                });
                            });
                        };

                        const validateVersions = function (folderUri, callback)
                        {
                            itemUtils.getChangeLog(true, agent, folder.uri, function (err, res)
                            {
                                res.statusCode.should.equal(200);
                                let versions = res.body;
                                versions.should.be.instanceof(Array);

                                versions = versions.sort(function (a, b)
                                {
                                    return a.ddr.versionNumber - b.ddr.versionNumber;
                                });

                                const wrapped = versions.map(function (value, index)
                                {
                                    return {index: index, value: res.body[index]};
                                });

                                async.mapSeries(wrapped, function (version)
                                {
                                    let expectedVersion = allVersions[version.index];

                                    should.not.equal(null, version.value.uri);
                                    itemUtils.getItemVersionByUri(true, agent, version.value.uri, function (err, res)
                                    {
                                        done(versionUtils.getVersionErrors(res.body, expectedVersion));
                                    });
                                }, function (err, results)
                                {
                                    callback(err, results);
                                });
                            });
                        };

                        async.mapSeries(
                            allVersions,
                            function (version, callback)
                            {
                                updateMetadata(version, folder.uri, callback);
                            }, function (err, results)
                            {
                                validateVersions(folder.uri, callback);
                            }
                        );
                    });
                });
            });
        });
    });
});
