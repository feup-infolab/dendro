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
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));

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
     * Search effectiveness (does it find the things it should, without considering permissions for now?)
     */
    it("[JSON] should search and find folders by searching for a term present in their abstract", function (done)
    {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        {
            async.mapSeries(foldersData, function (folder, callback)
            {
                const searchTerms = folder.searchTerms;
                searchUtils.search(true, agent, searchTerms, function (err, res)
                {
                    should.not.exist(err);
                    res.status.should.equal(200);

                    const firstHit = JSON.parse(res.text).hits[0];

                    firstHit.dcterms.abstract.should.contain(searchTerms);

                    callback(err, res);
                });
            }, function (err, results)
            {
                done(err);
            });
        });
    });

    // TODO
    it("[JSON] should search and not find anything if there is nothing when searching for gibberish (asjksdhfkjshdfkad)", function (done)
    {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        {
            searchUtils.search(true, agent, "asjksdhfkjshdfkad", function (err, res)
            {
                should.not.exist(err);
                res.status.should.equal(200);

                const hits = JSON.parse(res.text).hits;
                hits.should.be.an("array");
                hits.length.should.equal(0);
                done();
            });
        });
    });

    /**
     * Permissions and project access levels (Does it filter the private and metadataonly projects and folders adequately?)
     */

    // Folders inside different types of projects
    // TODO
    it("[JSON] should find a folder present in " + publicProject.handle + " project by searching for a term present in its description. Query : \"public project type\"", function (done)
    {
        done();
    });

    // TODO
    it("[JSON] should NOT find a folder present in the " + metadataOnlyProject.handle + " project by searching for a term present in its description", function (done)
    {
        done();
    });

    // TODO
    it("[JSON] should NOT find a folder present in the " + privateProject.handle + " project by searching for a term present in its description", function (done)
    {
        done();
    });

    // Different types of projects
    // TODO
    it("[JSON] should find the " + publicProject.handle + " project by searching for a term present in its description", function (done)
    {
        done();
    });

    // TODO
    it("[JSON] should find the " + metadataOnlyProject.handle + " project by searching for a term present in its description", function (done)
    {
        done();
    });

    // TODO
    it("[JSON] should not the " + privateProject.handle + " project by searching for a term present in its description", function (done)
    {
        done();
    });
});
