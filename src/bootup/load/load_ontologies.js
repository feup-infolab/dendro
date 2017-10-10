const fs = require("fs");

const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null.js")).isNull;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const OntologiesCache = require(Pathfinder.absPathInSrcFolder("kb/ontologies_cache/ontologies_cache.js")).OntologiesCache;

const loadOntologies = function(app, callback, forceLoadForTests)
{
    const Ontology = require(Pathfinder.absPathInSrcFolder("./models/meta/ontology.js")).Ontology;
    const cache = new OntologiesCache(Config.ontologies_cache);

    Ontology.allOntologies = Config.enabledOntologies;
    if(Config.startup.load_databases && Config.startup.reload_ontologies_on_startup || forceLoadForTests)
    {
        Logger.log_boot_message("info","Loading ontology parametrization from database... ");

        Ontology.initAllFromDatabase(function (err, ontologies)
        {
            if (isNull(err))
            {
                Ontology.allOntologies = ontologies;
                cache.put(ontologies, function(err, result){
                    if(isNull(err))
                    {
                        Logger.log_boot_message("success","Ontology information successfully loaded from database.");
                        return callback(null);
                    }
                    else
                    {
                        Logger.log_boot_message("error","Unable to load ontologies into cache!");
                        console.error(JSON.stringify(err));
                        console.error(JSON.stringify(result));
                        return callback(err, result);
                    }
                })
            }
            else
            {
                return callback("[ERROR] Unable to retrieve parametrization information about the ontologies loaded in the system.");
            }
        });
    }
    else
    {
        cache.get(function(err, ontologies){
            if(isNull(err))
            {
                Logger.log_boot_message("success","Ontology information successfully loaded from cache.");
                Ontology.allOntologies = ontologies;
                return callback(null);
            }
            else
            {
                return callback("[ERROR] Unable to retrieve parametrization information about the ontologies loaded in the system from cache.");
            }
        });
    }
};

module.exports.loadOntologies = loadOntologies;