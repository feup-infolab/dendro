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
const fileUtils = rlequire("dendro", "test/utils/file/fileUtils.js");
const itemUtils = rlequire("dendro", "test/utils/item/itemUtils.js");
const appUtils = rlequire("dendro", "test/utils/app/appUtils.js");
const descriptorUtils = rlequire("dendro", "test/utils/descriptor/descriptorUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1.js");

const b2dropProject = rlequire("dendro", "test/mockdata/projects/b2drop_project.js");
const invalidProject = rlequire("dendro", "test/mockdata/projects/invalidProject.js");

const testFolder1 = rlequire("dendro", "test/mockdata/folders/testFolder1.js");
const createFoldersB2DropUnit = rlequire("dendro", "test/units/folders/createFoldersB2drop.Unit.js");

const csvMockFile = rlequire("dendro", "test/mockdata/files/csvMockFile.js");
const docMockFile = rlequire("dendro", "test/mockdata/files/docMockFile.js");
const docxMockFile = rlequire("dendro", "test/mockdata/files/docxMockFile.js");
const pdfMockFile = rlequire("dendro", "test/mockdata/files/pdfMockFile.js");
const xlsMockFile = rlequire("dendro", "test/mockdata/files/xlsMockFile.js");
const xlsxMockFile = rlequire("dendro", "test/mockdata/files/xlsxMockFile.js");
const zipMockFile = rlequire("dendro", "test/mockdata/files/zipMockFile.js");
const txtMockFile = rlequire("dendro", "test/mockdata/files/txtMockFile.js");
const odsMockFile = rlequire("dendro", "test/mockdata/files/odsMockFile.js");

const csvResultMD5 = md5(fs.readFileSync(rlequire.absPathInApp("dendro", "test/mockdata/files/test_data_serialization/xlsInCSV.csv"), "utf-8"));
const jsonResultMD5 = md5(fs.readFileSync(rlequire.absPathInApp("dendro", "test/mockdata/files/test_data_serialization/xlsInJSON.json"), "utf-8"));

const csvResultMD5WithPageAndSkip = md5(fs.readFileSync(rlequire.absPathInApp("dendro", "test/mockdata/files/test_data_serialization/xlsInCSV_200_to_250.csv"), "utf-8"));
const jsonResultMD5WithPageAndSkip = md5(fs.readFileSync(rlequire.absPathInApp("dendro", "test/mockdata/files/test_data_serialization/xlsInJSON_200_to_250.json"), "utf-8"));
const emptyCSVMD5 = md5(fs.readFileSync(rlequire.absPathInApp("dendro", "test/mockdata/files/test_data_serialization/emptyCSVResult.csv"), "utf-8"));

