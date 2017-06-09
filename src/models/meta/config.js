/**
 * Configuration parameters
 */

function Config (){}

var fs = require('fs');
var path = require('path');

if(process.env.NODE_ENV === "test")
{
    Config.appDir = path.resolve(path.dirname(require.main.filename), "../../..");
    console.log("Running in test mode and the app directory is : " + Config.appDir);
}
else
{
    Config.appDir = path.resolve(path.dirname(require.main.filename), "..");
    console.log("Running in production / dev mode and the app directory is : " + Config.appDir);
}

Config.absPathInApp = function(relativePath)
{
    return path.join(Config.appDir, relativePath);
};

Config.absPathInTestsFolder = function(relativePath)
{
    return path.join(Config.appDir, "test_new_structure", relativePath);
};

var configs_file_path = Config.absPathInApp("conf/deployment_configs.json");
var active_config_file_path = Config.absPathInApp("conf/active_deployment_config.json");

var configs = JSON.parse(fs.readFileSync(configs_file_path, 'utf8'));

var active_config_key;
if(process.env.NODE_ENV == 'test')
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
}
else
{
    active_config_key = JSON.parse(fs.readFileSync(active_config_file_path, 'utf8')).key;
}

var active_config = configs[active_config_key];

var getConfigParameter = function(parameter, defaultValue)
{
    if(active_config[parameter] == null)
    {
        if(defaultValue != null)
        {
            console.error("[WARNING] Using default value "+ JSON.stringify(defaultValue) + " for parameter " + parameter +" !");
            Config[parameter] = defaultValue;
            return Config[parameter];
        }
        console.error("[FATAL ERROR] Unable to retrieve parameter " + parameter + " from \'"+active_config_key + "\' configuration. Please review the deployment_configs.json file.");
        process.exit(1);
    }
    else
    {
        return active_config[parameter];
    }
};

// hostname for the machine in which this is running, configure when running on a production machine
Config.port = getConfigParameter("port");
Config.host = getConfigParameter("host");
Config.baseUri = getConfigParameter("baseUri");
Config.eudatBaseUrl = getConfigParameter("eudatBaseUrl");
Config.eudatToken = getConfigParameter("eudatToken");
Config.eudatCommunityId = getConfigParameter("eudatCommunityId");
Config.sendGridUser = getConfigParameter("sendGridUser");
Config.sendGridPassword = getConfigParameter("sendGridPassword");

Config.elasticSearchHost =  getConfigParameter("elasticSearchHost");
Config.elasticSearchPort =  getConfigParameter("elasticSearchPort");

Config.cache =  getConfigParameter("cache");

Config.virtuosoHost =  getConfigParameter("virtuosoHost");
Config.virtuosoPort =  getConfigParameter("virtuosoPort");

Config.virtuosoAuth = getConfigParameter("virtuosoAuth");

//maps
Config.maps =  getConfigParameter("maps");

//change log config
Config.change_log =  parseInt(getConfigParameter("change_log"));

//mongodb cluster used for file storage
Config.mongoDBHost =  getConfigParameter("mongoDBHost");
Config.mongoDbPort =  getConfigParameter("mongoDbPort");
Config.mongoDbCollectionName =  getConfigParameter("mongoDbCollectionName");
Config.mongoDBSessionStoreCollection =  getConfigParameter("mongoDBSessionStoreCollection");
Config.mongoDbVersion =  getConfigParameter("mongoDbVersion");
Config.mongoDBAuth = getConfigParameter("mongoDBAuth");

//mysql database for interaction

Config.mySQLHost =  getConfigParameter("mySQLHost");
Config.mySQLPort =  getConfigParameter("mySQLPort");
Config.mySQLAuth = getConfigParameter("mySQLAuth");
Config.mySQLDBName = getConfigParameter("mySQLDBName");

//file uploads and downloads

Config.maxUploadSize = getConfigParameter("maxUploadSize");   //1000MB®
Config.maxProjectSize = getConfigParameter("maxProjectSize");   //10000MB®
Config.maxSimultanousConnectionsToDb = getConfigParameter("maxSimultanousConnectionsToDb");
Config.dbOperationTimeout = getConfigParameter("dbOperationTimeout");

