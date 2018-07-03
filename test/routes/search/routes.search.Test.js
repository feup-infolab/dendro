const path = require("path");
const async = require("async");
const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);

const rlequire = require("rlequire");
const Project = rlequire("dendro", "src/models/project.js").Project;
const Folder = rlequire("dendro", "src/models/directory_structure/folder.js").Folder
const Resource = rlequire("dendro", "src/models/resource.js").Resource;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1.js");
const demouser2 = rlequire("dendro", "test/mockdata/users/demouser2.js");
const demouser3 = rlequire("dendro", "test/mockdata/users/demouser3.js");

const metadataOnlyProject = require("../../mockdata/projects/metadata_only_project.js");
const publicProject = require("../../mockdata/projects/public_project.js");
const privateProject = require("../../mockdata/projects/private_project.js");

const appUtils = rlequire("dendro", "test/utils/app/appUtils.js");
const searchUtils = rlequire("dendro", "test/utils/search/searchUtils.js");
const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const itemUtils = rlequire("dendro", "test/utils/item/itemUtils.js");
const projectUtils = rlequire("dendro", "test/utils/project/projectUtils.js");

let AddMetadataToFoldersUnit = rlequire("dendro", "test/units/metadata/addMetadataToFolders.Unit.js");

const folder = rlequire("dendro", "test/mockdata/folders/folder.js");
const testFolder1 = rlequire("dendro", "test/mockdata/folders/testFolder1.js");
const testFolder2 = rlequire("dendro", "test/mockdata/folders/testFolder2.js");
const folderDemoUser2 = rlequire("dendro", "test/mockdata/folders/folderDemoUser2.js");

const foldersData = [folder];

