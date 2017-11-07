process.env.NODE_ENV = 'test';

const Pathfinder = global.Pathfinder;

const chai = require('chai');
chai.use(require('chai-http'));
const async = require('async');

const appUtils = require(Pathfinder.absPathInTestsFolder('/utils/app/appUtils.js'));
const userUtils = require(Pathfinder.absPathInTestsFolder('utils/user/userUtils.js'));
const fileUtils = require(Pathfinder.absPathInTestsFolder('utils/file/fileUtils.js'));

const demouser1 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser1'));
const zipMockFile = require(Pathfinder.absPathInTestsFolder('mockdata/files/zipMockFile.js'));
const txtMockFile = require(Pathfinder.absPathInTestsFolder('mockdata/files/txtMockFile.js'));

const createFoldersUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder('units/folders/createFolders.Unit.js'));
const createProjectsUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder('units/projects/createProjects.Unit.js'));

const projectsData = createProjectsUnit.projectsData;
const foldersData = createFoldersUnit.foldersData;
const filesData = [txtMockFile, zipMockFile];

module.exports.allFiles = filesData;

module.exports.setup = function (finish)
{
    createFoldersUnit.setup(function (err, results)
    {
        if (err)
        {
            finish(err, results);
        }
        else
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                if (err)
                {
                    finish(err, agent);
                }
                else
                {
                    async.mapSeries(projectsData, function (projectData, cb)
                    {
                        async.mapSeries(foldersData, function (folderData, cb)
                        {
                            async.mapSeries(filesData, function (file, cb)
                            {
                                fileUtils.uploadFile(true, agent, projectData.handle, folderData.name, file, function (err, res)
                                {
                                    cb(err, res);
                                });
                            }, function (err, results)
                            {
                                cb(err, results);
                            });
                        }, function (err, results)
                        {
                            cb(err, results);
                        });
                    }, function (err, results)
                    {
                        finish(err, results);
                    });
                }
            });
        }
    });
};
