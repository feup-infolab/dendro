//complies with the NIE ontology (see http://www.semanticdesktop.org/ontologies/2007/01/19/nie/#InformationElement)

const path = require('path');
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

function Connection ()
{
    var self = this;
    self.active = false;
    self.config = Config;
}

Connection.prototype.init = function(callback)
{
    var self = this;
    this.check_connection(function(err, active){
        if(isNull(err))
        {
            self.active = true;
            callback(null, self);
        }
        else
        {
            callback(err, false);
        }
    });
};

Connection.prototype.check_connection = function(callback)
{
    var self = this;

    var fullUrl = "http://" + self.config.network.host;

    if(!isNull(self.config.network.port))
    {
        fullUrl = fullUrl + ":" + self.config.network.port;
    }

    fullUrl = fullUrl +  "/about";

    var needle = require('needle');

    if(self.config.debug.check_connection_output)
    {
        console.log("Checking connection to Dendro Recommender instance at: " + fullUrl);
    }

    needle.request("get",
        fullUrl,
        null,
        {
            accept: "application/json"
        },
        function(err, response, body)
        {
            if(isNull(err))
            {
                if(body.result == "ok" && body.message == "Dendro Recommender Online")
                {
                    if(self.config.debug.check_connection_output)
                    {
                        console.log("SUCCESS connecting to Dendro Recommender instance at: " + fullUrl);
                    }

                    self.active = true;
                    callback(null, true);
                }
                else
                {
                    callback(err, response);
                }
            }
            else
            {
                callback(err, body);
            }
        }
    );
};

Connection.prototype.send = function(httpMethod, dataObject, urlEndpoint, callback)
{
    var self = this;
    if(self.active)
    {
        var needle = require('needle');

        var fullUrl = "http://" + Config.network.host;
        if (Config.network.port) {
            fullUrl = fullUrl + ":" + Config.network.port;
        }

        fullUrl = fullUrl + urlEndpoint;

        if(httpMethod.toLowerCase() == "get")
        {
            needle.request("get",
                fullUrl,
                dataObject,
                {
                    accept: "application/json",
                    json:true
                },
                function(err, response, body)
                {
                    if (isNull(err) && response.statusCode == 200)
                    {
                        callback(err, body);
                    }
                    else
                    {
                        if (err)
                        {
                            callback(err, response);
                        }
                        else
                        {
                            callback(1, "Status error while performing object " + JSON.stringify(dataObject) + " via "+ httpMethod + " method to url " + fullUrl + ". Returning code: " + response.statusCode);
                        }
                    }
                }
            );
        }
        else if(httpMethod.toLowerCase() == "post")
        {
            needle.request("post",
                fullUrl,
                JSON.stringify(dataObject),
                {
                    accept: "application/json",
                    json : true
                },
                function(err, response, body)
                {
                    if (isNull(err) && response.statusCode == 200)
                    {
                        callback(err, response, body);
                    }
                    else
                    {
                        if (err)
                        {
                            callback(err, response, body);
                        }
                        else
                        {
                            callback(1, "Status error while performing object " + JSON.stringify(dataObject) + " via "+ httpMethod + " method to url " + fullUrl + ". Returning code: " + response.statusCode, body);
                        }
                    }
                });
            }
            else if(httpMethod.toLowerCase() == "delete")
            {
                needle.request("delete",
                    fullUrl,
                    dataObject,
                    {
                        accept: "application/json",
                        json : true
                    },
                    function(err, response, body)
                    {
                        if (isNull(err) && response.statusCode == 200)
                        {
                            callback(err, response, body);
                        }
                        else
                        {
                            if (err)
                            {
                                callback(err, response, body);
                            }
                            else
                            {
                                callback(1, "Status error while performing object " + JSON.stringify(dataObject) + " via "+ httpMethod + " method to url " + fullUrl + ". Returning code: " + response.statusCode, body);
                            }
                        }
                    });
            }

    }
    else
    {
        callback(1, "Attempting to send object " + JSON.stringify(dataObject) + " to uri " + fullUrl + " over a non-active Dendro Recommender connection. Please open the connection first using the init() method.")
    }
};

module.exports.DRConnection = Connection;
