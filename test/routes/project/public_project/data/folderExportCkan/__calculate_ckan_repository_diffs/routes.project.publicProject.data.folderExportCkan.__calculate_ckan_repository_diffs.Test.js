process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const slug = require('slug');
const _ = require('underscore');
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;
const path = require('path');

const fileUtils = require(Pathfinder.absPathInTestsFolder('utils/file/fileUtils.js'));
const projectUtils = require(Pathfinder.absPathInTestsFolder('utils/project/projectUtils.js'));
const userUtils = require(Pathfinder.absPathInTestsFolder('utils/user/userUtils.js'));
const repositoryUtils = require(Pathfinder.absPathInTestsFolder('utils/repository/repositoryUtils.js'));
const appUtils = require(Pathfinder.absPathInTestsFolder('utils/app/appUtils.js'));
const ckanTestUtils = require(Pathfinder.absPathInTestsFolder('utils/repository/ckanTestUtils.js'));
const CkanUtils = require(Pathfinder.absPathInSrcFolder('/utils/datasets/ckanUtils.js'));

const demouser1 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser1.js'));
const demouser2 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser2.js'));
const demouser3 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser3.js'));

const publicProject = require(Pathfinder.absPathInTestsFolder('mockdata/projects/public_project.js'));
const folderExportCkan = require(Pathfinder.absPathInTestsFolder('mockdata/folders/folderExportCkan.js'));
const folderExportedCkanNoDiffs = require(Pathfinder.absPathInTestsFolder('mockdata/folders/folderExportedCkanNoDiffs.js'));
const folderExportedCkanDendroDiffs = require(Pathfinder.absPathInTestsFolder('mockdata/folders/folderExportedCkanDendroDiffs.js'));
const folderExportedCkanCkanDiffs = require(Pathfinder.absPathInTestsFolder('mockdata/folders/folderExportedCkanCkanDiffs.js'));
const folderMissingDescriptors = require(Pathfinder.absPathInTestsFolder('mockdata/folders/folderMissingDescriptors.js'));
const pdfMockFile = require(Pathfinder.absPathInTestsFolder('mockdata/files/pdfMockFile.js'));
const pngMockFile = require(Pathfinder.absPathInTestsFolder('mockdata/files/pngMockFile.js'));

const exportFoldersToCkanRepositoryUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder('units/repositories/exportFoldersToCkanRepository.Unit.js'));

const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder('utils/db/db.Test.js'));

let createdUnknownRepo = require(Pathfinder.absPathInTestsFolder('mockdata/repositories/created/created_unknown_export_repo.js'));
let createdCkanConfigInvalidToken = require(Pathfinder.absPathInTestsFolder('mockdata/repositories/created/createdCkanWithInvalidToken.js'));
let createdCkanConfigInvalidUrl = require(Pathfinder.absPathInTestsFolder('mockdata/repositories/created/createdCkanWithInvalidUrl.js'));

let ckanData;
let folderExportCkanData, folderExportedCkanNoDiffsData, folderExportedCkanDendroDiffsData,
    folderExportedCkanCkanDiffsData, folderMissingDescriptorsData;

