const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);

const Pathfinder = require("../../src/models/meta/pathfinder").Pathfinder;

const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const folderUtils = require(Pathfinder.absPathInTestsFolder("utils/folder/folderUtils.js"));
const httpUtils = require(Pathfinder.absPathInTestsFolder("utils/http/httpUtils.js"));
const descriptorUtils = require(Pathfinder.absPathInTestsFolder("utils/descriptor/descriptorUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const folder = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folder.js"));
const db = require(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));

let bootupUnit = require(Pathfinder.absPathInTestsFolder("units/bootup.Unit.js"));
let loadOntologies = require(Pathfinder.absPathInSrcFolder("/bootup/load/load_ontologies.js")).loadOntologies;
let initCache = require(Pathfinder.absPathInSrcFolder("/bootup/init/init_cache.js")).initCache;
let initVirtuoso = require(Pathfinder.absPathInSrcFolder("/bootup/init/init_virtuoso.js")).initVirtuoso;
const DockerCheckpointManager = require(Pathfinder.absPathInSrcFolder("utils/docker/checkpoint_manager.js")).DockerCheckpointManager;

describe("Loading ontologies cache only once...", function ()
{
    this.timeout(Config.testsTimeout);
    it("Should load all ontologies into cache.", function (done)
    {
        DockerCheckpointManager.restartAllContainers();
        initVirtuoso(null, function (err, result)
        {
            initCache(null, function (err, result)
            {
                loadOntologies(null, done, true);
            });
        });
    });
});
