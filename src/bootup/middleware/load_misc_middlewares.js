const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;

const appSecret = Config.crypto.secret,
    express = require('express'),
    slug = require('slug'),
    favicon = require('serve-favicon'),
    YAML = require('yamljs'),
    swaggerDocument = YAML.load(Pathfinder.absPathInApp('swagger.yaml')),
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

    app.use(favicon(Pathfinder.absPathInPublicFolder('images/logo_micro.png')));

    // app.use(express.logger('dev'));

    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());

    app.use(function (error, req, res, next)
    {
        if (error instanceof SyntaxError)
        {
            res.status(400).json({
                result: 'error',
                message: 'Error parsing request!',
                error: error
            });
        }
        else
        {
            next();
        }
    });

    app.use(methodOverride());

    app.use(flash());

    app.use(require('stylus').middleware(Pathfinder.getPathToPublicFolder()));

    app.use(express.static(Pathfinder.getPathToPublicFolder()));

    // all environments

    const env = process.env.NODE_ENV || 'development';
    if (env === 'development')
    {
        app.set('title', 'Dendro');
        app.set('theme', Config.theme);
    }

    //		development only
    if (app.get('env') === 'development')
    {
        app.use(errorHandler({
            secret: appSecret,
            resave: true,
            saveUninitialized: true
        }));
    }

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, true, {
        docExpansion: 'list'
    }));

    callback(null);
};

module.exports.loadMiscMiddlewares = loadMiscMiddlewares;