if(path.isAbsolute(getConfigParameter("tempFilesDir")))
{
    Config.tempFilesDir = getConfigParameter("tempFilesDir");
}
else
{
    Config.tempFilesDir = Config.absPathInApp(getConfigParameter("tempFilesDir"));
}

Config.tempFilesCreationMode = getConfigParameter("tempFilesCreationMode");

Config.administrators = getConfigParameter("administrators");

// load debug and startup settings
Config.debug = getConfigParameter("debug");

Config.startup = getConfigParameter("startup");
Config.baselines = getConfigParameter("baselines");

//load logger options
Config.logging = getConfigParameter("logging");

//load version description
Config.version = getConfigParameter("version");

//secrets
Config.crypto = getConfigParameter("crypto");

//load recommendation settings
Config.recommendation = getConfigParameter("recommendation");
Config.recommendation.getTargetTable = function()
{
    if(Config.recommendation.modes.dendro_recommender.log_modes.phase_1.active)
    {
        var targetTable = Config.recommendation.modes.dendro_recommender.log_modes.phase_1.table_to_write_interactions;
    }
    else if(Config.recommendation.modes.dendro_recommender.log_modes.phase_2.active)
    {
        var targetTable = Config.recommendation.modes.dendro_recommender.log_modes.phase_2.table_to_write_interactions;
    }

    return targetTable;
};

Config.exporting = getConfigParameter("exporting");

Config.cache =  getConfigParameter("cache");

/**
 * Database connection (s).
 * @type {{default: {baseURI: string, graphName: string, graphUri: string}}}
 */

