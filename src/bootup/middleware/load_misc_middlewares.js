const path = require('path');

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
let UploadManager = require(Pathfinder.absPathInSrcFolder("/models/uploads/upload_manager.js")).UploadManager;

const appSecret = Config.crypto.secret,
    express = require('express'),
    slug = require('slug'),
    favicon = require('serve-favicon'),
    YAML = require('yamljs'),
    swaggerDocument = YAML.load(Pathfinder.absPathInApp("swagger.yaml")),
    swaggerUi = require('swagger-ui-express'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    flash = require('connect-flash'),
    errorHandler = require('express-session');

const loadMiscMiddlewares = function (app, callback)
{
    const busboy = require('connect-busboy');
    app.use(busboy());

    // all environments
    app.set('port', process.env.PORT || Config.port);
    app.set('views', Pathfinder.absPathInSrcFolder('/views'));

    app.set('view engine', 'ejs');
    app.set('etag', 'strong');

    app.use(favicon(Pathfinder.absPathInPublicFolder("images/logo_micro.png")));

    //app.use(express.logger('dev'));

    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());

    app.use(methodOverride());

    app.use(flash());

    app.use(require('stylus').middleware(Pathfinder.getPathToPublicFolder()));

    app.use(express.static(Pathfinder.getPathToPublicFolder()));

    // all environments

    const env = process.env.NODE_ENV || 'development';
    if ('development' === env)
    {
        app.set('title', 'Dendro');
        app.set('theme', Config.theme);
    }

    //		development only
    if ('development' === app.get('env'))
    {
        app.use(errorHandler({
            secret: appSecret,
            resave: true,
            saveUninitialized: true
        }));
    }

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, true, {
        docExpansion: "list"
    }));

    if (Config.debug.active && Config.debug.session.auto_login)
    {
        app.use(signInDebugUser);
    }

    callback(null);
};

module.exports.loadMiscMiddlewares = loadMiscMiddlewares;