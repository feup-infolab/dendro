const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
const md5 = require("md5");
const fs = require('fs');
const path = require('path');
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const fileUtils = require(Pathfinder.absPathInTestsFolder("utils/file/fileUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("utils/item/itemUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const descriptorUtils = require(Pathfinder.absPathInTestsFolder("utils/descriptor/descriptorUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));

const privateProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/private_project.js"));
const invalidProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/invalidProject.js"));

const testFolder1 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/testFolder1.js"));
const notFoundFolder = require(Pathfinder.absPathInTestsFolder("mockdata/folders/notFoundFolder.js"));
const folderForDemouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderDemoUser2"));
const createFoldersUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/folders/createFolders.Unit.js"));
const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));

const csvMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/csvMockFile.js"));
const docMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/docMockFile.js"));
const docxMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/docxMockFile.js"));
const pdfMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/pdfMockFile.js"));
const pngMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/pngMockFile.js"));
const xlsMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/xlsMockFile.js"));
const xlsxMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/xlsxMockFile.js"));
const zipMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/zipMockFile.js"));
const txtMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/txtMockFile.js"));

const csvResultMD5 = md5(fs.readFileSync(Pathfinder.absPathInTestsFolder("mockdata/files/test_data_serialization/xlsInCSV.json"), "utf-8"));


describe("Upload files into testFolder1 of Private project", function () {
    before(function (done) {
        this.timeout(60000);
        createFoldersUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    describe("[POST] [PRIVATE PROJECT] [Invalid Cases] /project/" + privateProject.handle + "/data/:foldername?upload", function() {
        //API ONLY
        it("Should give an error if the request type for this route is HTML", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                fileUtils.uploadFile(false, agent, privateProject.handle, testFolder1.name, zipMockFile, function (err, res) {
                    res.statusCode.should.equal(400);
                    done();
                });
            });
        });

        it("Should give an error message when a project does not exist", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                fileUtils.uploadFile(true, agent, invalidProject.handle, testFolder1.name, zipMockFile, function (err, res) {
                    res.statusCode.should.equal(404);
                    fileUtils.downloadFile(true, agent, invalidProject.handle, testFolder1.name, zipMockFile, function (error, response) {
                        response.statusCode.should.equal(404);
                        done();
                    });
                });
            });
        });

        it("Should give an error message when the folder does not exist", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                fileUtils.uploadFile(true, agent, invalidProject.handle, testFolder1.name, zipMockFile, function (err, res) {
                    res.statusCode.should.equal(404);
                    fileUtils.downloadFile(true, agent, invalidProject.handle, testFolder1.name, zipMockFile, function (error, response) {
                        response.statusCode.should.equal(404);
                        done();
                    });
                });
            });
        });

        it("Should give an error when the user is not authenticated", function (done) {
            const app = global.tests.app;
            const agent = chai.request.agent(app);

            fileUtils.uploadFile(true, agent, privateProject.handle, testFolder1.name, zipMockFile, function (err, res) {
                res.statusCode.should.equal(401);
                fileUtils.downloadFile(true, agent, privateProject.handle, testFolder1.name, zipMockFile, function (error, response) {
                    response.statusCode.should.equal(404);
                    done();
                });
            });
        });
    });

    describe("[POST] [PRIVATE PROJECT] [Valid Cases] /project/" + privateProject.handle + "/data/:foldername?upload", function() {
        // it("Should upload a ZIP file successfully", function (done) {
        //     userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        //     {
        //         fileUtils.uploadFile(true, agent, privateProject.handle, testFolder1.name, zipMockFile, function (err, res)
        //         {
        //             res.statusCode.should.equal(200);
        //             res.body.should.be.instanceof(Array);
        //             res.body.length.should.equal(1);
        //
        //             fileUtils.downloadFileByUri(true, agent, res.body[0].uri, function (error, res)
        //             {
        //                 res.statusCode.should.equal(200);
        //                 done();
        //             });
        //         });
        //     });
        // });
        //
        // it("Should upload a TXT file successfully and extract its text for content-based indexing", function (done) {
        //     userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        //     {
        //         fileUtils.uploadFile(true, agent, privateProject.handle, testFolder1.name, txtMockFile, function (err, res)
        //         {
        //             res.statusCode.should.equal(200);
        //             res.body.should.be.instanceof(Array);
        //             res.body.length.should.equal(1);
        //
        //             fileUtils.downloadFileByUri(true, agent, res.body[0].uri, function (error, res)
        //             {
        //                 res.statusCode.should.equal(200);
        //                 done();
        //             });
        //         });
        //     });
        // });
        //
        // it("Should upload a PDF file successfully and extract its text for content-based indexing", function (done) {
        //     userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        //     {
        //         fileUtils.uploadFile(true, agent, privateProject.handle, testFolder1.name, pdfMockFile, function (err, res)
        //         {
        //             res.statusCode.should.equal(200);
        //             res.body.should.be.instanceof(Array);
        //             res.body.length.should.equal(1);
        //             const newResourceUri = res.body[0].uri;
        //
        //             fileUtils.downloadFileByUri(true, agent, newResourceUri, function (error, res)
        //             {
        //                 pdfMockFile.md5.should.equal(md5(res.body));
        //                 res.statusCode.should.equal(200);
        //
        //                 itemUtils.getItemMetadataByUri(true, agent, newResourceUri, function (error, res) {
        //                     res.statusCode.should.equal(200);
        //                     res.body.descriptors.should.be.instanceof(Array);
        //                     descriptorUtils.noPrivateDescriptors(JSON.parse(res.text).descriptors).should.equal(true);
        //
        //                     descriptorUtils.containsAllMetadata(
        //                         pdfMockFile.metadata,
        //                         JSON.parse(res.text).descriptors
        //                     );
        //
        //                     done();
        //                 });
        //             });
        //         });
        //     });
        // });
        //
        // it("Should upload a Word DOCX file successfully and extract its text for content-based indexing", function (done) {
        //     userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        //     {
        //         fileUtils.uploadFile(true, agent, privateProject.handle, testFolder1.name, docxMockFile, function (err, res)
        //         {
        //             res.statusCode.should.equal(200);
        //             res.body.should.be.instanceof(Array);
        //             res.body.length.should.equal(1);
        //             const newResourceUri = res.body[0].uri;
        //
        //             fileUtils.downloadFileByUri(true, agent, newResourceUri, function (error, res)
        //             {
        //                 docxMockFile.md5.should.equal(md5(res.body));
        //                 res.statusCode.should.equal(200);
        //
        //                 itemUtils.getItemMetadataByUri(true, agent, newResourceUri, function (error, res) {
        //                     res.statusCode.should.equal(200);
        //                     res.body.descriptors.should.be.instanceof(Array);
        //                     descriptorUtils.noPrivateDescriptors(JSON.parse(res.text).descriptors).should.equal(true);
        //
        //                     descriptorUtils.containsAllMetadata(
        //                         docxMockFile.metadata,
        //                         JSON.parse(res.text).descriptors
        //                     );
        //
        //                     done();
        //                 });
        //             });
        //         });
        //     });
        // });
        //
        // it("Should upload a Word DOC file successfully and extract its text for content-based indexing", function (done) {
        //     userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        //     {
        //         fileUtils.uploadFile(true, agent, privateProject.handle, testFolder1.name, docMockFile, function (err, res)
        //         {
        //             res.statusCode.should.equal(200);
        //             res.body.should.be.instanceof(Array);
        //             res.body.length.should.equal(1);
        //             const newResourceUri = res.body[0].uri;
        //
        //             fileUtils.downloadFileByUri(true, agent, newResourceUri, function (error, res)
        //             {
        //                 docMockFile.md5.should.equal(md5(res.body));
        //                 res.statusCode.should.equal(200);
        //
        //                 itemUtils.getItemMetadataByUri(true, agent, newResourceUri, function (error, res) {
        //                     res.statusCode.should.equal(200);
        //                     res.body.descriptors.should.be.instanceof(Array);
        //                     descriptorUtils.noPrivateDescriptors(JSON.parse(res.text).descriptors).should.equal(true);
        //
        //                     descriptorUtils.containsAllMetadata(
        //                         docMockFile.metadata,
        //                         JSON.parse(res.text).descriptors
        //                     );
        //
        //                     done();
        //                 });
        //             });
        //         });
        //     });
        // });

        // it("Should upload a CSV file successfully and extract its data content to the datastore", function (done) {
        //     userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        //     {
        //         fileUtils.uploadFile(true, agent, privateProject.handle, testFolder1.name, csvMockFile, function (err, res)
        //         {
        //             res.statusCode.should.equal(200);
        //             res.body.should.be.instanceof(Array);
        //             res.body.length.should.equal(1);
        //             const newResourceUri = res.body[0].uri;
        //
        //             fileUtils.downloadFileByUri(true, agent, newResourceUri, function (error, res)
        //             {
        //                 csvMockFile.md5.should.equal(md5(res.body));
        //                 res.statusCode.should.equal(200);
        //
        //                 fileUtils.downloadDataByUri(true, agent, newResourceUri, function (error, res)
        //                 {
        //                     should.equal(error, null);
        //                     res.statusCode.should.equal(200);
        //
        //                     const fs = require('fs');
        //                     const path = require('path');
        //                     const downloadCSV = path.join(Config.tempFilesDir,"csv_dump1.csv");
        //
        //                     fs.writeFileSync(downloadCSV, res.text);
        //                     //fs.unlinkSync(downloadCSV);
        //
        //                     md5(res.text).should.equal(csvResultMD5);
        //                     done();
        //                 });
        //             });
        //         });
        //     });
        // });

        it("Should upload a XLSX file successfully and extract its data content to the datastore", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                fileUtils.uploadFile(true, agent, privateProject.handle, testFolder1.name, xlsxMockFile, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.should.be.instanceof(Array);
                    res.body.length.should.equal(1);
                    const newResourceUri = res.body[0].uri;

                    fileUtils.downloadFileByUri(true, agent, newResourceUri, function (error, res)
                    {
                        xlsxMockFile.md5.should.equal(md5(res.body));
                        res.statusCode.should.equal(200);

                        fileUtils.downloadDataByUri(true, agent, newResourceUri, function (error, res)
                        {
                            should.equal(error, null);
                            res.statusCode.should.equal(200);

                            const fs = require('fs');
                            const path = require('path');
                            const downloadCSV = path.join(Config.tempFilesDir,"csv_dump2.csv");

                            fs.writeFileSync(downloadCSV, res.text);
                            //fs.unlinkSync(downloadCSV);

                            md5(res.text).should.equal(csvResultMD5);
                            done();
                        }, "Sheet1");
                    });
                });
            });
        });
    });

    after(function (done) {
        //destroy graphs
        this.timeout(Config.testsTimeout);
        appUtils.clearAppState(function (err, data) {
            should.equal(err, null);
            done();
        });
    });
});