Config.initGlobals = function()
{
    GLOBAL.db = {
        default: {
            baseURI: "http://" + Config.host,
            graphHandle: "dendro_graph",
            graphUri: "http://" + Config.host + "/dendro_graph",
            redis_instance: 'default'
        },
        social: {
            baseURI: "http://" + Config.host,
            graphHandle: "social_dendro",
            graphUri: "http://" + Config.host + "/social_dendro",
            redis_instance: 'social'
        },
        notifications: {
            baseURI: "http://" + Config.host,
            graphHandle: "notifications_dendro",
            graphUri: "http://" + Config.host + "/notifications_dendro",
            redis_instance: 'notifications'
        }
    };

    GLOBAL.gfs = {
        default: {}
    };

    GLOBAL.mysql = {
        default: {}
    };

    GLOBAL.redis = {
        default: {},
        social: {},
        notifications: {}
    };

    var Elements = require('./elements.js').Elements;

    GLOBAL.allOntologies = {
        dcterms: {
            prefix: "dcterms",
            uri: "http://purl.org/dc/terms/",
            elements: Elements.dcterms,
            label: "Dublin Core terms",
            description: "Generic description. Creator, title, subject...",
            domain: "Generic",
            domain_specific: false
        },
        foaf: {
            prefix: "foaf",
            uri: "http://xmlns.com/foaf/0.1/",
            elements: Elements.foaf,
            label: "Friend of a friend",
            description: "For expressing people-related metadata. Mailbox, web page...",
            domain: "Generic",
            domain_specific: false
        },
        ddr: {
            prefix: "ddr",
            uri: "http://dendro.fe.up.pt/ontology/0.1/",
            private: true,
            elements: Elements.ddr,
            label: "Dendro internal ontology",
            description: "Designed to represent internal system information important to Dendro",
            domain: "Generic",
            domain_specific: false
        },
        rdf: {
            prefix: "rdf",
            uri: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            private: true,
            elements: Elements.rdf,
            label: "Resource Description Framework",
            description: "Low-level technical ontology. It is the building block of all others.",
            domain: "Low-level, System",
            domain_specific: false
        },
        nie: {
            prefix: "nie",
            uri: "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#",
            private: true,
            elements: Elements.nie,
            label: "Nepomuk Information Element",
            description: "Ontology for representing files and folders. Information Elements",
            domain: "Low-level, System",
            domain_specific: false
        },
        nfo: {
            prefix: "nfo",
            uri: "http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#",
            private: true,
            elements: Elements.nfo,
            label: "Nepomuk File Ontology",
            description: "Ontology for representing files and folders. Files and Folders.",
            domain: "Low-level, System",
            domain_specific: false
        },
        research: {
            prefix: "research",
            uri: "http://dendro.fe.up.pt/ontology/research/",
            elements: Elements.research,
            label: "Dendro research",
            description: "Experimental research-related metadata. Instrumentation, method...",
            domain: "Generic",
            domain_specific: true
        },
        dcb: {
            prefix: "dcb",
            uri: "http://dendro.fe.up.pt/ontology/dcb/",
            elements: Elements.dcb,
            label: "Double Cantilever Beam",
            description: "Fracture mechanics experiments. Initial crack length, Material type...",
            domain: "Mechanical Engineering",
            domain_specific: true
        },
        achem: {
            prefix: "achem",
            uri: "http://dendro.fe.up.pt/ontology/achem/",
            elements: Elements.achem,
            label: "Pollutant analysis",
            description: "Analytical Chemistry experimental studies... Analysed substances, Sample count...",
            domain: "Analytical Chemistry",
            domain_specific: true
        },
        bdv: {
            prefix: "bdv",
            uri: "http://dendro.fe.up.pt/ontology/BIODIV/0.1#",
            elements: Elements.bdv,
            label: "Biodiversity evolution studies",
            description: "For INSPIRE-represented observational data for biodiversity. Reference system identifier, Metadata point of contact...",
            domain: "Biodiversity, Georeferencing",
            domain_specific: true
        },
        biocn: {
            prefix: "biocn",
            uri: "http://dendro.fe.up.pt/ontology/BioOc#",
            elements: Elements.biocn,
            label: "Biological Oceanography",
            description: "Biological Oceanography observational and experimental studies...Life stage, Species count, individualPerSpecie...",
            domain: "Biological Oceanography",
            domain_specific: true
        },
        grav: {
            prefix: "grav",
            uri: "http://dendro.fe.up.pt/ontology/gravimetry#",
            elements: Elements.grav,
            label: "Gravimetry",
            description: "Gravimetry observational and experimental studies...Altitude resolution; Beginning time...",
            domain: "Gravimetry",
            domain_specific: true
        },
        hdg: {
            prefix: "hdg",
            uri: "http://dendro.fe.up.pt/ontology/hydrogen#",
            elements: Elements.hdg,
            label: "Hydrogen Generation",
            description: "Hydrogen Generation experimental studies...Catalyst; Reagent...",
            domain: "Hydrogen Generation",
            domain_specific: true
        },
        tsim: {
            prefix: "tsim",
            uri: "http://dendro.fe.up.pt/ontology/trafficSim#",
            elements: Elements.tsim,
            label: "Traffic Simulation",
            description: "Traffic Simulation studies...Driving cycle; Vehicle Mass...",
            domain: "Traffic Simulation",
            domain_specific: true
        },
        cep: {
            prefix: "cep",
            uri: "http://dendro.fe.up.pt/ontology/cep/",
            elements: Elements.cep,
            label: "Cutting and Packing",
            description: "Cutting and packing optimization strategies...Solver configuration, Optimization strategy, Heuristics used...",
            domain: "Algorithms and optimization",
            domain_specific: true
        },
        social: {
            prefix: "social",
            uri: "http://dendro.fe.up.pt/ontology/socialStudies#",
            elements: Elements.social,
            label: "Social Studies",
            description: "Social and Behavioural Studies... Methodology, Sample procedure, Kind of data...",
            domain: "Social and Behavioural Science",
            domain_specific: true
        },
        cfd: {
            prefix: "cfd",
            uri: "http://dendro.fe.up.pt/ontology/cfd#",
            elements: Elements.cfd,
            label: "Fluid Dynamics",
            description: "Computational Fluid Dynamics... Flow Case, Initial Condition, Temporal Discretization...",
            domain: "Computational Fluid Dynamics",
            domain_specific: true
        }
    };

    Config.caches = {
    }

    for(var db in GLOBAL.db)
    {
        var dbParam = GLOBAL.db[db];
        if(dbParam.hasOwnProperty("graphUri") && dbParam.hasOwnProperty("redis_instance"))
        {
            Config.caches[dbParam.graphUri] = GLOBAL.redis[dbParam.redis_instance];
        }
        else
        {
            console.error("There was an error parametrizing the caches for graph " + JSON.stringify(db) + " .This is a bug. Please review the config.json file.");
            process.exit(1);
        }
    }
}

