const fs = require("fs");
const _ = require("underscore");
const async = require("async");

const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null.js")).isNull;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const repository_platform_configs_file_path = Pathfinder.absPathInApp("conf/repository_platform_configs.json");
const active_config_file_path = Pathfinder.absPathInApp("conf/active_deployment_config.json");

const loadRepositoryPlatforms = function(app, callback)
{
    const RepositoryPlatform = require(Pathfinder.absPathInSrcFolder("/models/harvesting/repo_platform")).RepositoryPlatform;
    const repositoryPlatformConfigs = JSON.parse(fs.readFileSync(repository_platform_configs_file_path, 'utf8'));

    let active_config_key;
    if(process.env.NODE_ENV === 'test')
    {
        if(process.env.RUNNING_IN_JENKINS === "1")
        {
            active_config_key = "jenkins_buildserver_test";
            console.log("[INFO] Running in JENKINS server detected. RUNNING_IN_JENKINS var is " + process.env.RUNNING_IN_JENKINS);
        }
        else
        {
            active_config_key = "test";
            console.log("[INFO] Running in test environment detected");
        }

        Config.testsTimeOut = 15000;
    }
    else
    {
        active_config_key = JSON.parse(fs.readFileSync(active_config_file_path, 'utf8')).key;
    }


    const active_config_for_repositoryPlatforms = repositoryPlatformConfigs[active_config_key];

    RepositoryPlatform.all(function (err, repPlatforms) {
        if(isNull(err))
        {
            async.map(active_config_for_repositoryPlatforms, function (aMissingPlatform, callback) {
                let found = _.filter(repPlatforms, function (repPlatform) {
                    return repPlatform.foaf.nick === aMissingPlatform.foaf.nick;
                });
                if(found.length <=0)
                {
                    const newRepPlatform = new RepositoryPlatform({
                        ddr: {
                            handle: aMissingPlatform.foaf.nick
                        },
                        dcterms : {
                            title: aMissingPlatform.dcterms.title
                        },
                        foaf: {
                            nick: aMissingPlatform.foaf.nick,
                            homepage: aMissingPlatform.foaf.homepage
                        }
                    });

                    newRepPlatform.save(function (err, data) {
                        if(isNull(err))
                        {
                            callback(null);
                        }
                        else
                        {
                            callback(true,"[ERROR] Unable to save a missing repository platform in the database: " + JSON.stringify(data));
                        }
                    });
                }
                else
                {
                    callback(null);
                }
            }, function (err, results) {
                if(isNull(err))
                {
                    Logger.log_boot_message("success","Repository platforms information successfully loaded from database.");
                    return callback(null);
                }
                else
                {
                    return callback(true,"[ERROR] Unable to load repository platforms: " + JSON.stringify(results));
                }
            });
        }
        else
        {
            return callback(true,"[ERROR] Not able to load repository platforms from the database: " + JSON.stringify(repPlatforms));
        }
    });
}

module.exports.loadRepositoryPlatforms = loadRepositoryPlatforms;