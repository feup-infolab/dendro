process.env.NODE_ENV = 'test';

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;

const chai = require('chai');
chai.use(require('chai-http'));
const should = chai.should();
const async = require('async');
const colors = require('colors');
const path = require('path');

const projectUtils = require(Pathfinder.absPathInTestsFolder('utils/project/projectUtils.js'));
const userUtils = require(Pathfinder.absPathInTestsFolder('utils/user/userUtils.js'));
const folderUtils = require(Pathfinder.absPathInTestsFolder('utils/folder/folderUtils.js'));
const appUtils = require(Pathfinder.absPathInTestsFolder('utils/app/appUtils.js'));

const demouser1 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser1'));
const demouser2 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser2'));

const publicProjectData = require(Pathfinder.absPathInTestsFolder('mockdata/projects/public_project.js'));
const metadataOnlyProjectData = require(Pathfinder.absPathInTestsFolder('mockdata/projects/metadata_only_project.js'));
const privateProjectData = require(Pathfinder.absPathInTestsFolder('mockdata/projects/private_project.js'));
const projectCreatedByDemoUser3 = require(Pathfinder.absPathInTestsFolder('mockdata/projects/private_project_created_by_demouser3.js'));

const publicProjectForHTMLTestsData = require(Pathfinder.absPathInTestsFolder('mockdata/projects/public_project_for_html.js'));
const metadataOnlyProjectForHTMLTestsData = require(Pathfinder.absPathInTestsFolder('mockdata/projects/metadata_only_project_for_html.js'));
const privateProjectForHTMLTestsData = require(Pathfinder.absPathInTestsFolder('mockdata/projects/private_project_for_html.js'));

const projectsData = module.exports.projectsData = [publicProjectData, metadataOnlyProjectData, privateProjectData, publicProjectForHTMLTestsData, metadataOnlyProjectForHTMLTestsData, privateProjectForHTMLTestsData, projectCreatedByDemoUser3];

function requireUncached (module)
{
    delete require.cache[require.resolve(module)];
    return require(module);
}

const start = function ()
{
    if (Config.debug.tests.log_unit_completion_and_startup)
    {
        console.log('**********************************************'.green);
        console.log('[Create Projects Unit] Setting up projects...'.green);
        console.log('**********************************************'.green);
    }
};

const end = function ()
{
    if (Config.debug.tests.log_unit_completion_and_startup)
    {
        console.log('**********************************************'.blue);
        console.log('[Create Projects Unit] Complete...'.blue);
        console.log('**********************************************'.blue);
    }
};

module.exports.setup = function (finish)
{
    start();
    let createUsersUnit = requireUncached(Pathfinder.absPathInTestsFolder('units/users/createUsers.Unit.js'));

    createUsersUnit.setup(function (err, results)
    {
        // should.equal(err, null);
        if (err)
        {
            end();
            finish(err, results);
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
                        end();
                        cb(err, agent);
                    }
                    else
                    {
                        projectUtils.createNewProject(true, agent, projectData, function (err, res)
                        {
                            end();
                            cb(err, res);
                        });
                    }
                });
            }, function (err, results)
            {
                // should.equal(err, null);
                appUtils.registerStopTimeForUnit(path.basename(__filename));
                finish(err, results);
            });
        }
    });
};
