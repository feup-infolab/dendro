const fs = require('fs');

const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null.js")).isNull;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const loadOntologies = function(app, callback)
{
    const Ontology = require(Pathfinder.absPathInSrcFolder("./models/meta/ontology.js")).Ontology;

    if(Config.startup.load_databases && Config.startup.reload_ontologies_on_startup)
    {
        Logger.log_boot_message("info","Loading ontology parametrization from database... ");
        Ontology.initAllFromDatabase(function (err, ontologies)
        {
            if (isNull(err))
            {
                Config.allOntologies = ontologies;
                Logger.log_boot_message("success","Ontology information successfully loaded from database.");
                return callback(null);
            }
            else
            {
                return callback("[ERROR] Unable to retrieve parametrization information about the ontologies loaded in the system.");
            }
        });
    }
    else
    {
        Ontology.all(function(err, ontologies){
            if(isNull(err))
            {
                Config.allOntologies = ontologies;
                return callback(null);
            }
            else
            {
                return callback("[ERROR] Unable to retrieve parametrization information about the ontologies loaded in the system from cache.");
            }

        });
    }
}

module.exports.loadOntologies = loadOntologies;