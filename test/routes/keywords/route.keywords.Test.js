const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);
const md5 = require("md5");
const fs = require("fs");
const rlequire = require("rlequire");

var async = require("async");
const csvWriter = require("csv-write-stream");

const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const privateProject = rlequire("dendro", "test/mockdata/projects/private_project.js");

const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1");

const keywordsUtils = rlequire("dendro", "test/utils/keywords/keywordsUtils.js");
const fileUtils = rlequire("dendro", "test/utils/file/fileUtils.js");
const itemUtils = rlequire("dendro", "test/utils/item/itemUtils.js");
const descriptorUtils = rlequire("dendro", "test/utils/descriptor/descriptorUtils.js");
const appUtils = rlequire("dendro", "test/utils/app/appUtils.js");

const createFoldersUnitKeywords = rlequire("dendro", "test/units/folders/createFoldersKeywords.Unit.js");

const testFolder1 = rlequire("dendro", "test/mockdata/folders/testFolder1.js");
const BusPerformance = rlequire("dendro", "test/mockdata/files/keywords/BusPerformance.js");
const SimulatingVehicle = rlequire("dendro", "test/mockdata/files/keywords/SimulatingVehicle.js");
const driverattitude = rlequire("dendro", "test/mockdata/files/keywords/driverattitude.js");
const RegenerativeBraking = rlequire("dendro", "test/mockdata/files/keywords/RegenerativeBraking.js");
const RoutePlanning = rlequire("dendro", "test/mockdata/files/keywords/RoutePlanning.js");

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

    let article;

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
                        article = JSON.parse(res.text).descriptors[7].value;
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

    describe("[GET] Complete path using all 5 files", function ()
    {
        let loadfiles = function (lookup, cb)
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
                    cb(null, JSON.parse(res.text).descriptors[7].value);
                });
            });
        };
        /*
        let processfiles = function (lookup, cb)
        {
            keywordsUtils.preProcessing(lookup, agent, function (err, res)
            {
                res.statusCode.should.equal(200);
                cb(null, [res.text, JSON.parse(res.text).text]);

                // console.log(artigos[0]);
            });
        };
        */
        let articles = [];
        let dbpediaTerms;
        let docList = [BusPerformance, SimulatingVehicle, driverattitude, RegenerativeBraking, RoutePlanning];
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
        it("Should preProcess and extract terms", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                keywordsUtils.processExtract({method: "CValueJJ", text: articles}, agent, function (err, te)
                {
                    te.statusCode.should.equal(200);
                    // console.log(te.text);
                    dbpediaTerms = te.body.output.dbpediaTerms.keywords;
                    // keyword = JSON.parse(te.text).dbpediaTerms.keywords;

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
                        preProcessing.push(results[i][0]);
                        //console.log(preProcessing);
                        textprocessado.push(results[i][1]);
                        console.log(textprocessado);
                    }
                    done();
                });
            });
        });

        it("Should extract keywords", function (done)
        {
            keywordsUtils.termExtraction(preProcessing, textprocessado, agent, function (err, te)
            {
                var keyword;
                te.statusCode.should.equal(200);
                // console.log(te.text);
                dbpediaTerms = te.text;
                keyword = JSON.parse(te.text).dbpediaTerms.keywords;

                // console.log(keyword);

                done();
            });
        });
*/
        it("Should cluster terms", function (done)
        {
            this.timeout(1500000);
            keywordsUtils.clustering(dbpediaTerms, agent, function (err, db)
            {
                db.statusCode.should.equal(200);
                done();
            });
        });

        let dbpediaConcepts = [];
        it("Search terms in dbpedia", function (done)
        {
            this.timeout(1500000);
            // console.log(agent);
            keywordsUtils.dbpediaLookup(dbpediaTerms, agent, function (err, db)
            {
                // console.log(err);
                db.statusCode.should.equal(200);
                dbpediaConcepts = db.body.dbpediaUri.result;
                /*
                let writer = csvWriter();
                if (!fs.existsSync(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/vehicle/vehicle-cvalue-jj.csv")))
                {
                    writer = csvWriter({ separator: ",", headers: [ "searchTerm", "score", "dbpediaLabel", "dbpediaUri", "dbpediaDescription" ]});
                }
                else
                {
                    writer = csvWriter({sendHeaders: false});
                }
                writer.pipe(fs.createWriteStream(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/vehicle/vehicle-cvalue-jj.csv"), {flags: "a"}));
                for (let i = 0; i < dbpediaConcepts.length; i++)
                {
                    writer.write(dbpediaConcepts[i]);
                }
                writer.end();
                */
                done();
            });
        });
        it("Get properties from LOV", function (done)
        {
            this.timeout(1500000);
            keywordsUtils.dbpediaProperties(dbpediaConcepts, agent, function (err, db)
            {
                // console.log(err);
                db.statusCode.should.equal(200);
                /*
                let writer = csvWriter();
                if (!fs.existsSync(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/vehicle/dbpediapropertiescvalue-jj.csv")))
                {
                    writer = csvWriter({headers: ["searchTerm", "lovScore", "lovVocabulary", "lovUri", "lovLabel"]});
                }
                else
                {
                    writer = csvWriter({separator: ",", sendHeaders: false});
                }
                writer.pipe(fs.createWriteStream(Pathfinder.absPathInTestsFolder("mockdata/files/keywords/vehicle/dbpediapropertiescvalue-jj.csv"), {flags: "a"}));
                for (let i = 0; i < db.body.dbpediaUri.result.length; i++)
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
