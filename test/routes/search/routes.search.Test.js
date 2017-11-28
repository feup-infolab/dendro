const path = require("path");
const async = require("async");
const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));

const metadataOnlyProject = require("../../mockdata/projects/metadata_only_project.js");
const publicProject = require("../../mockdata/projects/public_project.js");
const privateProject = require("../../mockdata/projects/private_project.js");

const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const searchUtils = require(Pathfinder.absPathInTestsFolder("utils/search/searchUtils.js"));

const addMetadataToFoldersUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/metadata/addMetadataToFolders.Unit.js"));
const createFoldersUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/folders/createFolders.Unit.js"));
const foldersData = createFoldersUnit.foldersData;

describe("/search", function ()
{
    this.timeout(Config.testsTimeout);
    before(function (done)
    {
        addMetadataToFoldersUnit.setup(function (err, results)
        {
            should.not.exist(err);
            done();
        });
    });

    /**
     * Search effectiveness (does it find the things it should, without considering permisions for now?)
     */
    // TODO
    it("[HTML] should search and find a folder by searching for a term present in its search term", function (done)
    {
        async.map(foldersData, function (folder)
        {
            searchUtils.search(folder.searchTerms, function (err, res)
            {
                should.not.exist(err);
                res.status.should.equal(200);
                callback(err, res);
            });
        }, function (err, results)
        {
            done();
        });
    });

    // TODO
    it("[HTML] should search and not find anything if there is nothing when searching for gibberish (asjksdhfkjshdfkad)", function (done)
    {
        done();
    });

    // TODO
    it("[JSON] should search and find a folder by searching for a term present in its abstract", function (done)
    {
        done();
    });

    // TODO
    it("[JSON] should search and not find anything if there is nothing when searching for gibberish (asjksdhfkjshdfkad)", function (done)
    {
        done();
    });

    /**
     * Permissions and project access levels (Does it filter the private and metadataonly projects and folders adequately?)
     */

    // Folders inside different types of projects
    // TODO
    it("[HTML] should find a folder present in " + publicProject.handle + " project by searching for a term present in its description. Query : \"public project type\"", function (done)
    {
        done();
    });

    // TODO
    it("[HTML] should NOT find a folder present in the " + metadataOnlyProject.handle + " project by searching for a term present in its description", function (done)
    {
        done();
    });

    // TODO
    it("[HTML] should NOT find a folder present in the " + privateProject.handle + " project by searching for a term present in its description", function (done)
    {
        done();
    });

    // Different types of projects
    // TODO
    it("[HTML] should find the " + publicProject.handle + " project by searching for a term present in its description", function (done)
    {
        done();
    });

    // TODO
    it("[HTML] should find the " + metadataOnlyProject.handle + " project by searching for a term present in its description", function (done)
    {
        done();
    });

    // TODO
    it("[HTML] should not the " + privateProject.handle + " project by searching for a term present in its description", function (done)
    {
        done();
    });
});
