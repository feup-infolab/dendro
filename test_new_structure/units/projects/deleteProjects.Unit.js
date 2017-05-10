process.env.NODE_ENV = 'test';

const Config = GLOBAL.Config;

const chai = require('chai');
chai.use(require('chai-http'));
const async = require('async');
const should = chai.should();

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
    delete require.cache[require.resolve(module)]
    return require(module)
}

module.exports.setup = function(finish)
{
    const projectsData = [publicProjectData, metadataOnlyProjectData, privateProjectData, publicProjectForHTMLTestsData, metadataOnlyProjectForHTMLTestsData, privateProjectForHTMLTestsData];
    let createProjectsUnit = requireUncached(Config.absPathInTestsFolder("units/projects/createProjects.Unit.js"));

    createProjectsUnit.setup(function (err, results) {
        if(err)
        {
            finish(err, results);
        }
        else
        {
            async.mapSeries(projectsData, function (projectData, cb) {
                userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                    if(err)
                    {
                        cb(err, agent);
                    }
                    else
                    {
                        projectUtils.deleteProject(true, agent, projectData.handle, function (err, res) {
                            cb(err, res);
                        });
                    }
                });
            }, function (err, results) {
                finish(err, results);
            });
        }
    });
};