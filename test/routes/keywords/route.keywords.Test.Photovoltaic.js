const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);
const fs = require("fs");
var async = require("async");
const csvWriter = require("csv-write-stream");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const keywordsUtils = require(Pathfinder.absPathInTestsFolder("utils/keywords/keywordsUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const fileUtils = require(Pathfinder.absPathInTestsFolder("utils/file/fileUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("utils/item/itemUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));

const privateProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/private_project.js"));
const createFoldersUnitKeywords = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/folders/createFoldersKeywords.Unit.js"));

const testFolder3 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/testFolder3.js"));

const optical = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/optical.js"));
const electrochemical = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/Electrochemicallysynthesized.js"));
const electrical = require(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/Electricalandopticalproperties.js"));

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
                    cb(null, JSON.parse(res.text).descriptors[7].value);
                });
            });
        };
        var processFiles = function (lookup, cb)
        {
            keywordsUtils.preProcessing(lookup, agent, function (err, res)
            {
                res.statusCode.should.equal(200);
                cb(null, [res.text, JSON.parse(res.text).text]);
            });
        };
        let articles = [];
        let dbpediaTerms;
        let docList = [optical, electrochemical, electrical];
        it("Should load every pdf and extract their content", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                async.mapSeries(docList, loadfiles, function (err, results)
                {
                    for (let i = 0; i < results.length; i++)
                    {
                        articles.push({text: results[i]});
                    }
                    done();
                });
            });
        });
        it("Should preprocess and extract terms", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                keywordsUtils.processExtract({method: "CValueJJ", text: articles}, agent, function (err, te)
                {
                    te.statusCode.should.equal(200);
                    dbpediaTerms = te.body.output.dbpediaTerms.keywords;

                    done();
                });
            });
        });

        var dbpediaconcepts = [];
        it("Search terms in dbpedia", function (done)
        {
            this.timeout(1500000);
            keywordsUtils.dbpediaLookup(dbpediaTerms, agent, function (err, db)
            {
                db.statusCode.should.equal(200);
                dbpediaconcepts = db.body.dbpediaUri.result;
                /*
                var writer = csvWriter();
                if (!fs.existsSync(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/photovoltaic/3 files/photovoltaic-cvalue-jj.csv")))
                {
                    writer = csvWriter({ separator: ",", headers: [ "searchTerm", "dbpediaLabel", "dbpediaUri", "dbpediaDescription" ]});
                }
                else
                {
                    writer = csvWriter({sendHeaders: false});
                }
                writer.pipe(fs.createWriteStream(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/photovoltaic/3 files/photovoltaic-cvalue-jj.csv"), {flags: "a"}));
                for (var i = 0; i < dbpediaconcepts.length; i++)
                {
                    writer.write(dbpediaconcepts[i]);
                }
                writer.end();
                */
                done();
            });
        });
        it("Get properties from LOV", function (done)
        {
            this.timeout(1500000);
            keywordsUtils.dbpediaResourceLookup(dbpediaconcepts, agent, function (err, db)
            {
                // console.log(err);
                db.statusCode.should.equal(200);
                /*
                var writer = csvWriter();
                if (!fs.existsSync(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/photovoltaic/3 files/dbpediapropertiescvalue-jj.csv")))
                {
                    writer = csvWriter({ headers: ["searchTerm", "lovScore", "lovVocabulary", "lovUri", "lovLabel"]});
                }
                else
                {
                    writer = csvWriter({separator: ",", sendHeaders: false});
                }
                writer.pipe(fs.createWriteStream(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/photovoltaic/3 files/dbpediapropertiescvalue-jj.csv"), {flags: "a"}));
                for (var i = 0; i < db.body.dbpediaUri.result.length; i++)
                {
                    writer.write(db.body.dbpediaUri.result[i]);
                }
                writer.end();
                */
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
