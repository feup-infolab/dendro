process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");
const path = require("path");

const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const depositUtils = require(Pathfinder.absPathInTestsFolder("utils/deposit/depositUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const createFoldersUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/folders/createFolders.Unit.js"));
const createProjectsUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/projects/createProjects.Unit.js"));
const createFilesUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/files/createFiles.Unit.js"));

const projectsData = createProjectsUnit.projectsData;
const foldersData = createFoldersUnit.foldersData;
const filesData = createFilesUnit.filesData;

const B2ShareDepositData = require(Pathfinder.absPathInTestsFolder("mockdata/deposits/B2ShareDeposit.js"));

function requireUncached (module)
{
  delete require.cache[require.resolve(module)];
  return require(module);
}

const start = function ()
{
  if (Config.debug.tests.log_unit_completion_and_startup)
  {
    console.log("**********************************************".green);
    console.log("[Creating deposits unit] Creating deposit with outside links...".green);
    console.log("**********************************************".green);
  }
};

const end = function ()
{
  if (Config.debug.tests.log_unit_completion_and_startup)
  {
    console.log("**********************************************".blue);
    console.log("[Creating deposits unit] Complete.".blue);
    console.log("**********************************************".blue);
  }
};

module.exports.setup = function (finish)
{
  start();

  createFoldersUnit.setup(function (err, results)
  {
    if (err)
    {
      finish(err, results);
      end();
    }
    else
    {
      appUtils.registerStartTimeForUnit(path.basename(__filename));
      async.mapSeries(projectsData, function (projectData, cb)
      {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        {
          if (err)
          {
            cb(err, agent);
          }
          else
          {
            projectUtils.getProjectRootContent(true, agent, projectData.handle, function(err, res){
              const folders = res.body;
              B2ShareDepositData.ddr.exportedFromFolder = folders[0].uri;
              depositUtils.createDeposit(B2ShareDepositData, function (err, res)
              {
                cb(err, res);
              });
            });

          }
        });
      }, function (err, results)
      {
        appUtils.registerStopTimeForUnit(path.basename(__filename));
        finish(err, results);
        end();
      });
    }
  });
};
