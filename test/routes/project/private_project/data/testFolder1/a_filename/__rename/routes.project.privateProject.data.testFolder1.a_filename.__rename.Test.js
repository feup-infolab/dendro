const chai = require('chai');
const async = require('async');
const chaiHttp = require('chai-http');
const should = chai.should();
const _ = require('underscore');
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;

const userUtils = require(Pathfinder.absPathInTestsFolder('utils/user/userUtils.js'));
const itemUtils = require(Pathfinder.absPathInTestsFolder('utils/item/itemUtils.js'));
const appUtils = require(Pathfinder.absPathInTestsFolder('utils/app/appUtils.js'));
const fileUtils = require(Pathfinder.absPathInTestsFolder('utils/file/fileUtils.js'));
const folderUtils = require(Pathfinder.absPathInTestsFolder('utils/folder/folderUtils.js'));
const projectUtils = require(Pathfinder.absPathInTestsFolder('utils/project/projectUtils.js'));

const demouser1 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser1.js'));
const demouser2 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser2.js'));
const demouser3 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser3.js'));

const privateProject = require(Pathfinder.absPathInTestsFolder('mockdata/projects/private_project.js'));

const testFolder1 = require(Pathfinder.absPathInTestsFolder('mockdata/folders/testFolder1.js'));
const createFilesUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder('units/files/createFiles.Unit.js'));

const txtMockFile = require(Pathfinder.absPathInTestsFolder('mockdata/files/txtMockFile.js'));

const allFiles = createFilesUnit.filesData;