describe("/search", function ()
{
    this.timeout(Config.testsTimeout);
    before(function (done)
    {
        AddMetadataToFoldersUnit.setup(function (err, results)
        {
            should.not.exist(err);
            done(err);
        });
    });
    describe("Generic search inside public projects", function ()
    {
        /**
         * Search effectiveness (does it find the things it should, without considering permissions for now?)
         */
        it("Should search and find folders by searching for a term present in their abstract", function (done)
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

                        should.exist(firstHit);

                        const mockObjectMetadata = folder.metadata;
                        const abstract = _.find(mockObjectMetadata, function (descriptor)
                        {
                            return (descriptor.prefix === "dcterms" && descriptor.shortName === "abstract");
                        });

                        firstHit.dcterms.abstract.should.equal(abstract.value);

                        callback(err, res);
                    });
                }, function (err, results)
                {
                    done(err);
                });
            });
        });

        it("Should search and not find anything if there is nothing when searching for gibberish (asjksdhfkjshdfkad)", function (done)
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
    });

    /**
     * Permissions and project access levels (Does it filter the private and metadataonly projects and folders adequately?)
     */

    describe("Search for projects of different visibility (public / private / metadata only)", function ()
    {
        // Different types of projects
        it("should find the " + publicProject.handle + " project by searching for a term present in its title.", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                const searchTerms = publicProject.searchTerms;
                searchUtils.search(true, agent, searchTerms, function (err, res)
                {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    const hits = JSON.parse(res.text).hits;

                    const publicProjectSearchHit = _.find(hits, function (hit)
                    {
                        return hit.ddr.handle === publicProject.handle;
                    });

                    should.exist(publicProjectSearchHit);

                    publicProjectSearchHit.dcterms.description.should.equal(publicProject.description);
                    publicProjectSearchHit.dcterms.title.should.equal(publicProject.title);

                    done();
                });
            });
        });

        it("should find the " + metadataOnlyProject.handle + " project by searching for a term present in its title because it is findable (metadata is visible).", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                const searchTerms = metadataOnlyProject.searchTerms;
                searchUtils.search(true, agent, searchTerms, function (err, res)
                {
                    should.not.exist(err);
                    res.status.should.equal(200);

                    const hits = JSON.parse(res.text).hits;
                    const metadataOnlyProjectSearchHit = _.find(hits, function (hit)
                    {
                        return hit.ddr.handle === metadataOnlyProject.handle;
                    });

                    should.exist(metadataOnlyProjectSearchHit);

                    metadataOnlyProjectSearchHit.dcterms.description.should.equal(metadataOnlyProject.description);
                    metadataOnlyProjectSearchHit.dcterms.title.should.equal(metadataOnlyProject.title);

                    done();
                });
            });
        });

        it("should NOT find the " + privateProject.handle + " project by searching for a term present in its title because it is private.", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                const searchTerms = privateProject.searchTerms;
                searchUtils.search(true, agent, searchTerms, function (err, res)
                {
                    should.not.exist(err);
                    res.status.should.equal(200);

                    const hits = JSON.parse(res.text).hits;
                    const privateProjectSearchHit = _.find(hits, function (hit)
                    {
                        return hit.ddr.handle === privateProject.handle;
                    });

                    should.not.exist(privateProjectSearchHit);

                    done();
                });
            });
        });
    });

    describe("Search for FOLDERS INSIDE projects of different visibility (public / private / metadata only)", function ()
    {
        // Folders inside different types of projects
        it("should find the " + testFolder1.name + " folder by searching for a term present in its title, because it is created inside a public project", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.createFolder(true, agent, publicProject.handle, testFolder1.pathInProject, testFolder1.name, function (err, res)
                {
                    itemUtils.updateItemMetadata(true, agent, publicProject.handle, testFolder1.name, testFolder1.metadata, function (err, res)
                    {
                        if (!isNull(err))
                        {
                            should.not.exist(err);
                            res.statusCode.should.equal(200);
                            const searchTerms = testFolder1.searchTerms;
                            searchUtils.search(true, agent, searchTerms, function (err, res)
                            {
                                should.not.exist(err);
                                res.status.should.equal(200);
                                const hits = JSON.parse(res.text).hits;

                                const testFolder1SearchHit = _.find(hits, function (hit)
                                {
                                    return hit.nie.title === testFolder1.name;
                                });

                                should.exist(testFolder1SearchHit);

                                const mockObjectMetadata = testFolder1.metadata;
                                const abstract = _.find(mockObjectMetadata, function (descriptor)
                                {
                                    return (descriptor.prefix === "dcterms" && descriptor.shortName === "abstract");
                                });

                                const title = _.find(mockObjectMetadata, function (descriptor)
                                {
                                    return (descriptor.prefix === "dcterms" && descriptor.shortName === "title");
                                });

                                testFolder1SearchHit.dcterms.abstract.should.equal(abstract.value);
                                testFolder1SearchHit.dcterms.title.should.equal(title.value);

                                done();
                            });
                        }
                        else
                        {
                            done(err);
                        }
                    });
                });
            });
        });

        it("should find a folder present in the " + metadataOnlyProject.handle + " project by searching for a term present in its title because it is metadata only project and thus shows up in search results", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.createFolder(true, agent, metadataOnlyProject.handle, testFolder2.pathInProject, testFolder2.name, function (err, res)
                {
                    itemUtils.updateItemMetadata(true, agent, metadataOnlyProject.handle, testFolder2.name, testFolder2.metadata, function (err, res)
                    {
                        if (!isNull(err))
                        {
                            should.not.exist(err);
                            res.statusCode.should.equal(200);
                            const searchTerms = testFolder2.searchTerms;
                            searchUtils.search(true, agent, searchTerms, function (err, res)
                            {
                                should.not.exist(err);
                                res.status.should.equal(200);

                                const firstHit = JSON.parse(res.text).hits[0];

                                const mockObjectMetadata = testFolder2.metadata;
                                const abstract = _.find(mockObjectMetadata, function (descriptor)
                                {
                                    return (descriptor.prefix === "dcterms" && descriptor.shortName === "abstract");
                                });

                                const title = _.find(mockObjectMetadata, function (descriptor)
                                {
                                    return (descriptor.prefix === "dcterms" && descriptor.shortName === "title");
                                });

                                firstHit.dcterms.title.should.equal(title.value);
                                firstHit.dcterms.abstract.should.equal(abstract.value);

                                done();
                            });
                        }
                        else
                        {
                            done(err);
                        }
                    });
                });
            });
        });

        it("should NOT find a folder present in the " + privateProject.handle + " project by searching for a term present in its description because its parent project is private", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.createFolder(true, agent, privateProject.handle, folderDemoUser2.pathInProject, folderDemoUser2.name, function (err, res)
                {
                    itemUtils.updateItemMetadata(true, agent, privateProject.handle, folderDemoUser2.name, folderDemoUser2.metadata, function (err, res)
                    {
                        if (!isNull(err))
                        {
                            should.not.exist(err);
                            res.statusCode.should.equal(200);
                            const searchTerms = folderDemoUser2.searchTerms;
                            searchUtils.search(true, agent, searchTerms, function (err, res)
                            {
                                should.not.exist(err);
                                res.status.should.equal(200);

                                const firstHit = JSON.parse(res.text).hits[0];
                                should.not.exist(firstHit);

                                done();
                            });
                        }
                        else
                        {
                            done(err);
                        }
                    });
                });
            });
        });
    });

    describe("Search for projects of different visibility (public / private / metadata only), after editing the privacy", function ()
    {
        const searchTerms = publicProject.searchTerms;

        it("should NOT find " + publicProject.handle + " by searching for a term present because it becomes private **AFTER EDITING the visibility to private***", function (done)
        {
            const privateStatus = "private";
            const publicStatus = "public";
            const metadataOnly = "metadata_only";

            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                // change public to private
                projectUtils.administer(agent, true, {privacy: privateStatus}, publicProject.handle, function (err, res)
                {
                    res.should.have.status(200);
                    searchUtils.search(true, agent, searchTerms, function (err, res)
                    {
                        should.not.exist(err);
                        res.status.should.equal(200);

                        const hits = JSON.parse(res.text).hits;

                        const publicProjectSearchHit = _.find(hits, function (hit)
                        {
                            return hit.ddr.handle === publicProject.handle;
                        });

                        should.not.exist(publicProjectSearchHit);

                        // change private to metadata_only
                        projectUtils.administer(agent, true, {privacy: metadataOnly}, publicProject.handle, function (err, res)
                        {
                            res.should.have.status(200);
                            searchUtils.search(true, agent, searchTerms, function (err, res)
                            {
                                const hits = JSON.parse(res.text).hits;

                                const publicProjectSearchHit = _.find(hits, function (hit)
                                {
                                    return hit.ddr.handle === publicProject.handle;
                                });

                                should.exist(publicProjectSearchHit);

                                publicProjectSearchHit.dcterms.description.should.equal(publicProject.description);
                                publicProjectSearchHit.dcterms.title.should.equal(publicProject.title);

                                // change metadata_only to public
                                projectUtils.administer(agent, true, {privacy: publicStatus}, publicProject.handle, function (err, res)
                                {
                                    res.should.have.status(200);
                                    searchUtils.search(true, agent, searchTerms, function (err, res)
                                    {
                                        const hits = JSON.parse(res.text).hits;

                                        const publicProjectSearchHit = _.find(hits, function (hit)
                                        {
                                            return hit.ddr.handle === publicProject.handle;
                                        });

                                        should.exist(publicProjectSearchHit);

                                        publicProjectSearchHit.dcterms.description.should.equal(publicProject.description);
                                        publicProjectSearchHit.dcterms.title.should.equal(publicProject.title);
                                        done();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});
