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
const testFolder3 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/testFolder3.js"));
const pdfMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/pdfMockFile.js"));

const optical = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/optical.js"));
const electrochemical = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/Electrochemicallysynthesized.js"));
const electrical = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/Electricalandopticalproperties.js"));
const photoresponse = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/photoresponse-and-photovoltaic.js"));
const thickness = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/Effective-role-of-thickness.js"));
const fabrication = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/Fabrication-of-Cu2CoSnS4.js"));
const failure = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/Failure-mode-and-effect-analysis.js"));
const situ = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/In-situ-gas.js"));
const opto = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/Opto-electrical-characterisation.js"));
const performance = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/Performance-evaluation.js"));
const singlephase = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/Preparation-of-single-phase.js"));
const kesterite = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/Study-of-kesterite.js"));
const synthesis = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/Synthesis-and-characterization.js"));


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

    describe("[GET] Complete path using all 3 files", function ()
    {
        var loadfiles = function (lookup, cb)
        {
            fileUtils.uploadFile(true, agent, privateProject.handle, testFolder3.name, lookup, function (err, res)
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
        var dbpediaterms;
        var doclist = [optical,electrochemical,electrical,photoresponse,thickness,fabrication,failure,situ,opto,performance,singlephase,kesterite,synthesis];
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
        it("Should preprocess and extract terms", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                keywordsUtils.processextract(artigos, agent, function (err, te)
                {
                    var keyword;
                    te.statusCode.should.equal(200);
                    console.log(te);
                    // console.log(te.text);
                    dbpediaterms = te.body.output.dbpediaterms.keywords;
                    //keyword = JSON.parse(te.text).dbpediaterms.keywords;

                    // console.log(keyword);

                    done();
                });
            });
        });
        /*
        it("Should pre process text", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                async.mapSeries(artigos, processfiles, function (err, results)
                {
                    for (let i = 0; i < results.length; i++)
                    {
                        preprocessing.push(results[i][0]);
                        //console.log(preprocessing);
                        textprocessado.push(results[i][1]);
                        console.log(textprocessado);
                    }
                    done();
                });
            });
        });

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
        */


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
                if (!fs.existsSync(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/photovoltaic/13 files/photovoltaic-cvalue-nn.csv")))
                {
                    writer = csvWriter( { separator: ",", headers: [ "searchterm", "dbpedialabel", "dbpediauri", "dbpediadescription" ]});
                }
                else
                {
                    writer = csvWriter({sendHeaders: false});
                }
                writer.pipe(fs.createWriteStream(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/photovoltaic/13 files/photovoltaic-cvalue-nn.csv"), {flags: "a"}));
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
            keywordsUtils.dbpediaproperties(dbpediaconcepts, agent, function (err, db)
            {
                // console.log(err);
                db.statusCode.should.equal(200);
                var writer = csvWriter();
                if (!fs.existsSync(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/photovoltaic/13 files/dbpediapropertiescvalue-nn.csv")))
                {
                    writer = csvWriter({ headers: ["searchterm", "lovscore","lovvocabulary","lovuri","lovlabel"]});
                }
                else
                {
                    writer = csvWriter({separator: ",", sendHeaders: false});
                }
                writer.pipe(fs.createWriteStream(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/photovoltaic/13 files/dbpediapropertiescvalue-nn.csv"), {flags: "a"}));
                for (var i = 0; i < db.body.dbpediauri.result.length; i++)
                {
                    writer.write(db.body.dbpediauri.result[i]);
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