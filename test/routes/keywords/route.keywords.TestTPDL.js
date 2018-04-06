const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);
const md5 = require("md5");
const fs = require("fs");
var async = require("async");

const csvWriter = require("csv-write-stream");

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const keywordsUtils = require(Pathfinder.absPathInTestsFolder("utils/keywords/keywordsUtils.js"));
const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const fileUtils = require(Pathfinder.absPathInTestsFolder("utils/file/fileUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("utils/item/itemUtils.js"));
const folderUtils = require(Pathfinder.absPathInTestsFolder("utils/folder/folderUtils.js"));
const httpUtils = require(Pathfinder.absPathInTestsFolder("utils/http/httpUtils.js"));
const descriptorUtils = require(Pathfinder.absPathInTestsFolder("utils/descriptor/descriptorUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));

const publicProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));
const metadataOnlyProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
const privateProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/private_project.js"));
const createFoldersUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/folders/createFolders.Unit.js"));
const createFoldersUnitKeywords = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/folders/createFoldersKeywords.Unit.js"));

const testFolder1 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/testFolder1.js"));
const testFolder2 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/testFolder2.js"));
const pdfMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/pdfMockFile.js"));
const doc1 = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc1.js"));
const doc2 = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc2.js"));
const doc3 = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc3.js"));
const doc4 = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc4.js"));
const doc5 = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc5.js"));
const doc6 = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc6.js"));
const doc7 = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc7.js"));
const doc8 = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc8.js"));
const doc9 = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc9.js"));
const doc10 = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc10.js"));
const doc11 = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc11.js"));
const doc12 = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc12.js"));
const doc13 = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc13.js"));
const doc14 = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc14.js"));
const doc15 = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc15.js"));
const doc16 = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/doc15.js"));

const folder = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folder.js"));
const addContributorsToProjectsUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/projects/addContributorsToProjects.Unit.js"));
const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));

// Dendro Keywords
describe("Searches DBpedia for important terms", function (done)
{
    this.timeout(Config.testsTimeout);
    before(function (done)
    {
        createFoldersUnitKeywords.setup(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    var artigo;

    describe("[POST] [PRIVATE PROJECT] [Valid Cases] /project/" + privateProject.handle + "/data/:foldername?upload", function ()
    {
        it("Should upload a PDF file successfully and extract its text for content-based indexing", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                fileUtils.uploadFile(true, agent, privateProject.handle, testFolder2.name, doc1, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.should.be.instanceof(Object);
                    res.body.should.be.instanceof(Array);
                    res.body.length.should.equal(1);
                    const newResourceUri = res.body[0].uri;

                    itemUtils.getItemMetadataByUri(true, agent, newResourceUri, function (error, res)
                    {
                        res.statusCode.should.equal(200);
                        res.body.descriptors.should.be.instanceof(Array);
                        artigo = JSON.parse(res.text).descriptors[7].value;
                        descriptorUtils.noPrivateDescriptors(JSON.parse(res.text).descriptors).should.equal(true);
                        descriptorUtils.containsAllMetadata(doc1.metadata,JSON.parse(res.text).descriptors
                        );

                        done();
                    });
                });
            });
        });
    });

    describe("[GET] Complete path using all 16 files", function ()
    {
        var artigos = [];
        var textprocessado = [];
        var preprocessing = [];
        var doclist = [doc1, doc2, doc3, doc4, doc5, doc6, doc7, doc8, doc9, doc10, doc11, doc12, doc13, doc14, doc15, doc16];
        var loadfiles = function (lookup, cb)
        {
            fileUtils.uploadFile(true, agent, privateProject.handle, testFolder2.name, lookup, function (err, res)
            {
                res.statusCode.should.equal(200);
                res.body.should.be.instanceof(Object);
                res.body.should.be.instanceof(Array);
                res.body.length.should.equal(1);
                const newResourceUri = res.body[0].uri;
                itemUtils.getItemMetadataByUri(true, agent, newResourceUri, function (error, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.descriptors.should.be.instanceof(Array);
                    // artigos.push(JSON.parse(res.text).descriptors[7].value);
                    cb(null, JSON.parse(res.text).descriptors[7].value);
                });
            });

        };
        var processfiles = function (lookup, cb)
        {
            keywordsUtils.preprocessing(lookup, agent, function (err, res) {
                res.statusCode.should.equal(200);
                cb(null, [res.text, JSON.parse(res.text).text]);

                // console.log(artigos[0]);
            });
        };
        it("Should load every pdf and extract their content", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                async.mapSeries(doclist, loadfiles, function (err, results)
                {
                    for (let i = 0; i < results.length; i++)
                    {
                        artigos.push(results[i]);
                    }
                    done();
                });
            });
        });
        it("Should pre process text", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                async.mapSeries(artigos, processfiles, function (err, results)
                {
                    for (let i = 0; i < results.length; i++)
                    {
                        preprocessing.push(results[i][0]);
                        textprocessado.push(results[i][1]);
                    }
                    done();
                });
            });
        });
        var dbpediaterms;
        it("Should extract keywords", function (done)
        {
            this.timeout(1500000);
            keywordsUtils.termextraction(preprocessing, textprocessado, agent, function (err, te)
            {
                var keyword;
                te.statusCode.should.equal(200);
                // console.log(te.text);
                dbpediaterms = te.text;
                keyword = JSON.parse(te.text).dbpediaterms.keywords;

                console.log(keyword);

                done();
            });
        });
        var dbpediaconcepts = [];
        it("Search terms in dbpedia", function (done)
        {
            this.timeout(1500000);
            // console.log(agent);
            keywordsUtils.dbpedialookup(dbpediaterms, agent, function (err, db)
            {
                // console.log(err);
                db.statusCode.should.equal(200);
                dbpediaconcepts = db.body.dbpediauri.result;
                console.log(dbpediaconcepts);
                var writer = csvWriter();
                if (!fs.existsSync(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/chemistry-CVALUE-JJ2.csv")))
                {
                    writer = csvWriter({ separator: ",", headers: ["searchterm", "score", "uri", "label", "description" ]});
                }
                else
                {
                    writer = csvWriter({sendHeaders: false});
                }
                writer.pipe(fs.createWriteStream(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/chemistry-CVALUE-JJ2.csv"), {flags: "a"}));
                for( var i = 0; i < dbpediaconcepts.length; i++) {
                    writer.write(dbpediaconcepts[i]);
                }
                writer.end();
                done();
            });
        });
        it("Get properties from DBpedia", function (done)
        {
            this.timeout(1500000);
            keywordsUtils.dbpediaproperties(dbpediaconcepts, agent, function (err, db)
            {
                // console.log(err);
                db.statusCode.should.equal(200);
                var writer = csvWriter();
                if (!fs.existsSync(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/dbpediaproperties.csv")))
                {
                    writer = csvWriter({ headers: ["property", "frequency"]});
                }
                else
                {
                    writer = csvWriter({separator: ",", sendHeaders: false});
                }
                writer.pipe(fs.createWriteStream(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/dbpediaproperties.csv"), {flags: "a"}));
                for (var i = 0; i < db.body.dbpediaproperties.result.length; i++)
                {
                    writer.write(db.body.dbpediaproperties.result[i]);
                }
                writer.end();
                done();
            });
        });
    });

    after(function (done)
    {
    // destroy graphs

        appUtils.clearAppState(function (err, data)
        {
            should.equal(err, null);
            done(err);
        });
    });
});
