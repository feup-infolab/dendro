"use strict";

process.env.NODE_ENV = 'test';

let chai = require('chai');
let chaiHttp = require('chai-http');
const md5 = require("md5");
chai.use(chaiHttp);

const should = chai.should();

let agent = null;

const demouser1 = require("../mockdata/users/demouser1.js");
const demouser2 = require("../mockdata/users/demouser1.js");
const demouser3 = require("../mockdata/users/demouser1.js");

const folder = require('../mockdata/folders/folder.js');

const metadataOnlyProject = require("../mockdata/projects/metadata_only_project.js");
const publicProject = require("../mockdata/projects/public_project.js");
const privateProject= require("../mockdata/projects/private_project.js");

const fileUtils= require("../utils/file/fileUtils.js");
const folderUtils= require("../utils/folder/folderUtils.js");
const userUtils = require("../utils/user/userUtils.js");

describe('/project/' + publicProject.handle + "/data/" + folder.pathInProject + folder.name + "?download", function ()
{
    it('should download folder from a public project, user unauthenticated', function (done) {
        folderUtils.downloadFolder(false, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
                if (err) done(err);

                res.should.have.status(200);
                md5(res.body).should.be.equal.to(folder.download_md5);
                done();
            });
    });

    it('should download folder from a public project, user authenticated as ' + demouser1 + " (creator) ", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            folderUtils.downloadFolder(false, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
                if (err) done(err);

                res.should.have.status(200);
                md5(res.body).should.be.equal.to(folder.download_md5);
                done();
            });
        });
    });
    
    it('should download folder from a public project, user authenticated as ' + demouser2.username + " (contributor) ", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            folderUtils.downloadFolder(false, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
                if (err) done(err);

                res.should.have.status(200);
                md5(res.body).should.be.equal.to(folder.download_md5);
                done();
            });
        });
    });

    it('should download folder from a public project, user authenticated as ' + demouser3.username + " (not related to the project) ", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            folderUtils.downloadFolder(false, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
                if (err) done(err);

                res.should.have.status(200);
                md5(res.body).should.be.equal.to(folder.download_md5);
                done();
            });
        });
    });
});
