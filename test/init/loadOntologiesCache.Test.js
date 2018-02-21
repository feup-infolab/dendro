const chai = require("chai");
const chaiHttp = require("chai-http");
chai.use(chaiHttp);

const Pathfinder = require("../../src/models/meta/pathfinder").Pathfinder;

const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

let loadOntologies = require(Pathfinder.absPathInSrcFolder("/bootup/load/load_ontologies.js")).loadOntologies;
let initCache = require(Pathfinder.absPathInSrcFolder("/bootup/init/init_cache.js")).initCache;
let initVirtuoso = require(Pathfinder.absPathInSrcFolder("/bootup/init/init_virtuoso.js")).initVirtuoso;
const DockerCheckpointManager = require(Pathfinder.absPathInSrcFolder("utils/docker/checkpoint_manager.js")).DockerCheckpointManager;

describe("Loading ontologies cache only once...", function ()
{
    this.timeout(Config.testsTimeout);
    it("Should load all ontologies into cache.", function (done)
    {
        if (!Config.docker.reuse_checkpoints)
        {
            DockerCheckpointManager.deleteAll(true, true);
        }

        DockerCheckpointManager.nukeAndRebuild(true);

        initVirtuoso(null, function (err, result)
        {
            initCache(null, function (err, result)
            {
                loadOntologies(null, done, true);
            });
        });
    });
});
