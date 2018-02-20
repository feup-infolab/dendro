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

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));

const project = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));
const invalidProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/invalidProject.js"));

const Project = require(Pathfinder.absPathInSrcFolder("models/project.js")).Project;

const createFilesUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/files/createFiles.Unit.js"));

describe("Backup Public project", function ()
{
  this.timeout(Config.testsTimeout);
  before(function (done)
  {
    createFilesUnit.setup(function (err, results)
    {
      should.equal(err, null);
      done();
    });
  });

  describe("[PUBLIC PROJECT] /project/" + project.handle + "?bagit", function ()
  {
    it("Should create a copy from an existing folder", function (done)
    {
      userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
      {
        Project.findByHandle(publicProject.handle, function(err, project){
          const a = 2;

        });
      });
    });

    it("Should NOT create a copy when the source uri does not point to anything", function (done)
    {

    });

    it("Should NOT give an error and produce a proper backup when the user is authenticated, even though not as a creator nor contributor of the project, because the project is public", function (done)
    {

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
