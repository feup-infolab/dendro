const fs = require("fs");
const _ = require("underscore");
const async = require("async");
const yaml = require("js-yaml");

const rlequire = require("rlequire");
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const repository_platform_configs_file_path = rlequire.absPathInApp("dendro", "conf/repository_platform_configs.json");
const active_config_file_path = rlequire.absPathInApp("dendro", "conf/active_deployment_config.yml");

const loadRepositoryPlatforms = function (app, callback)
{
    const RepositoryPlatform = rlequire("dendro", "src/models/harvesting/repo_platform").RepositoryPlatform;
    const repositoryPlatformConfigs = JSON.parse(fs.readFileSync(repository_platform_configs_file_path, "utf8"));

    const argv = require("yargs").argv;

    let activeConfigKey;
    if (argv.config)
    {
        activeConfigKey = argv.config;
    }
    else
    {
        activeConfigKey = yaml.safeLoad(fs.readFileSync(active_config_file_path)).key;
    }

    let active_config_for_repositoryPlatforms = repositoryPlatformConfigs[activeConfigKey];

    if (isNull(active_config_for_repositoryPlatforms))
    {
        Logger.log("Invalid active repository platforms configuration key " + activeConfigKey + ". It is not parametrized in the " + active_config_file_path + " file. Please review the configuration.");
        Logger.log("Using default configuration for repository platforms...");
        active_config_for_repositoryPlatforms = repositoryPlatformConfigs.default;
    }

    RepositoryPlatform.all(function (err, repPlatforms)
    {
        if (isNull(err))
        {
            const platformNicks = _.map(active_config_for_repositoryPlatforms, function (platform)
            {
                return platform.foaf.nick;
            });

            Logger.log_boot_message("Platforms parametrized in " + repository_platform_configs_file_path + JSON.stringify(platformNicks));
            async.mapSeries(active_config_for_repositoryPlatforms, function (aMissingPlatform, callback)
            {
                let found = _.filter(repPlatforms, function (repPlatform)
                {
                    return repPlatform.foaf.nick === aMissingPlatform.foaf.nick;
                });
                if (found.length <= 0)
                {
                    Logger.log_boot_message("Platform " + aMissingPlatform.foaf.nick + " missing in database record. Recreating...");
                    const newRepPlatform = new RepositoryPlatform({
                        ddr: {
                            handle: aMissingPlatform.foaf.nick
                        },
                        dcterms: {
                            title: aMissingPlatform.dcterms.title
                        },
                        foaf: {
                            nick: aMissingPlatform.foaf.nick,
                            homepage: aMissingPlatform.foaf.homepage
                        }
                    });

                    newRepPlatform.save(function (err, data)
                    {
                        if (isNull(err))
                        {
                            callback(null);
                        }
                        else
                        {
                            callback(true, "[ERROR] Unable to save a missing repository platform in the database: " + JSON.stringify(data));
                        }
                    });
                }
                else
                {
                    Logger.log_boot_message("Platform " + aMissingPlatform.foaf.nick + " already exists in database. Continuing...");
                    callback(null);
                }
            }, function (err, results)
            {
                if (isNull(err))
                {
                    Logger.log_boot_message("Repository platforms information successfully loaded from database.");
                    callback(null);
                }
                else
                {
                    callback(true, "[ERROR] Unable to load repository platforms: " + JSON.stringify(results));
                }
            });
        }
        else
        {
            return callback(true, "[ERROR] Not able to load repository platforms from the database: " + JSON.stringify(repPlatforms));
        }
    });
};

module.exports.loadRepositoryPlatforms = loadRepositoryPlatforms;
