process.env.NODE_ENV = 'test';

const Config = GLOBAL.Config;

const chai = require('chai');
chai.use(require('chai-http'));
const should = chai.should();
const async = require('async');
const colors = require('colors');

const projectUtils = require(Config.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));
const folderUtils = require(Config.absPathInTestsFolder("utils/folder/folderUtils.js"));

const demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1"));
const demouser2 = require(Config.absPathInTestsFolder("mockdata/users/demouser2"));

const publicProjectData = require(Config.absPathInTestsFolder("mockdata/projects/public_project.js"));
const metadataOnlyProjectData = require(Config.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
const privateProjectData = require(Config.absPathInTestsFolder("mockdata/projects/private_project.js"));

const publicProjectForHTMLTestsData = require(Config.absPathInTestsFolder("mockdata/projects/public_project_for_html.js"));
const metadataOnlyProjectForHTMLTestsData = require(Config.absPathInTestsFolder("mockdata/projects/metadata_only_project_for_html.js"));
const privateProjectForHTMLTestsData = require(Config.absPathInTestsFolder("mockdata/projects/private_project_for_html.js"));

function requireUncached(module) {
    delete require.cache[require.resolve(module)];
    return require(module);
}

const start = function()
{
    console.log("**********************************************".green);
    console.log("[Create Projects Unit] Setting up projects...".green);
    console.log("**********************************************".green);
};

const end = function()
{
    console.log("**********************************************".blue);
    console.log("[Create Projects Unit] Complete...".blue);
    console.log("**********************************************".blue);
};

module.exports.setup = function(finish)
{
    start();
    const projectsData = [publicProjectData, metadataOnlyProjectData, privateProjectData, publicProjectForHTMLTestsData, metadataOnlyProjectForHTMLTestsData, privateProjectForHTMLTestsData];
    //let bootupUnit = requireUncached(Config.absPathInTestsFolder("units/bootup.Unit.js"));
    let createUsersUnit = requireUncached(Config.absPathInTestsFolder("units/users/createUsers.Unit.js"));

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

