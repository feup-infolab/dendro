process.env.NODE_ENV = "test";

const chai = require("chai");
const chaiHttp = require("chai-http");
chai.use(chaiHttp);
const fs = require("fs");
const path = require("path");
const async = require("async");
const rlequire = require("rlequire");
const Config = global.Config;

const should = chai.should();
const appUtils = rlequire("dendro", "test/utils/app/appUtils.js");

const publicProject = rlequire("dendro", "test/mockdata/projects/public_project.js");
const metadataOnlyProject = rlequire("dendro", "test/mockdata/projects/metadata_only_project.js");
const privateProject = rlequire("dendro", "test/mockdata/projects/private_project.js");

const md5File = require("md5-file");

const projectUtils = rlequire("dendro", "test/utils/project/projectUtils.js");
const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const depositUtils = rlequire("dendro", "test/utils/deposit/depositUtils");

let demouser1 = rlequire("dendro", "test/mockdata/users/demouser1");
let demouser2 = rlequire("dendro", "test/mockdata/users/demouser2");
let demouser3 = rlequire("dendro", "test/mockdata/users/demouser3");

const folder = rlequire("dendro", "test/mockdata/folders/folder.js");
const db = rlequire("dendro", "test/utils/db/db.Test.js");
const createFoldersUnit = rlequire("dendro", "test/units/folders/createFolders.Unit.js");
const createDepositsUnit = rlequire("dendro", "test/units/deposits/createDeposits.Unit.js");

let Project;
let User;

const params = {
    key: "project",
    uuid: "aerg35tgsrh45h",
    offset: 0,
    page: 10
};

let depositUri;

// TODO create unit of mock deposits +- 5 6 of different types

describe("Deposits/latest", function (done)
{
    before(function (done)
    {
        this.timeout(60000);
        createDepositsUnit.setup(function (err, deposit)
        {
            depositUri = deposit.uri;
            should.equal(err, null);
            done();
        });
    });
    /* describe('?get_deposits', function () {

    it("should not show private deposits to unauthenticated user", function (done) {
      let app = global.tests.app;
      let agent = chai.request.agent(app);

      depositUtils.sendDeposits(true, params, agent, function (err, res) {
        should.exist(err);
        res.should.have.status(404);
        done();
      })
    });

    it("should not show private deposits to user without project permissions", function (done) {
      userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {

        depositUtils.sendDeposits(true, params, agent, function (err, res) {
          should.exist(err);
          res.should.have.status(404);
          done();
        });
      });
    });

    it("should not show deposits from other projects", function (done) {
      userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
        //create deposit in another project

        depositUtils.sendDeposits(true, params, agent, function (err, res) {
          should.exist(err);
          res.should.have.status(404);
          done();
        });
      });

    });

    it("should show a private deposit to project contributor", function (done) {
      userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
        //create deposit in project

        depositUtils.sendDeposits(true, params, agent, function (err, res) {
          should.exist(err);
          res.should.have.status(404);
          done();
        });
      });
    });

    it("should show a private deposit to project creator", function (done) {
      userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
        //create deposit in another project

        depositUtils.sendDeposits(true, params, agent, function (err, res) {
          should.exist(err);
          res.should.have.status(404);
          done();
        });
      });
    });

    it("should not show private deposits to unauthenticated user", function (done) {
      let app = global.tests.app;
      let agent = chai.request.agent(app);

      depositUtils.sendDeposits(true, params, agent, function(err, res){
        should.exist(err);
        res.should.have.status(404);
        done();
      })
    });

    it("should show my deposits", function (done) {
      userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
        //create deposit in a project

        depositUtils.sendDeposits(true, params, agent, function(err, res){
          should.exist(err);
          res.should.have.status(200);
          done();
        });
      });
    });

    it("should show deposits only from the b2share platform", function (done) {
      const params = {
        platforms : {
          "EUDAT B2SHARE" : true
        },
      }
      userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
        //create deposit in a project

        depositUtils.sendDeposits(true, params, agent, function(err, res){
          should.not.exist(err);
          res.should.have.status(200);
          done();
        });
      });
    });

    it("should show deposits only from the training b2share repository", function (done) {
      const params = {
        repository : {
          "trng-b2share.eudat.eu" : true
        },
      }
      userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
        depositUtils.sendDeposits(true, params, agent, function(err, res){
          should.not.exist(err);
          res.should.have.status(200);
          done();
        });
      });
    });

    it("should show deposits made in 2017", function (done) {
      const params = {
        dateFrom : "2017-01-01T00:00:00+0000",
        dateTo : "2018-01-01T00:00:00+0000",
      }

      userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
        //create deposit in a project

        depositUtils.sendDeposits(true, params, agent, function(err, res){
          should.not.exist(err);
          res.should.have.status(200);
          done();
        });
      });
    });

    it("should show deposits made before 2017", function (done) {
      const params = {
        dateTo : "2017-01-01T00:00:00+0000",
      }

      userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
        //create deposit in a project

        depositUtils.sendDeposits(true, params, agent, function(err, res){
          should.not.exist(err);
          res.should.have.status(200);
          done();
        });
      });
    });

    it("should show deposits made after 2017", function (done) {
      const params = {
        dateFrom : "2018-01-01T00:00:00+0000",
      }

      userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
        //create deposit in a project

        depositUtils.sendDeposits(true, params, agent, function(err, res){
          should.not.exist(err);
          res.should.have.status(200);
          done();
        });
      });
    });
  });
*/
    describe("verifying outside deposits", function ()
    {
        it("should confirm a deposit is still active in a ckan platform", function (done)
        {
            const agent = aaa;
            depositUtils.getDeposit(depositUri, agent, function (err, deposit)
            {
                if (isNull(deposit))
                {
                    const outsideUri = "https://" + deposit.ddr.exportedToRepository + "/dataset/" + deposit.dcterms.identifier;
                    request(outsideUri, function (err, response, body)
                    {
                        if (response.statusCode === 200)
                        {
                            done();
                        }
                    });
                }
                done(1);
            });
        });

        it("should confirm a deposit is still active in a dspace platform", function (done)
        {
            done();
        });

        it("should confirm a deposit is still active in a eprints platform", function (done)
        {
            done();
        });

        it("should confirm a deposit is still active in a figshare platform", function (done)
        {
            done();
        });

        it("should confirm a deposit is still active in a zenodo platform", function (done)
        {
            done();
        });

        it("should confirm a deposit is still active in a b2share platform", function (done)
        {
            done();
        });

        it("should report a deposit is non existing in an outside platform", function (done)
        {
            done();
        });
    });

    /* describe("copy selected contents from a project to a deposit", function(){

  });*/

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
