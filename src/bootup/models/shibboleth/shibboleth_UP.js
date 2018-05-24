const slug = require("slug");
const path = require("path");

const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Shibboleth = require(Pathfinder.absPathInSrcFolder("bootup/models/shibboleth/shibboleth.js")).Shibboleth;
const User = require(Pathfinder.absPathInSrcFolder("models/user.js")).User;
const UploadManager = require(Pathfinder.absPathInSrcFolder("/models/uploads/upload_manager.js")).UploadManager;
const _ = require("underscore");
const fs = require("fs");

class ShibbolethUP extends Shibboleth
{
    constructor(shibbolethConfig)
    {
        super(shibbolethConfig);
        const self = this;
        self.setMBoxKey("urn:oid:1.3.6.1.4.1.5923.1.1.1.6");
        self.setFirstNameKey("urn:oid:2.5.4.42");
        self.setSurnameKey("urn:oid:2.5.4.4");
        self.setUsernameKey("urn:oid:1.3.6.1.4.1.5923.1.1.1.6");
    }

    registerAuthenticationRoutes(app, passport)
    {
        const self = this;
        let saml = require("passport-saml");
        let samlStrategy = new saml.Strategy({
            // URL that goes from the Identity Provider -> Service Provider
            callbackUrl: self.getCallbackURl(),
            // URL that goes from the Service Provider -> Identity Provider
            entryPoint: self.getEntryPoint(),
            // Usually specified as `/shibboleth` from site root
            issuer: self.getIssuer(),
            identifierFormat: null,
            // Service Provider private key
            decryptionPvk: self.getKey(),
            // Service Provider Certificate
            privateCert: self.getKey(),
            // Identity Provider's public key
            cert: self.getIdpCert(),
            validateInResponseTo: false,
            disableRequestedAuthnContext: true
        }, function(profile, done) {
            return done(null, profile);
        });

        passport.use(samlStrategy);

        function ensureAuthenticated(req, res, next) {
            if (req.isAuthenticated())
                return next();
            else
                return res.redirect("/Shibboleth/login");
        }

        app.get("/Shibboleth",
            ensureAuthenticated,
            function(req, res) {
                res.send('Authenticated');
            }
        );

        app.get("/Shibboleth/login",
            passport.authenticate("saml", { failureRedirect: "/Shibboleth/login/fail" }),
            function (req, res) {
                res.redirect("/");
            }
        );

        app.post("/Shibboleth/login/callback",
            passport.authenticate("saml", { failureRedirect: "/Shibboleth/login/fail" }),
            function(req, res) {
                Logger.log("info", "will check req.user!!");
                Logger.log("info", req.user);
                self.auth(req, res);
            }
        );

        app.get("/Shibboleth/login/fail",
            function(req, res) {
                Logger.log("Login failed!");
                res.status(401).send("Login failed");
            }
        );

        app.get("/Shibboleth.sso/Metadata",
            function(req, res) {
                res.type("application/xml");
                res.status(200).send(samlStrategy.generateServiceProviderMetadata(self.getCert()));
            }
        );
    }
}

module.exports.ShibbolethUP = ShibbolethUP;