process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("/utils/item/itemUtils"));
const fileUtils = require(Pathfinder.absPathInTestsFolder("utils/file/fileUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));

const csvMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/csvMockFile.js"));
const docMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/docMockFile.js"));
const docxMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/docxMockFile.js"));
const pdfMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/pdfMockFile.js"));
const pngMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/pngMockFile.js"));
const xlsMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/xlsMockFile.js"));
const xlsxMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/xlsxMockFile.js"));
const zipMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/zipMockFile.js"));
const txtMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/txtMockFile.js"));
const odsMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/odsMockFile.js"));

const filesData = [csvMockFile, docMockFile, docxMockFile, pdfMockFile, pngMockFile, xlsMockFile, xlsxMockFile, zipMockFile, txtMockFile, odsMockFile];

let createProjectsUnit = requireUncached(Pathfinder.absPathInTestsFolder("units/projects/createProjects.Unit.js"));
const projectsData = createProjectsUnit.projectsData;

let addMetadataToFoldersUnit = requireUncached(Pathfinder.absPathInTestsFolder("units/metadata/addMetadataToFolders.Unit.js"));
let createFoldersUnit = requireUncached(Pathfinder.absPathInTestsFolder("units/folders/createFolders.Unit.js"));
const foldersData = createFoldersUnit.foldersData;

function requireUncached (module)
{
    delete require.cache[require.resolve(module)];
    return require(module);
}

module.exports.setup = function (finish)
{
    addMetadataToFoldersUnit.setup(function (err, results)
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
                            async.mapSeries(filesData, function (fileData, cb)
                            {
                                fileUtils.uploadFile(true, agent, projectData.handle, folderData.name, fileData, function (err, res)
                                {
                                    if (isNull(err))
                                    {
                                        const newFileUri = JSON.parse(res.text)[0].uri;
                                        itemUtils.updateItemMetadataByUri(true, agent, newFileUri, fileData.metadata, function (err, res)
                                        {
                                            cb(err, res);
                                        });
                                    }
                                    else
                                    {
                                        cb(err, res);
                                    }
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