describe('Private project testFolder1 ?rename', function ()
{
    this.timeout(Config.testsTimeout);
    describe('[POST] [FOLDER] [PRIVATE PROJECT] [Invalid Cases] /project/' + privateProject.handle + '/data/:foldername?rename', function ()
    {
        before(function (done)
        {
            createFilesUnit.setup(function (err, results)
            {
                should.equal(err, null);
                done();
            });
        });

        it('Should give an error when the user is unauthenticated', function (done)
        {
            // in this test, first we get the contents of a project with the proper authentication,
            // then we try to rename it after logging out
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                should.equal(err, null);
                projectUtils.getProjectRootContent(true, agent, privateProject.handle, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    const contents = JSON.parse(res.text);

                    // find the id of the folder with title we want
                    const folder = _.find(contents, function (folder)
                    {
                        return folder.nie.title === testFolder1.name;
                    });

                    should.not.equal(typeof folder, 'undefined');
                    should.equal(folder.nie.title, testFolder1.name);

                    userUtils.logoutUser(agent, function (err, agent)
                    {
                        res.statusCode.should.equal(200);

                        const newName = 'RenamedFolder';
                        folderUtils.renameFolderByUri(true, agent, folder.uri, newName, function (err, res)
                        {
                            res.statusCode.should.equal(401);
                            done();
                        });
                    });
                });
            });
        });

        it('Should give an error when the user is logged in as demouser3 and tries to rename a folder in the root of the project (not a collaborator nor creator in a project created by demouser1)', function (done)
        {
            // in this test, first we get the contents of a project with the proper authentication,
            // then we try to rename it with the unauthorized user
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.getProjectRootContent(true, agent, privateProject.handle, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    const contents = JSON.parse(res.text);

                    // find the id of the folder with title we want
                    const folder = _.find(contents, function (folder)
                    {
                        return folder.nie.title === testFolder1.name;
                    });

                    should.not.equal(typeof folder, 'undefined');
                    should.equal(folder.nie.title, testFolder1.name);

                    userUtils.logoutUser(agent, function (err, agent)
                    {
                        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
                        {
                            res.statusCode.should.equal(200);

                            const newName = 'RenamedFolder';
                            folderUtils.renameFolderByUri(true, agent, folder.uri, newName, function (err, res)
                            {
                                res.statusCode.should.equal(401);
                                done();
                            });
                        });
                    });
                });
            });
        });

        it('Should give an error if an invalid name is specified for the file, even if the user is logged in as a creator or collaborator on the project', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                async.mapSeries(allFiles, function (file, callback)
                {
                    const newName = '123987621873512)(/&(/#%#(/)=)()/&%$#';
                    fileUtils.renameFile(agent, privateProject.handle, testFolder1.name, file.name, newName, function (err, res)
                    {
                        res.statusCode.should.equal(400);
                        callback(null, res);
                    });
                }, function (err, result)
                {
                    done(err);
                });
            });
        });

        it('Should be unable to find the file if we try to rename a file that does not exist, even if the user is logged in as a creator or collaborator on the project', function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                async.mapSeries(allFiles, function (file, callback)
                {
                    const newName = 'RenamedFile';
                    const inexistentFileName = 'A_FILE_THAT_DOES_NOT_EXIST';
                    fileUtils.renameFile(agent, privateProject.handle, testFolder1.name, inexistentFileName, newName, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        should.equal(err, 'File with name ' + inexistentFileName + ' not found in ' + testFolder1.name);
                        const contents = JSON.parse(res.text);
                        const file = _.find(contents, function (file)
                        {
                            return file.nie.title === inexistentFileName;
                        });
                        should.equal(typeof file, 'undefined');
                        callback(null, res);
                    });
                }, function (err, result)
                {
                    done(err);
                });
            });
        });

        it('Should give an error if we try to rename a project instead of a file, even if the user is logged in as a creator or collaborator on the project', function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                async.mapSeries(allFiles, function (file, callback)
                {
                    const newName = 'RenamedFile';
                    fileUtils.renameProject(true, agent, privateProject.handle, newName, function (err, res)
                    {
                        res.statusCode.should.equal(404);
                        callback(null, res);
                    });
                }, function (err, result)
                {
                    done(err);
                });
            });
        });

        after(function (done)
        {
        // destroy graphs
            this.timeout(Config.testsTimeout);
            appUtils.clearAppState(function (err, data)
            {
                should.equal(err, null);
                done();
            });
        });
    });

    describe('[POST] [FILE] [PRIVATE PROJECT] [Valid Cases] /project/' + privateProject.handle + '/data/testFolder1/:filename?rename', function ()
    {
        beforeEach(function (done)
        {
            this.timeout(Config.testsTimeout);
            createFilesUnit.setup(function (err, results)
            {
                should.equal(err, null);
                done();
            });
        });

        it('Should rename files with success if the user is logged in as demouser1(the creator of the project)', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                async.mapSeries(allFiles, function (file, callback)
                {
                    const newName = 'RenamedFile';
                    fileUtils.renameFile(agent, privateProject.handle, testFolder1.name, file.name, newName, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        callback(err, res);
                    });
                }, function (err, result)
                {
                    done(err);
                });
            });
        });

        it('Should rename ' + txtMockFile.name + ' with success if the user is logged in as demouser2(a collaborator of the project)', function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                const newName = 'RenamedFile';

                folderUtils.getFolderContents(true, agent, privateProject.handle, testFolder1.name, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    const oldFile = _.find(JSON.parse(res.text), function (file)
                    {
                        return file.nie.title === txtMockFile.name;
                    });

                    should.not.equal(typeof oldFile, 'undefined');
                    should.equal(oldFile.nie.title, txtMockFile.name);

                    fileUtils.renameFileByUri(true, agent, oldFile.uri, newName, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        folderUtils.getFolderContents(true, agent, privateProject.handle, testFolder1.name, function (err, res)
                        {
                            should.equal(err, null);
                            res.statusCode.should.equal(200);

                            const newFile = _.find(JSON.parse(res.text), function (file)
                            {
                                return file.nie.title === newName + '.txt';
                            });

                            should.not.equal(typeof newFile, 'undefined');
                            should.equal(newFile.nie.title, newName + '.txt');
                            should.equal(newFile.uri, oldFile.uri);
                            done();
                        });
                    });
                });
            });
        });

        it('Should rename all files with success if the user is logged in as demouser2(a collaborator of the project)', function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                async.mapSeries(allFiles, function (file, callback)
                {
                    const newName = 'RenamedFile';
                    const newNameWithExtension = newName + '.' + file.extension;

                    folderUtils.getFolderContents(true, agent, privateProject.handle, testFolder1.name, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        const oldFile = _.find(JSON.parse(res.text), function (file)
                        {
                            return file.nie.title === txtMockFile.name;
                        });

                        should.not.equal(typeof oldFile, 'undefined');
                        should.equal(oldFile.nie.title, txtMockFile.name);

                        fileUtils.renameFileByUri(true, agent, oldFile.uri, newName, function (err, res)
                        {
                            res.statusCode.should.equal(200);
                            folderUtils.getFolderContents(true, agent, privateProject.handle, testFolder1.name, function (err, res)
                            {
                                should.equal(err, null);
                                res.statusCode.should.equal(200);

                                const newFile = _.find(JSON.parse(res.text), function (file)
                                {
                                    return file.nie.title === newNameWithExtension;
                                });

                                should.not.equal(typeof newFile, 'undefined');
                                should.equal(newFile.nie.title, newNameWithExtension);
                                should.equal(newFile.uri, oldFile.uri);
                                done();
                            });
                        });
                    });
                }, function (err, result)
                {
                    done(err);
                });
            });
        });

        afterEach(function (done)
        {
            // destroy graphs
            this.timeout(Config.testsTimeout);
            appUtils.clearAppState(function (err, data)
            {
                should.equal(err, null);
                done();
            });
        });
    });
});
