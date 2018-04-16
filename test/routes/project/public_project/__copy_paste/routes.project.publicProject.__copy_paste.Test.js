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
const Folder = require(Pathfinder.absPathInSrcFolder("models/directory_structure/folder.js")).Folder;
const File = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/file.js")).File;

const publicProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));

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

  describe("[PUBLIC PROJECT] /project/" + project.handle + "?copy_paste", function ()
  {
    it("Should create a copy from an existing folder", function (done)
    {
      userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
      {
        userUtils.getLoggedUserDetails(true, agent, function(err, user){

          Project.findByHandle(publicProject.handle, function(err, project){
            Folder.findByUri(project.ddr.rootFolder, function(err, folder){
              folder.getChildrenRecursive(function (err, children) {
                const fileUri = children[26].uri;
                const folderDestUri = children[1].uri;
                File.findByUri(fileUri, function (err, file) {
                  Folder.findByUri(folderDestUri, function (err, destFolder) {
                    file.copyPaste({user: user, destinationFolder: destFolder}, function(err, writtenPath){

                    });
                  })

                });
              });
            });

          });
        });
      });

    });
/*

    it("Should NOT create a copy when the source uri does not point to anything", function (done)
    {
      userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
      {
        userUtils.getLoggedUserDetails(true, agent, function(err, user){

          Project.findByHandle(publicProject.handle, function(err, project){
            Folder.findByUri(project.ddr.rootFolder, function(err, folder){
              folder.getChildrenRecursive(function (err, children) {
                const folderUri = children[0].uri;
                const folderDestUri = children[1].uri;
                fileUtils.downloadFileByUri(true, agent, children[12].uri, function(err, file){
                  Folder.findByUri(folderUri, function (err, srcFolder) {
                    srcFolder.zipAndDownload(false, function(err, writtenPath){
                      const zipLocation = writtenPath;
                      Folder.findByUri(folderDestUri, function(err, folder){
                        folder.restoreFromLocalBackupZipFile(zipLocation, user, function(err, destFolder){
                          const f = srcFolder;
                          const a = 2;


                          //testing
                          //TODO verify content of both folders
                        });
                      })
                    });
                  });
                })


              });
            });

          });
        });
      });
    });
*/

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
