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

const csvResultMD5 = md5(fs.readFileSync(Pathfinder.absPathInTestsFolder("mockdata/files/test_data_serialization/xlsInCSV.csv"), "utf-8"));
const jsonResultMD5 = md5(fs.readFileSync(Pathfinder.absPathInTestsFolder("mockdata/files/test_data_serialization/xlsInJSON.json"), "utf-8"));

const csvResultMD5WithPageAndSkip = md5(fs.readFileSync(Pathfinder.absPathInTestsFolder("mockdata/files/test_data_serialization/xlsInCSV_200_to_250.csv"), "utf-8"));
const jsonResultMD5WithPageAndSkip = md5(fs.readFileSync(Pathfinder.absPathInTestsFolder("mockdata/files/test_data_serialization/xlsInJSON_200_to_250.json"), "utf-8"));
const emptyCSVMD5 = md5(fs.readFileSync(Pathfinder.absPathInTestsFolder("mockdata/files/test_data_serialization/emptyCSVResult.csv"), "utf-8"));

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

    describe("[GET] Complete path using all 16 files", function ()
    {
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
            keywordsUtils.preProcessing(lookup, agent, function (err, res)
            {
                res.statusCode.should.equal(200);
                cb(null, [res.text, JSON.parse(res.text).text]);

                // console.log(artigos[0]);
            });
        };
        var artigos = [];
        var dbpediaterms;
        // var doclist = [doc1, doc2, doc3, doc4, doc5, doc6, doc7, doc8, doc9, doc10, doc11, doc12, doc13, doc14, doc15, doc16];
        var doclist = [doc11, doc12, doc15];

        it("Should load every pdf and extract their content", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                async.mapSeries(doclist, loadfiles, function (err, results)
                {
                    for (let i = 0; i < results.length; i++)
                    {
                        artigos.push({text: results[i]});
                    }
                    done();
                });
            });
        });
        it("Should preprocess and extract terms", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                keywordsUtils.processExtract(artigos, agent, function (err, te)
                {
                    te.statusCode.should.equal(200);
                    // console.log(te.text);
                    dbpediaterms = te.body.output.dbpediaTerms.keywords;
                    // keyword = JSON.parse(te.text).dbpediaTerms.keywords;

                    // console.log(keyword);

                    done();
                });
            });
        });
        it("Cluster terms", function (done)
        {
            this.timeout(1500000);
            keywordsUtils.clustering(dbpediaterms, agent, function (err, db)
            {
                // console.log(err);
                console.log(db.body.clusters);
                done();
            });
        });

        var dbpediaconcepts = [];
        it("Search terms in dbpedia", function (done)
        {
            this.timeout(1500000);
            // console.log(agent);
            keywordsUtils.dbpediaLookup(dbpediaterms, agent, function (err, db)
            {
                // console.log(err);
                db.statusCode.should.equal(200);
                dbpediaconcepts = db.body.dbpediaUri.result;
                console.log(dbpediaconcepts);
                var writer = csvWriter();
                if (!fs.existsSync(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/chemistry/3 ficheiros/chemistry-cvalue-jj.csv")))
                {
                    writer = csvWriter({ separator: ",", headers: [ "searchTerm", "dbpediaLabel", "dbpediaUri", "dbpediaDescription" ]});
                }
                else
                {
                    writer = csvWriter({sendHeaders: false});
                }
                writer.pipe(fs.createWriteStream(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/chemistry/3 ficheiros/chemistry-cvalue-jj.csv"), {flags: "a"}));
                for (var i = 0; i < dbpediaconcepts.length; i++)
                {
                    writer.write(dbpediaconcepts[i]);
                }
                writer.end();
                done();
            });
        });
        it("Get properties from DBpedia", function (done)
        {
            this.timeout(1500000);
            keywordsUtils.dbpediaProperties(dbpediaconcepts, agent, function (err, db)
            {
                // console.log(err);
                db.statusCode.should.equal(200);
                var writer = csvWriter();
                if (!fs.existsSync(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/chemistry/3 ficheiros/dbpediapropertiescvalue-jj.csv")))
                {
                    writer = csvWriter({ headers: ["searchTerm", "lovScore", "lovVocabulary", "lovUri", "lovLabel"]});
                }
                else
                {
                    writer = csvWriter({separator: ",", sendHeaders: false});
                }
                writer.pipe(fs.createWriteStream(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/chemistry/3 ficheiros/dbpediapropertiescvalue-jj.csv"), {flags: "a"}));
                for (var i = 0; i < db.body.dbpediaUri.result.length; i++)
                {
                    writer.write(db.body.dbpediaUri.result[i]);
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