/**
 * ElasticSearch Indexing Configuration
 *
 */
Config.indexableFileExtensions = {
    "pdf" : 1,
    "doc": 1,
    "docx" : 1
};

Config.limits =
{
    index : {
        maxResults : 100,
        pageSize : 100
    },
    db : {
        maxResults : 1000,
        pageSize : 1000
    }
};

Config.streaming  =
{
    db :
    {
        page_size : 200
    }
};

Config.useElasticSearchAuth = active_config.useElasticSearchAuth;

Config.elasticSearchAuthCredentials = active_config.elasticSearchAuthCredentials;

/**
 * Plugins
 */

Config.plugins = {
    folderName : "plugins"
};

/*
Element / Ontology related configuration
 */

Config.acl = {
    actions : {
        restore : "restore",
        backup : "backup",
        edit : "edit",
        delete : "delete",
        read : "read"
    },
    groups : {
        creator : "creator",
        admin : "admin"
    },
    allow : 1,
    deny : 0
};

Config.controls = {
    date_picker : "date_picker",
    input_box : "input_box",
    markdown_box : "markdown_box",
    map : "map",
    url_box : "url_box",
    regex_checking_input_box : "regex_checking_input_box",
    combo_box : "combo_box"
};

Config.types = {
    public : "public",                                  //can be shared, read and written
    private : "private",                                //cannot be shared to the outside world under any circumstance
    locked : "locked",                                  //can not be seen or edited from the main interface or via apis
    restorable : "restorable",                          //can be restorable from a metadata.json file in a zip backup file
    backuppable : "backuppable",                        //will be included in a metadata.json file produced in a zip file (backup zips)
    audit : "audit",                                    //cannot be changed via API calls, changed internally only
    api_readable : "api_readable",                      //accessible to the outside world via API calls
    api_writeable : "api_writeable",                    //modifiable from the outside world via API calls
    immutable : "immutable",                            //cannot be changed under ANY circumstance
    unrevertable : "unrevertable",                      //cannot be fallen back in the a "restore previous version" operation
    locked_for_project : "locked_for_project"           //project metadata which cannot be modified using the metadata editor, has to go through the project administrator
};

/*
Backup and restore
 */

Config.packageMetadataFileName = "metadata.json";
Config.systemOrHiddenFilesRegexes = getConfigParameter("systemOrHiddenFilesRegexes");

Config.getAbsolutePathToPluginsFolder = function()
{
    var path = require('path');
    return path.join(Config.appDir, "src", Config.plugins.folderName);
};

Config.absPathInPluginsFolder = function(relativePath)
{
    return path.join(Config.getAbsolutePathToPluginsFolder(), relativePath);
};

Config.absPathInSrcFolder = function(relativePath)
{
    return path.join(Config.appDir, "src", relativePath);
};

Config.getPathToPublicFolder = function()
{
    return path.join(Config.appDir, "public");
};

Config.absPathInPublicFolder = function(relativePath)
{
    return path.join(Config.getPathToPublicFolder(), relativePath);
};


/**
 * Thumbnail Generation
 */

if(Config.thumbnailableExtensions == null)
{
    Config.thumbnailableExtensions = require(Config.absPathInPublicFolder("/shared/public_config.json"))["thumbnailable_file_extensions"];
}

if(Config.iconableFileExtensions == null)
{
    Config.iconableFileExtensions = {};
    let extensions = fs.readdirSync(Config.absPathInPublicFolder("/images/icons/extensions"));

    for(let i = 0; i < extensions.length; i++)
    {
        if(extensions[i] != "." && extensions[i] != "..")
        {
            let extensionOnly = extensions[i].match(/file_extension_(.+)\.png/)[1];
            if(extensionOnly != null)
                Config.iconableFileExtensions[extensionOnly] = true;
        }
    }
}

