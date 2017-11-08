const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null.js")).isNull;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const OntologiesCache = require(Pathfinder.absPathInSrcFolder("kb/ontologies_cache/ontologies_cache.js")).OntologiesCache;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;

const loadOntologies = function (app, callback, forceLoadForTests)
{
    const Ontology = require(Pathfinder.absPathInSrcFolder("./models/meta/ontology.js")).Ontology;
    const ontologiesCache = new OntologiesCache(Config.ontologies_cache);

    const loadOntologiesFromDatabaseIntoCache = function (callback)
    {
        Ontology.initAllFromDatabase(function (err, ontologies, elements)
        {
            if (isNull(err))
            {
                Ontology.setAllOntologies(ontologies);
                Elements.setAllElements(elements);
                ontologiesCache.putOntologies(ontologies, function (err, result)
                {
                    if (isNull(err))
                    {
                        Logger.log_boot_message("success", "Ontology information successfully loaded from database.");

                        ontologiesCache.putElements(elements, function (err, result)
                        {
                            if (isNull(err))
                            {
                                Logger.log_boot_message("success", "Elements information successfully loaded from database.");
                                ontologiesCache.close();
                                return callback(null);
                            }
                            Logger.log_boot_message("error", "Unable to save elements into cache!");
                            console.error(JSON.stringify(err));
                            console.error(JSON.stringify(result));
                            return callback(err, result);
                        });
                    }
                    else
                    {
                        Logger.log_boot_message("error", "Unable to save ontologies into cache!");
                        console.error(JSON.stringify(err));
                        console.error(JSON.stringify(result));
                        return callback(err, result);
                    }
                });
            }
            else
            {
                return callback("[ERROR] Unable to retrieve parametrization information about the ontologies loaded in the system.");
            }
        });
    };

    if (Config.startup.load_databases && Config.startup.reload_ontologies_on_startup || forceLoadForTests)
    {
        Logger.log_boot_message("info", "Loading ontology parametrization from database... ");

        loadOntologiesFromDatabaseIntoCache(callback);
    }
    else
    {
        ontologiesCache.getOntologies(function (err, ontologies)
        {
            if (isNull(err))
            {
                if (JSON.stringify(ontologies) === JSON.stringify({}))
                {
                    Logger.log_boot_message("info", "Forcing the loading of ontologies from database because the cache is not initialized!");
                    loadOntologiesFromDatabaseIntoCache(callback);
                }
                else
                {
                    ontologiesCache.getElements(function (err, elements)
                    {
                        if (isNull(err))
                        {
                            Logger.log_boot_message("success", "Ontology information successfully loaded from cache.");
                            Ontology.setAllOntologies(ontologies);
                            Elements.setAllElements(elements);
                            ontologiesCache.close();
                            return callback(null);
                        }
                        return callback("[ERROR] Unable to retrieve parametrization information about the elements loaded in the system from cache.");
                    });
                }
            }
            else
            {
                return callback("[ERROR] Unable to retrieve parametrization information about the ontologies loaded in the system from cache.");
            }
        });
    }
};

module.exports.loadOntologies = loadOntologies;