describe("Upload files into testFolder1 of b2droproject project", function ()
{
    this.timeout(Config.tests.timeout);
    before(function (done)
    {
        createFoldersB2DropUnit.setup(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    describe("[POST] [B2Drop PROJECT] [Invalid Cases] /project/" + b2dropProject.handle + "/data/:foldername?upload", function ()
    {
        it("Should give an error message when the folder does not exist", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                fileUtils.uploadFile(true, agent, invalidProject.handle, testFolder1.name, zipMockFile, function (err, res)
                {
                    res.statusCode.should.equal(404);
                    fileUtils.downloadFile(true, agent, invalidProject.handle, testFolder1.name, zipMockFile, function (error, response)
                    {
                        response.statusCode.should.equal(404);
                        done();
                    });
                });
            });
        });

        it("Should give an error when the user is not authenticated", function (done)
        {
            const app = Config.tests.app;
            const agent = chai.request.agent(app);

            fileUtils.uploadFile(true, agent, b2dropProject.handle, testFolder1.name, zipMockFile, function (err, res)
            {
                res.statusCode.should.equal(401);
                fileUtils.downloadFile(true, agent, b2dropProject.handle, testFolder1.name, zipMockFile, function (error, response)
                {
                    response.statusCode.should.equal(404);
                    done();
                });
            });
        });
    });

    describe("[POST] [B2Drop PROJECT] [Valid Cases] /project/" + b2dropProject.handle + "/data/:foldername?upload", function ()
    {
        it("Should upload a ZIP file successfully", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                fileUtils.uploadFile(true, agent, b2dropProject.handle, testFolder1.name, zipMockFile, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.should.be.instanceof(Array);
                    res.body.length.should.equal(1);
                    res.body[0].result.should.equal("success");
                    res.body[0].message.should.equal("File submitted successfully.");

                    fileUtils.downloadFileByUri(true, agent, res.body[0].uri, function (error, res)
                    {
                        res.statusCode.should.equal(200);
                        done();
                    });
                });
            });
        });

        it("Should upload a TXT file successfully and extract its text for content-based indexing", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                fileUtils.uploadFile(true, agent, b2dropProject.handle, testFolder1.name, txtMockFile, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.should.be.instanceof(Object);
                    res.body.should.be.instanceof(Array);
                    res.body.length.should.equal(1);

                    fileUtils.downloadFileByUri(true, agent, res.body[0].uri, function (error, res)
                    {
                        res.statusCode.should.equal(200);
                        done();
                    });
                });
            });
        });

        it("Should upload a PDF file successfully and extract its text for content-based indexing", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                fileUtils.uploadFile(true, agent, b2dropProject.handle, testFolder1.name, pdfMockFile, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.should.be.instanceof(Object);
                    res.body.should.be.instanceof(Array);
                    res.body.length.should.equal(1);

                    const newResourceUri = res.body[0].uri;

                    fileUtils.downloadFileByUri(true, agent, newResourceUri, function (error, res)
                    {
                        pdfMockFile.md5.should.equal(md5(res.body));
                        res.statusCode.should.equal(200);

                        itemUtils.getItemMetadataByUri(true, agent, newResourceUri, function (error, res)
                        {
                            res.statusCode.should.equal(200);
                            res.body.descriptors.should.be.instanceof(Array);
                            descriptorUtils.noPrivateDescriptors(JSON.parse(res.text).descriptors).should.equal(true);

                            descriptorUtils.containsAllMetadata(
                                pdfMockFile.metadata,
                                JSON.parse(res.text).descriptors
                            );

                            done();
                        });
                    });
                });
            });
        });

        it("Should upload a Word DOCX file successfully and extract its text for content-based indexing", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                fileUtils.uploadFile(true, agent, b2dropProject.handle, testFolder1.name, docxMockFile, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.should.be.instanceof(Object);
                    res.body.should.be.instanceof(Array);
                    res.body.length.should.equal(1);

                    const newResourceUri = res.body[0].uri;

                    fileUtils.downloadFileByUri(true, agent, newResourceUri, function (error, res)
                    {
                        docxMockFile.md5.should.equal(md5(res.body));
                        res.statusCode.should.equal(200);

                        itemUtils.getItemMetadataByUri(true, agent, newResourceUri, function (error, res)
                        {
                            res.statusCode.should.equal(200);
                            res.body.descriptors.should.be.instanceof(Array);
                            descriptorUtils.noPrivateDescriptors(JSON.parse(res.text).descriptors).should.equal(true);

                            descriptorUtils.containsAllMetadata(
                                docxMockFile.metadata,
                                JSON.parse(res.text).descriptors
                            );

                            done();
                        });
                    });
                });
            });
        });

        it("Should upload a Word DOC file successfully and extract its text for content-based indexing", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                fileUtils.uploadFile(true, agent, b2dropProject.handle, testFolder1.name, docMockFile, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.should.be.instanceof(Object);
                    res.body.should.be.instanceof(Array);
                    res.body.length.should.equal(1);

                    const newResourceUri = res.body[0].uri;

                    fileUtils.downloadFileByUri(true, agent, newResourceUri, function (error, res)
                    {
                        docMockFile.md5.should.equal(md5(res.body));
                        res.statusCode.should.equal(200);

                        itemUtils.getItemMetadataByUri(true, agent, newResourceUri, function (error, res)
                        {
                            res.statusCode.should.equal(200);
                            res.body.descriptors.should.be.instanceof(Array);
                            descriptorUtils.noPrivateDescriptors(JSON.parse(res.text).descriptors).should.equal(true);

                            descriptorUtils.containsAllMetadata(
                                docMockFile.metadata,
                                JSON.parse(res.text).descriptors
                            );

                            done();
                        });
                    });
                });
            });
        });

        it("Should upload a CSV file successfully and extract its data content to the datastore", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                fileUtils.uploadFile(true, agent, b2dropProject.handle, testFolder1.name, csvMockFile, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.should.be.instanceof(Object);
                    res.body.should.be.instanceof(Array);
                    res.body.length.should.equal(1);

                    const newResourceUri = res.body[0].uri;

                    fileUtils.downloadFileByUri(true, agent, newResourceUri, function (error, res)
                    {
                        csvMockFile.md5.should.equal(md5(res.body));
                        res.statusCode.should.equal(200);

                        fileUtils.downloadDataByUri(agent, newResourceUri, function (error, res)
                        {
                            should.equal(error, null);
                            res.statusCode.should.equal(200);
                            const downloadJSON = path.join(Config.tempFilesDir, "json_dump1.json");
                            fs.writeFileSync(downloadJSON, res.text);
                            md5(res.text).should.equal(jsonResultMD5);

                            fileUtils.downloadDataByUriInCSV(agent, newResourceUri, function (error, res)
                            {
                                const downloadCSV = path.join(Config.tempFilesDir, "csv_dump1.csv");
                                res.statusCode.should.equal(200);
                                md5(res.text).should.equal(csvResultMD5);
                                done();
                            });
                        });
                    });
                });
            });
        });

        it("Should upload a XLSX file successfully and extract its data content to the datastore", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                fileUtils.uploadFile(true, agent, b2dropProject.handle, testFolder1.name, xlsxMockFile, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.should.be.instanceof(Object);
                    res.body.should.be.instanceof(Array);
                    res.body.length.should.equal(1);

                    const newResourceUri = res.body[0].uri;

                    fileUtils.downloadFileByUri(true, agent, newResourceUri, function (error, res)
                    {
                        xlsxMockFile.md5.should.equal(md5(res.body));
                        res.statusCode.should.equal(200);

                        fileUtils.downloadDataByUri(agent, newResourceUri, function (error, res)
                        {
                            should.equal(error, null);
                            res.statusCode.should.equal(200);

                            const downloadJSON = path.join(Config.tempFilesDir, "json_dump2.json");
                            // fs.writeFileSync(downloadJSON, res.text);
                            md5(res.text).should.equal(jsonResultMD5);

                            fileUtils.downloadDataByUriInCSV(agent, newResourceUri, function (error, res)
                            {
                                res.statusCode.should.equal(200);
                                const downloadCSV = path.join(Config.tempFilesDir, "csv_dump2.csv");
                                // fs.writeFileSync(downloadCSV, res.text);
                                // fs.unlinkSync(downloadCSV);

                                md5(res.text).should.equal(csvResultMD5);
                                done();
                            }, 0);
                        }, 0);
                    });
                });
            });
        });

        // it("Should upload a XLS file successfully and extract its data content to the datastore", function (done)
        // {
        //     userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        //     {
        //         fileUtils.uploadFile(true, agent, b2dropProject.handle, testFolder1.name, xlsMockFile, function (err, res)
        //         {
        //             res.statusCode.should.equal(200);
        //             res.body.should.be.instanceof(Object);
        //             res.body.should.be.instanceof(Array);
        //             res.body.length.should.equal(1);
        //
        //             const newResourceUri = res.body[0].uri;
        //             fileUtils.downloadFileByUri(true, agent, newResourceUri, function (error, res)
        //             {
        //                 xlsMockFile.md5.should.equal(md5(res.body));
        //                 res.statusCode.should.equal(200);
        //
        //                 fileUtils.downloadDataByUri(agent, newResourceUri, function (error, res)
        //                 {
        //                     should.equal(error, null);
        //                     res.statusCode.should.equal(200);
        //                     md5(res.text).should.equal(jsonResultMD5);
        //
        //                     fileUtils.downloadDataByUriInCSV(agent, newResourceUri, function (error, res)
        //                     {
        //                         res.statusCode.should.equal(200);
        //                         md5(res.text).should.equal(csvResultMD5);
        //                         done();
        //                     }, 0);
        //                 }, 0);
        //             });
        //         });
        //     });
        // });

        it("Should upload a ODS file successfully and extract its data content to the datastore", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                fileUtils.uploadFile(true, agent, b2dropProject.handle, testFolder1.name, odsMockFile, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.should.be.instanceof(Object);
                    res.body.should.be.instanceof(Array);
                    res.body.length.should.equal(1);

                    const newResourceUri = res.body[0].uri;

                    fileUtils.downloadFileByUri(true, agent, newResourceUri, function (error, res)
                    {
                        odsMockFile.md5.should.equal(md5(res.body));
                        res.statusCode.should.equal(200);

                        fileUtils.downloadDataByUri(agent, newResourceUri, function (error, res)
                        {
                            should.equal(error, null);
                            res.statusCode.should.equal(200);
                            md5(res.text).should.equal(jsonResultMD5);

                            fileUtils.downloadDataByUriInCSV(agent, newResourceUri, function (error, res)
                            {
                                res.statusCode.should.equal(200);
                                md5(res.text).should.equal(csvResultMD5);
                                done();
                            }, 0);
                        }, 0);
                    });
                });
            });
        });

        it("Should upload a CSV file successfully, extract its data content to the datastore and return a paginated result, skipping 200 rows and returning the following 50 (a page size of 50)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                fileUtils.uploadFile(true, agent, b2dropProject.handle, testFolder1.name, csvMockFile, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.should.be.instanceof(Object);
                    res.body.should.be.instanceof(Array);
                    res.body.length.should.equal(1);

                    const newResourceUri = res.body[0].uri;

                    fileUtils.downloadFileByUri(true, agent, newResourceUri, function (error, res)
                    {
                        csvMockFile.md5.should.equal(md5(res.body));
                        res.statusCode.should.equal(200);

                        fileUtils.downloadDataByUri(agent, newResourceUri, function (error, res)
                        {
                            should.equal(error, null);
                            res.statusCode.should.equal(200);
                            const downloadJSON = path.join(Config.tempFilesDir, "json_dump1_paginated.json");
                            // fs.writeFileSync(downloadJSON, res.text);

                            md5(res.text).should.equal(jsonResultMD5WithPageAndSkip);

                            fileUtils.downloadDataByUriInCSV(agent, newResourceUri, function (error, res)
                            {
                                const downloadCSV = path.join(Config.tempFilesDir, "csv_dump1_paginated.csv");
                                // fs.writeFileSync(downloadCSV, res.text);

                                res.statusCode.should.equal(200);
                                md5(res.text).should.equal(csvResultMD5WithPageAndSkip);
                                done();
                            }, 0, 200, 50);
                        }, 0, 200, 50);
                    });
                });
            });
        });

        it("Should upload a CSV file successfully, extract its data content to the datastore and return a paginated result, but it should not return any row if the pagination range is beyond the number of rows", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                fileUtils.uploadFile(true, agent, b2dropProject.handle, testFolder1.name, csvMockFile, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.should.be.instanceof(Object);
                    res.body.should.be.instanceof(Array);
                    res.body.length.should.equal(1);

                    const newResourceUri = res.body[0].uri;

                    fileUtils.downloadFileByUri(true, agent, newResourceUri, function (error, res)
                    {
                        csvMockFile.md5.should.equal(md5(res.body));
                        res.statusCode.should.equal(200);

                        fileUtils.downloadDataByUri(agent, newResourceUri, function (error, res)
                        {
                            should.equal(error, null);
                            res.statusCode.should.equal(200);

                            JSON.parse(res.text).should.be.instanceof(Array);
                            JSON.parse(res.text).length.should.equal(0);

                            fileUtils.downloadDataByUriInCSV(agent, newResourceUri, function (error, res)
                            {
                                res.statusCode.should.equal(200);
                                md5(res.text).should.equal(emptyCSVMD5);
                                done();
                            }, 0, 123456789, 1234567890); // ridiculosly large numbers
                        }, 0, 123456789, 1234567890);
                    });
                });
            });
        });

        it("Should upload a CSV file successfully, extract its data content to the datastore and return a paginated result, but it should not return any row if the pagination range is beyond the number of rows, even if the offset is negative", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                fileUtils.uploadFile(true, agent, b2dropProject.handle, testFolder1.name, csvMockFile, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.should.be.instanceof(Object);
                    res.body.should.be.instanceof(Array);
                    res.body.length.should.equal(1);

                    const newResourceUri = res.body[0].uri;

                    fileUtils.downloadFileByUri(true, agent, newResourceUri, function (error, res)
                    {
                        csvMockFile.md5.should.equal(md5(res.body));
                        res.statusCode.should.equal(200);

                        fileUtils.downloadDataByUri(agent, newResourceUri, function (error, res)
                        {
                            should.equal(error, null);
                            res.statusCode.should.equal(200);

                            JSON.parse(res.text).should.be.instanceof(Array);
                            JSON.parse(res.text).length.should.equal(0);

                            fileUtils.downloadDataByUriInCSV(agent, newResourceUri, function (error, res)
                            {
                                res.statusCode.should.equal(200);
                                md5(res.text).should.equal(emptyCSVMD5);
                                done();
                            }, 0, 123456789, -1234567890); // ridiculously large numbers but a negative limit
                        }, 0, 123456789, -1234567890);
                    });
                });
            });
        });
    });

    describe("Clean up /project/" + b2dropProject.handle, function ()
    {
        it("Should delete project " + b2dropProject.handle, function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.deleteProject(false, agent, b2dropProject.handle, function (err, result)
                {
                    should.not.exist(err);
                    // destroy graphs
                    done();
                });
            });
        });
    });

    after(function (done)
    {
        appUtils.clearAppState(function (err, data)
        {
            should.equal(err, null);
            done(err);
        });
    });
});
