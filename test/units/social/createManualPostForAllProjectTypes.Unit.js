process.env.NODE_ENV = 'test';

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const chai = require("chai");
chai.use(require('chai-http'));
const async = require("async");

const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const folderUtils = require(Pathfinder.absPathInTestsFolder("utils/folder/folderUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("/utils/item/itemUtils"));
const socialDendroUtils = require(Pathfinder.absPathInTestsFolder("/utils/social/socialDendroUtils"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2"));

function requireUncached(module) {
    delete require.cache[require.resolve(module)]
    return require(module)
}

module.exports.setup = function(finish)
{
    let createProjectsUnit = requireUncached(Pathfinder.absPathInTestsFolder("units/projects/createProjects.Unit.js"));
    const projectsData = createProjectsUnit.projectsData;

    let uploadFilesAndAddMetadataUnit = requireUncached(Pathfinder.absPathInTestsFolder("units/social/uploadFilesAndAddMetadata.Unit.js"));
    let manualPostMockData = requireUncached(Pathfinder.absPathInTestsFolder("mockdata/social/manualPostMock.js"));

    uploadFilesAndAddMetadataUnit.setup(function (err, results) {
        if(err)
        {
            finish(err, results);
        }
        else
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                if(err)
                {
                    finish(err, agent);
                }
                else
                {
                    async.mapSeries(projectsData, function (projectData, cb) {
                        socialDendroUtils.createManualPostInProject(true, agent, projectData, manualPostMockData, function (err, res) {
                            cb(err, res);
                        });
                    }, function (err, results) {
                        finish(err, results);
                    });
                }
            });
        }
    });
};