Config.thumbnails = {
    thumbnail_format_extension : "gif",
    //every attribute of the size_parameters must be listed here for iteration TODO fix later
    sizes : ["big", "medium", "small", "icon"],
    size_parameters:
    {
        big : {
            description : "big",
            width : 256,
            height : 256
        },
        medium : {
            description : "medium",
            width : 128,
            height : 128
        },
        small : {
            description : "small",
            width : 64,
            height : 64
        },
        icon : {
            description : "icon",
            width : 32,
            height : 32
        }
    }
};

/*
MIME types
 */

Config.mimeType = function(extension) {
    var mime = require('mime-types');
    if(mime.lookup(extension) == null)
    {
        return "application/octet-stream";
    }
    else
    {
        return mime.lookup(extension);
    }
};

Config.swordConnection = {
    DSpaceServiceDocument: "/swordv2/servicedocument",
    EprintsServiceDocument: "/sword-app/servicedocument",
    EprintsCollectionRef: "/id/contents"
};

var Serializers = require(Config.absPathInSrcFolder("/utils/serializers.js"));

Config.defaultMetadataSerializer = Serializers.dataToJSON;
Config.defaultMetadataContentType = "text/json";

Config.metadataSerializers ={
    "application/text" : Serializers.metadataToText,
    "application/txt" : Serializers.metadataToText,
    "application/rdf" : Serializers.metadataToRDF,
    "application/xml" : Serializers.metadataToRDF,
    "application/json" : Serializers.dataToJSON
}
Config.metadataContentTypes ={
    "application/text" : "text/plain",
    "application/txt" : "text/plain",
    "application/rdf" : "text/xml",
    "application/xml" : "text/xml",
    "application/json" : "application/json"
};

Config.theme = getConfigParameter("theme");

Config.demo_mode = getConfigParameter("demo_mode");


if(Config.demo_mode.active)
{
    const exec = require('child_process').exec;

    Config.demo_mode.git_info = {};

    exec('git branch | grep "^\* .*$" | cut -c 3- | tr -d "\n"',
        {
            cwd: Config.appDir
        },
        function(error, stdout, stderr) {
            if (error == null) {
                console.log("Active branch : " + JSON.stringify(stdout));
                Config.demo_mode.git_info.active_branch = stdout;
            }
            else
            {
                console.error("Unable to get active branch : " + JSON.stringify(error));
            }
        });

    exec('git log -1 | grep "commit.*" | cut -c 8- | tr -d "\n"',
        {
            cwd: Config.appDir
        }, function (error, stdout, stderr) {
        if (error == null) {
            console.log("Last commit hash : " + JSON.stringify(stdout));
            Config.demo_mode.git_info.commit_hash = stdout;
        }
        else
        {
            console.error("Unable to get commit hash : " + JSON.stringify(error));
        }
    });

    exec('git log -1 | grep "Date:.*" | cut -c 9- | tr -d "\n"',
        {
            cwd: Config.appDir
        }, function (error, stdout, stderr) {
        if (error == null) {
            console.log("Last commit date : " + JSON.stringify(stdout));
            Config.demo_mode.git_info.last_commit_date = stdout;
        }
        else
        {
            console.error("Unable to get last commit date : " + JSON.stringify(error));
        }
    });
}

Config.email = getConfigParameter("email");

Config.analytics_tracking_code = getConfigParameter("analytics_tracking_code");

Config.public_ontologies = getConfigParameter("public_ontologies");

Config.regex_routes = {
    project_root:
    {
        restore : "\/project\/([^\/]+)[\/data]?$",
        bagit : "\/project\/([^\/]+)[\/data]?$",
    },
    inside_projects :
    {
        upload : "\/project\/([^\/]+)[\/data]?((?=(.*)\/upload\/?$).*)$",
        restore : "\/project\/([^\/]+)[\/data]?((?=(.*)\/restore\/?$).*)$",
        download : "\/project\/([^\/]+)[\/data]?((?=(.*)\/download\/?$).*)$"
    }
}

Config.authentication = getConfigParameter("authentication");

module.exports.Config = Config;
