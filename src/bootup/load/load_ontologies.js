const rlequire = require("rlequire");
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const OntologiesCache = rlequire("dendro", "src/kb/ontologies_cache/ontologies_cache.js").OntologiesCache;
const Elements = rlequire("dendro", "src/models/meta/elements.js").Elements;

const loadOntologies = function (app, callback, forceLoadForTests)
{
    const Ontology = rlequire("dendro", "src/./models/meta/ontology.js").Ontology;
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
                        Logger.log_boot_message("Ontology information successfully loaded from database.");

                        ontologiesCache.putElements(elements, function (err, result)
                        {
                            if (isNull(err))
                            {
                                Logger.log_boot_message("Elements information successfully loaded from database.");
                                ontologiesCache.close();
                                return callback(null);
                            }
                            Logger.log_boot_message("error", "Unable to save elements into cache!");
                            Logger.log("error", JSON.stringify(err));
                            Logger.log("error", JSON.stringify(result));
                            return callback(err, result);
                        });
                    }
                    else
                    {
                        Logger.log_boot_message("error", "Unable to save ontologies into cache!");
                        Logger.log("error", JSON.stringify(err));
                        Logger.log("error", JSON.stringify(result));
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
        Logger.log_boot_message("Loading ontology parametrization from database... ");

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
                    Logger.log_boot_message("Forcing the loading of ontologies from database because the cache is not initialized!");
                    loadOntologiesFromDatabaseIntoCache(callback);
                }
                else
                {
                    ontologiesCache.getElements(function (err, elements)
                    {
                        if (isNull(err))
                        {
                            Logger.log_boot_message("Ontology information successfully loaded from cache.");
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
