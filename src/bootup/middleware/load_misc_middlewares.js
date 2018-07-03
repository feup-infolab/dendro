const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const appSecret = Config.crypto.secret,
    express = require("express"),
    slug = require("slug"),
    favicon = require("serve-favicon"),
    YAML = require("yamljs"),
    swaggerDocument = YAML.load(rlequire.absPathInApp("dendro", "swagger.yaml")),
    swaggerUi = require("swagger-ui-express"),
    bodyParser = require("body-parser"),
    methodOverride = require("method-override"),
    flash = require("connect-flash"),
    session = require("express-session"),
    errorHandler = require("errorhandler");

const loadMiscMiddlewares = function (app, callback)
{
    if (process.env.NODE_ENV !== "production")
    {
        app.use(errorHandler({ dumpExceptions: true, showStack: true }));
    }

    const busboy = require("connect-busboy");
    app.use(busboy());

    // all environments
    app.set("port", process.env.PORT || Config.port);
    app.set("views", rlequire.absPathInApp("dendro", "src/views"));

    app.set("view engine", "ejs");
    app.set("etag", "strong");

    app.use(favicon(rlequire.absPathInApp("dendro", "public/images/logo_micro.png")));

    // app.use(express.logger('dev'));

    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());

    app.use(function (error, req, res, next)
    {
        if (error instanceof SyntaxError)
        {
            res.status(400).json({
                result: "error",
                message: "Error parsing request!",
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

    app.use(require("stylus").middleware(rlequire.absPathInApp("dendro", "public/")));

    app.use(express.static(rlequire.absPathInApp("dendro", "public/")));

    app.set("title", "Dendro");
    app.set("theme", Config.theme);

    // app.use(session({
    //     secret: appSecret,
    //     resave: true,
    //     saveUninitialized: true
    // }));

    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
        docExpansion: "list"
    }));

    callback(null);
};

module.exports.loadMiscMiddlewares = loadMiscMiddlewares;
