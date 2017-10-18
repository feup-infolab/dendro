const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
var fs = require("fs");

const b2drop = require(Pathfinder.absPathInSrcFolder("/kb/B2Drop.js")).B2Drop;
const b2dropAccount = require(Pathfinder.absPathInTestsFolder("/mockdata/accounts/b2DropAccount.js"));
const testFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/pngMockFile.js"));

//b2DropTestFolderUnit vars
const testPathFolder1 = '/teste1';
const testPathFolder2 = "/teste2";
const invalidPasswordFolder = "gg";
const passwordFolder = "ananasManga1234Alfragide";
const shareLink = "https://b2drop.eudat.eu/s/PwzBCH3iSfGP6Mb";


describe("[B2Drop]", function (done) {
    before(function (done) {
        this.timeout(50000);
        done();
    });

    describe("[Login/out]", function () {
        it("Should Login and Logout", function (done) {
            this.timeout(15000);
            var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
            account.login(function (err, response) {
                response.should.have.property('statusCode', 200);
                account.logout(function (err, response) {
                    response.should.have.property('statusCode', 200);
                    done();
                });
            });
        })
    });


    describe("[Create Share Link ]", function () {
        it("Should  succesfully get link", function (done) {
            this.timeout(15000);
            var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
            account.login(function (err, res) {
                res.should.have.property('statusCode', 200);
                account.getShareLink(testPathFolder1, passwordFolder, function (err, response, shareLink) {
                    console.log(shareLink);
                    response.should.have.property('statusCode', 200);
                    shareLink.should.contain("https://b2drop.eudat.eu/s/");
                    account.logout(function (err, response) {
                        response.should.have.property('statusCode', 200);
                        done();
                    });
                });
            })
        });
    });


    describe("[PUT] ", function () {
        it("Should upload successfully test file", function (done) {
            this.timeout(15000);
            var fileUri = "/" + testFile.name;

            var inputStream = fs.createReadStream(testFile.location);

            inputStream.on('readable', function () {
                var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
                account.initiateWebDavShareLink(shareLink, passwordFolder, function (err, res) {
                    res.should.have.property('statusCode', 303);
                    account.put(fileUri, inputStream, function (err, res) {
                        res.should.have.status(204);
                        inputStream.close();
                        done();
                    });
                });
            });
        });
        describe("[GET]", function () {
            it("Should get succesfully test file", function (done) {
                var account = new b2drop();
                var fileUri = testPathFolder2 + "/" + testFile.name;
                var outputStream = fs.createWriteStream(testFile.location);
                account.get(shareLink, passwordFolder, fileUri, outputStream, function (err, res) {
                    res.should.have.status(200);
                    outputStream.close();
                    done();
                });
            });
        });
        //TODO fileURI
        describe("[DELETE]", function () {
            it("Should delete succesfully test file", function (done) {
                var account = new b2drop();
                var fileUri = testPathFolder2 + "/" + testFile.name;
                account.delete(shareLink, passwordFolder, fileUri, function (err, res) {
                    res.should.have.status(200);
                    done();
                });
            });

        });

        describe("[Create Folder]", function () {
            it("Should  succesfully create folder", function (done) {
                var account = new b2drop();
                account.createFolder(shareLink, passwordFolder, folderUri, function (err, res) {
                    res.should.have.status(200);
                    done();
                });
            });
        });

        describe("[List Folder]", function () {
            it("Should  succesfully list folder", function (done) {
                var account = new b2drop("", "");
                account.initiateWebDavShareLink(shareLink, passwordFolder, function (err, res) {
                    res.should.have.status(200);
                    account.getDirectoryContents("/", function (err, resp) {
                        console.log(err);
                        resp.should.have.status(207);
                        done();
                    })
                });


            });
        });
        /*
                    describe("[Delete Folder]" , function() {
                        it("Should  succesfully delete folder", function (done) {
                            var account = new b2drop();
                            account.deleteFolder(shareLink,passwordFolder,folderUri, function(err, res) {
                                res.should.have.status(200);
                                done();
                            });
                        });
                    });*/
    });
    after(function (done) {
        this.timeout(50000);
        done();
    });
});

