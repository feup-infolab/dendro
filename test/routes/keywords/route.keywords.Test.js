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
const pdfMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/pdfMockFile.js"));
const BusPerformance = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/BusPerformance.js"));
const SimulatingVehicle = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/SimulatingVehicle.js"));
const driverattitude = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/driverattitude.js"));
const RegenerativeBraking = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/RegenerativeBraking.js"));
const RoutePlanning = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/RoutePlanning.js"));

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

    var artigo;

    describe("[POST] [PRIVATE PROJECT] [Valid Cases] /project/" + privateProject.handle + "/data/:foldername?upload", function ()
    {
        it("Should upload a PDF file successfully and extract its text for content-based indexing", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                fileUtils.uploadFile(true, agent, privateProject.handle, testFolder1.name, BusPerformance, function (err, res)
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

                        descriptorUtils.containsAllMetadata(
                            BusPerformance.metadata,
                            JSON.parse(res.text).descriptors
                        );

                        done();
                    });
                });
            });
        });
    });

    // describe("[GET] /keywords/conceptextraction", function ()
    // {
    //     it("[HTML] Simple test to extract POS and lemma", function (done)
    //     {
    //         userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
    //         {
    //             keywordsUtils.preprocessing("a really Interesting string with some words", agent, function (err, res)
    //             {
    //                 res.statusCode.should.equal(200);
    //                 // console.log(res.text);
    //                 res.text.should.contain("interesting");
    //                 res.text.should.contain("string");
    //                 res.text.should.contain("word");
    //                 done();
    //             });
    //         });
    //     });
    //     it("[GET] single term extraction", function (done)
    //     {
    //         userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
    //         {
    //             // console.log(artigo.toString());
    //             keywordsUtils.preprocessing(artigo, agent, function (err, res)
    //             {
    //                 res.statusCode.should.equal(200);
    //                 res.text.should.contain("introduction");
    //                 // console.log(res.text);
    //                 // res.text.should.contain("science");
    //                 keywordsUtils.termextraction([res.text], [artigo.toString()], agent, function (err, te)
    //                 {
    //                     te.statusCode.should.equal(200);
    //                     // te.text.should.contain("google");
    //                     // te.text.should.contain("kaggle");
    //                     // te.text.should.contain("3.068528194400547");
    //                     // te.text.should.contain("3.068528194400547");
    //
    //                     done();
    //                 });
    //             });
    //         });
    //     });
    //     it("[Get] DBpedia lookup higher frequency items", function (done)
    //     {
    //         userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
    //         {
    //             // console.log(artigo.toString());
    //             keywordsUtils.preprocessing(artigo, agent, function (err, res)
    //             {
    //                 res.statusCode.should.equal(200);
    //                 res.text.should.contain("introduction");
    //                 // console.log(res.text);
    //                 // res.text.should.contain("science");
    //                 keywordsUtils.termextraction([res.text], [artigo.toString()], agent, function (err, te)
    //                 {
    //                     te.statusCode.should.equal(200);
    //                     console.log(te.text);
    //                     // te.text.should.contain("google");
    //                     // te.text.should.contain("kaggle");
    //                     // te.text.should.contain("3.068528194400547");
    //                     // te.text.should.contain("3.068528194400547");
    //
    //                     keywordsUtils.dbpedialookup(te.text, agent, function (err, db)
    //                     {
    //                         db.statusCode.should.equal(200);
    //                         console.log(db.body.dbpediauri.result);
    //                         // db.text.should.contain("Google");
    //                         // db.text.should.contain("Kaggle");
    //                         done();
    //                     });
    //                 });
    //             });
    //         });
    //     });
    // });

    describe("[GET] Complete path using all 5 files", function ()
    {
        var loadfiles = function (lookup, cb)
        {
            fileUtils.uploadFile(true, agent, privateProject.handle, testFolder1.name, lookup, function (err, res)
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
            keywordsUtils.preprocessing(lookup, agent, function (err, res)
            {
                res.statusCode.should.equal(200);
                cb(null, [res.text, JSON.parse(res.text).text]);

                // console.log(artigos[0]);
            });
        };
        var artigos = [];
        var textprocessado = [];
        var preprocessing = [];
        var doclist = [BusPerformance, SimulatingVehicle, driverattitude, RegenerativeBraking, RoutePlanning];
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
            keywordsUtils.termextraction(preprocessing, textprocessado, agent, function (err, te)
            {
                var keyword;
                te.statusCode.should.equal(200);
                // console.log(te.text);
                dbpediaterms = te.text;
                keyword = JSON.parse(te.text).dbpediaterms.keywords;

                // console.log(keyword);

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
                if (!fs.existsSync(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/vehicle/vehicle-lov-jj3.csv")))
                {
                    writer = csvWriter({ separator: ",", headers: [ "searchterm", "score", "lovscore", "lovvocabulary", "lovuri", "lovlabel", "dbpedialabel", "dbpediauri", "dbpediadescription" ]});
                }
                else
                {
                    writer = csvWriter({sendHeaders: false});
                }
                writer.pipe(fs.createWriteStream(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/vehicle/vehicle-lov-jj3.csv"), {flags: "a"}));
                for (var i = 0; i < dbpediaconcepts.length; i++)
                {
                    writer.write(dbpediaconcepts[i]);
                }
                writer.end();
                done();
            });
        });
        /* it("Get properties from DBpedia", function (done)
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
        });*/
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
