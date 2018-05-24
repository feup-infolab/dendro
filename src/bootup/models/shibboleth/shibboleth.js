const slug = require("slug");
const path = require("path");

const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const User = require(Pathfinder.absPathInSrcFolder("models/user.js")).User;
const UploadManager = require(Pathfinder.absPathInSrcFolder("/models/uploads/upload_manager.js")).UploadManager;

const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const _ = require("underscore");
const fs = require("fs");

class Shibboleth
{
    constructor (shibbolethConfig)
    {
        try
        {
            let __CALLBACK_URL = shibbolethConfig.CALLBACK_URL;
            let __ENTRY_POINT = shibbolethConfig.ENTRY_POINT;
            let __ISSUER = shibbolethConfig.ISSUER;
            let __SESSION_SECRET = shibbolethConfig.SESSION_SECRET;
            let __button_text = shibbolethConfig.button_text;

            let __idp_cert = fs.readFileSync(shibbolethConfig.idp_cert_path, "utf8");
            let __key = fs.readFileSync(shibbolethConfig.key_path, "utf8");
            let __cert = fs.readFileSync(shibbolethConfig.cert_path, "utf8");

            let __mboxKey = null;
            let __firstNameKey = null;
            let __surnameKey = null;
            let __usernameKey = null;

            /***GETS***/
            this.getCallbackURl = function ()
            {
                return __CALLBACK_URL;
            };

            this.getEntryPoint = function ()
            {
                return __ENTRY_POINT;
            };

            this.getIssuer = function ()
            {
                return __ISSUER;
            };

            this.getSessionSecret = function ()
            {
                return __SESSION_SECRET;
            };

            this.getButtonText = function ()
            {
                return __button_text;
            };

            this.getIdpCert = function ()
            {
                return __idp_cert;
            };

            this.getKey = function ()
            {
                return __key;
            };

            this.getCert = function ()
            {
                return __cert;
            };

            this.getMBoxKey = function () {
                return __mboxKey;
            };

            this.getFirstNameKey = function () {
                return __firstNameKey;
            };

            this.getSurnameKey = function () {
                return __surnameKey;
            };

            this.getUsernameKey = function () {
                return __usernameKey;
            };

            /***SETS***/
            this.setMBoxKey = function (mboxKey) {
                __mboxKey = mboxKey;
            };

            this.setFirstNameKey = function (firstNameKey) {
                __firstNameKey = firstNameKey;
            };

            this.setSurnameKey = function (surnameKey) {
                __surnameKey = surnameKey
            };

            this.setUsernameKey = function (usernameKey) {
                __usernameKey = usernameKey;
            };
        }
        catch (error)
        {
            throw error;
        }
    }

    registerAuthenticationRoutes (app, passport)
    {

    }

    loginUser(user, req, res)
    {
        req.logIn(user, function (err)
        {
            if (isNull(err))
            {
                req.session.isAdmin = false;
                req.session.upload_manager = new UploadManager(user.ddr.username);

                req.flash("success", "Welcome, " + user.foaf.firstName + " " + user.foaf.surname + ".");

                if (Config.debug.permissions.log_authorizations)
                {
                    Logger.log("User " + user.ddr.username + " signed in.");
                }

                if (req.body.redirect)
                {
                    res.redirect(req.body.redirect);
                }
                else
                {
                    res.redirect("/projects/my");
                }
            }
            else
            {
                req.flash("success", "There was an error signing you in.");
                Logger.log("Error signing in user " + JSON.stringify(err));
                throw err;
            }
        });
    }

    auth(req, res)
    {
        const self = this;
        self.getMatchingUserInDendro(req.user, function (err, newUser) {
            if(!isNull(err))
            {
                Logger.log("error", "Error signing in user " + JSON.stringify(newUser));
                req.flash("success", "There was an error signing you in.");
                return res.redirect("/");
            }
            else if(isNull(newUser))
            {
                Logger.log("error", "Error signing in user " + "newUser is null");
                req.flash("success", "There was an error signing you in.");
                return res.redirect("/");
            }
            else
            {
                self.loginUser(newUser, req, res);
            }
        });
    }

    getMatchingUserInDendro(shibbolethUser, callback)
    {
        const validUserKeysAndValues = function (mboxKey, firstNameKey, surnameKey, usernameKey, shibbolethUser)
        {
            let isValid = false;
            if(!isNull(mboxKey) && !isNull(firstNameKey) && !isNull(surnameKey) && !isNull(usernameKey) && !isNull(shibbolethUser))
            {
                let mbox = shibbolethUser[mboxKey];
                let firstName = shibbolethUser[firstNameKey];
                let surname = shibbolethUser[surnameKey];
                let username = shibbolethUser[usernameKey];
                if(!isNull(mbox) && !isNull(firstName) && !isNull(surname) && !isNull(username))
                {
                    isValid = true;
                }
            }
            return isValid;
        };

        let self = this;
        if(!isNull(shibbolethUser))
        {
            let mboxKey = self.getMBoxKey();
            let firstNameKey = self.getFirstNameKey();
            let surnameKey = self.getSurnameKey();
            let usernameKey = self.getUsernameKey();

            if(validUserKeysAndValues(mboxKey, firstNameKey, surnameKey, usernameKey, shibbolethUser) === true)
            {
                let mbox = shibbolethUser[mboxKey];
                let firstName = shibbolethUser[firstNameKey];
                let surname = shibbolethUser[surnameKey];
                let username = shibbolethUser[usernameKey];
                User.findByEmail(mbox, function (err, user) {
                    if(isNull(err))
                    {
                        if(isNull(user))
                        {
                            let password = self.constructor.name + "__" + new Date().getTime();
                            let isShibbolethUser = true;
                            User.createAndInsertFromObject({
                                    foaf: {
                                        mbox: mbox,
                                        firstName: firstName,
                                        surname: surname
                                    },
                                    ddr: {
                                        username: username,
                                        password: password,
                                        isShibbolethUser: isShibbolethUser
                                    }
                                },
                                function (err, newUser)
                                {
                                    if(!isNull(err))
                                    {
                                        const errorMessage = "Error when creating a new user for the first time in Dendro from a Shibboleth source, error: " + JSON.stringify(err);
                                        Logger.log("error", errorMessage);
                                        return callback(true, err);
                                    }
                                    else if(isNull(newUser))
                                    {
                                        const errorMessage = "Error when creating a new user for the first time in Dendro from a Shibboleth source, error: " + "newUser is null";
                                        Logger.log("error", errorMessage);
                                        const err = new Error(errorMessage);
                                        return callback(true, err);
                                    }
                                    else
                                    {
                                        return callback(err, newUser);
                                    }
                                });
                        }
                        else
                        {
                            return callback(null, user);
                        }
                    }
                    else
                    {
                        Logger.log("error", "Error at getMatchingUserInDendro: " + JSON.stringify(err));
                        return callback(true, err)
                    }
                });
            }
            else
            {
                const errorMessage = "Invalid user keys and values at getMatchingUserInDendro";
                const err = new Error(errorMessage);
                Logger.log("error", errorMessage);
                return callback(true, err)
            }
        }
        else
        {
            const errorMessage = "Shibboleth user object is missing!";
            const error = new Error(errorMessage);
            Logger.log("error", errorMessage);
            return  callback(true, error);
        }
    }
}

module.exports.Shibboleth = Shibboleth;