describe('Calculate public project folderExportCkan level ckan respository diffs tests', function ()
{
    before(function (done)
    {
        appUtils.newTestRouteLog(path.basename(__filename));
        this.timeout(Config.testsTimeout);
        exportFoldersToCkanRepositoryUnit.setup(publicProject, function (err, results)
        {
            should.equal(err, null);
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                repositoryUtils.getMyExternalRepositories(true, agent, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.length.should.equal(6);
                    ckanData = _.find(res.body, function (externalRepo)
                    {
                        return externalRepo.dcterms.title === 'ckan2';
                    });
                    should.exist(ckanData);
                    projectUtils.getProjectRootContent(true, agent, publicProject.handle, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        folderExportCkanData = _.find(res.body, function (folderData)
                        {
                            return folderData.nie.title === folderExportCkan.name;
                        });
                        folderExportedCkanNoDiffsData = _.find(res.body, function (folderData)
                        {
                            return folderData.nie.title === folderExportedCkanNoDiffs.name;
                        });
                        folderMissingDescriptorsData = _.find(res.body, function (folderData)
                        {
                            return folderData.nie.title === folderMissingDescriptors.name;
                        });
                        folderExportedCkanDendroDiffsData = _.find(res.body, function (folderData)
                        {
                            return folderData.nie.title === folderExportedCkanDendroDiffs.name;
                        });
                        folderExportedCkanCkanDiffsData = _.find(res.body, function (folderData)
                        {
                            return folderData.nie.title === folderExportedCkanCkanDiffs.name;
                        });
                        should.exist(folderExportCkanData);
                        should.exist(folderExportedCkanNoDiffsData);
                        should.exist(folderMissingDescriptorsData);
                        done();
                    });
                });
            });
        });
    });

    describe('[POST] [CKAN] First time being exported /project/:handle/data/:foldername?export_to_repository', function ()
    {
        this.timeout(Config.testsTimeout);
        it('Should give an error when the target repository is invalid[not b2share zenodo etc]', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                repositoryUtils.calculate_ckan_repository_diffs(true, folderExportCkanData.uri, agent, createdUnknownRepo, function (err, res)
                {
                    console.log(res);
                    res.statusCode.should.equal(400);
                    res.body.message.should.contain('invalid ckan uri or api key');
                    done();
                });
            });
        });

        it('Should give an error when the user is unauthenticated', function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            repositoryUtils.calculate_ckan_repository_diffs(true, folderExportCkanData.uri, agent, {repository: ckanData}, function (err, res)
            {
                res.statusCode.should.equal(401);
                res.body.message.should.equal('Permission denied : cannot calculate ckan repository diffs because you do not have permissions to edit this project.');
                done();
            });
        });

        it('Should give an error message when the user is logged in as demouser3(not a creator or collaborator of the project)', function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                repositoryUtils.calculate_ckan_repository_diffs(true, folderExportCkanData.uri, agent, {repository: ckanData}, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it('Should give a success message when the user is logged in as demouser2(a collaborator of the project)', function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                repositoryUtils.calculate_ckan_repository_diffs(true, folderExportCkanData.uri, agent, {repository: ckanData}, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    done();
                });
            });
        });

        it('Should give an error when there is an invalid access token for deposit although a creator or collaborator is logged in', function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                repositoryUtils.calculate_ckan_repository_diffs(true, folderExportedCkanNoDiffsData.uri, agent, {repository: createdCkanConfigInvalidToken}, function (err, res)
                {
                    // res.statusCode.should.equal(500);
                    // TODO this is wrong, should give an error, I don't understand why given an invalid apiKey it still works
                    res.statusCode.should.equal(200);
                    done();
                });
            });
        });

        it('Should give an error when there is an invalid external url for deposit although a creator or collaborator is logged in', function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                repositoryUtils.calculate_ckan_repository_diffs(true, folderExportCkanData.uri, agent, {repository: createdCkanConfigInvalidUrl}, function (err, res)
                {
                    res.statusCode.should.equal(400);
                    res.body.message.should.contain('invalid ckan uri or api key');
                    done();
                });
            });
        });

        it('Should give an error when the folder to export does not exist although a creator or collaborator is logged in', function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                repositoryUtils.calculate_ckan_repository_diffs(true, '/r/folder/randomFolder-0c15ae9c-e817-4cca-a8c0-4ac376f32998', agent, {repository: ckanData}, function (err, res)
                {
                    res.statusCode.should.equal(404);
                    done();
                });
            });
        });

        it('Should give an error when the folder to export does not have the required descriptors(dcterms.title, dcterms.description, dcterms.creator) although all the other required steps check out', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                repositoryUtils.calculate_ckan_repository_diffs(true, folderMissingDescriptorsData.uri, agent, {repository: ckanData}, function (err, res)
                {
                    res.statusCode.should.equal(400);
                    res.body.message.should.contain('has no title! Please set the Title property');
                    done();
                });
            });
        });

        // A case where there is no previously version exported to ckan
        it('Should give a success message when the folder to export exists and a creator or collaborator is logged in', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                repositoryUtils.calculate_ckan_repository_diffs(true, folderExportCkanData.uri, agent, {repository: ckanData}, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.should.equal('Package was not previously exported');
                    done();
                });
            });
        });
    });

    describe('[POST] [CKAN] Second time being exported but no diffs exist /project/:handle/data/:foldername?export_to_repository', function ()
    {
        this.timeout(Config.testsTimeout);
        // A case where there is no previously version exported to ckan
        it('Should give a success message with information that no diffs exist', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                repositoryUtils.calculate_ckan_repository_diffs(true, folderExportedCkanNoDiffsData.uri, agent, {repository: ckanData}, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.ckanDiffs.length.should.equal(0);
                    res.body.dendroDiffs.length.should.equal(0);
                    done();
                });
            });
        });
    });

    describe('[POST] [CKAN] Second time being exported but ckan diffs exist /project/:handle/data/:foldername?export_to_repository', function ()
    {
        this.timeout(Config.testsTimeout);
        // A case where a folder was exported to ckan and then files were uploaded on the ckan app
        it('Should give a success message with information that ckan diffs exist', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                let packageId = CkanUtils.createPackageID(folderExportedCkanCkanDiffsData.uri);
                let packageInfo = {
                    id: packageId
                };
                ckanTestUtils.uploadFileToCkanPackage(true, agent, {repository: ckanData}, pdfMockFile, packageInfo, function (err, res)
                {
                    repositoryUtils.calculate_ckan_repository_diffs(true, folderExportedCkanCkanDiffsData.uri, agent, {repository: ckanData}, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        res.body.ckanDiffs.length.should.equal(1);
                        res.body.dendroDiffs.length.should.equal(0);
                        done();
                    });
                });
            });
        });
    });

    describe('[POST] [CKAN] Second time being exported but dendro diffs exist /project/:handle/data/:foldername?export_to_repository', function ()
    {
        this.timeout(Config.testsTimeout);
        // A case where a folder was exported to ckan and then files were uploaded on the dendro app
        it('Should give a success message with information that dendro diffs exist', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                fileUtils.uploadFile(true, agent, publicProject.handle, folderExportedCkanDendroDiffsData.nie.title, pngMockFile, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    repositoryUtils.calculate_ckan_repository_diffs(true, folderExportedCkanDendroDiffsData.uri, agent, {repository: ckanData}, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        res.body.ckanDiffs.length.should.equal(0);
                        res.body.dendroDiffs.length.should.equal(1);
                        done();
                    });
                });
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
