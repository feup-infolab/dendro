process.env.NODE_ENV = 'test';

const Config = global.Config;

const chai = require('chai');
chai.use(require('chai-http'));
const should = chai.should();
const async = require('async');
const colors = require('colors');

const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const folderUtils = require(Pathfinder.absPathInTestsFolder("utils/folder/folderUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2"));

const publicProjectData = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));
const metadataOnlyProjectData = require(Pathfinder.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
const privateProjectData = require(Pathfinder.absPathInTestsFolder("mockdata/projects/private_project.js"));

const publicProjectForHTMLTestsData = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project_for_html.js"));
const metadataOnlyProjectForHTMLTestsData = require(Pathfinder.absPathInTestsFolder("mockdata/projects/metadata_only_project_for_html.js"));
const privateProjectForHTMLTestsData = require(Pathfinder.absPathInTestsFolder("mockdata/projects/private_project_for_html.js"));

function requireUncached(module) {
    delete require.cache[require.resolve(module)];
    return require(module);
}

const start = function()
{
    if(Config.debug.tests.log_unit_completion_and_startup)
    {
        console.log("**********************************************".green);
        console.log("[Create Projects Unit] Setting up projects...".green);
        console.log("**********************************************".green);
    }
};

const end = function()
{
    if(Config.debug.tests.log_unit_completion_and_startup)
    {
        console.log("**********************************************".blue);
        console.log("[Create Projects Unit] Complete...".blue);
        console.log("**********************************************".blue);
    }
};

module.exports.setup = function(finish)
{
    start();
    const projectsData = [publicProjectData, metadataOnlyProjectData, privateProjectData, publicProjectForHTMLTestsData, metadataOnlyProjectForHTMLTestsData, privateProjectForHTMLTestsData];
    //let bootupUnit = requireUncached(Pathfinder.absPathInTestsFolder("units/bootup.Unit.js"));
    let createUsersUnit = requireUncached(Pathfinder.absPathInTestsFolder("units/users/createUsers.Unit.js"));

    createUsersUnit.setup(function (err, results) {
        //should.equal(err, null);
        if(err)
        {
            end();
            finish(err, results);
        }
        else
        {
            async.mapSeries(projectsData, function (projectData, cb) {
                userUtils.loginUser(demouser1.username,demouser1.password, function (err, agent) {
                    if(err)
                    {
                        end();
                        cb(err, agent);
                    }
                    else
                    {
                        projectUtils.createNewProject(true, agent, projectData, function (err, res) {
                            end();
                            cb(err, res);
                        });
                    }
                });
            }, function (err, results) {
                //should.equal(err, null);
                finish(err, results);
            });
        }
    });
};

