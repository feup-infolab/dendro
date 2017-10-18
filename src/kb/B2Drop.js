let request = require('request');
request = request.defaults({jar: true});
const cheerio = require('cheerio');
const qs = require('querystring');

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const createClient = require("webdav");

//DEBUG OPTION
//require('request').debug = true

//TO CHECK HTTP ERROR  error.status

const Uri = {
    loginUri: 'https://b2drop.eudat.eu/login',
    logoutUri: 'https://b2drop.eudat.eu/logout',
    shareLinkRequest: 'https://b2drop.eudat.eu/ocs/v2.php/apps/files_sharing/api/v1/shares',
    webdavUri: 'https://b2drop.eudat.eu/public.php/webdav'
}

function B2Drop(username, password) {

    let self = this;

    self.username = username;
    self.password = password;
    self.cookie = request.jar();

};

B2Drop.prototype.login = function(callback) {

    let self = this;

    request.get({
            url: Uri.loginUri,
            auth: {
                user: self.username,
                pass: self.password
            },
            headers : {
                jar: self.cookie,
            }
        },
        function (error, response,body) {
                if(isNull(error) && response && response.statusCode === 200) {
                    const $ = cheerio.load(body);
                    self.requesttoken = $('head').attr('data-requesttoken');
                }
                return callback(error,response);
    });
};

B2Drop.prototype.logout = function(callback) {

    let self = this;

    request.get({
            url: Uri.logoutUri,
            headers : {
                requesttoken: self.requesttoken
            }
        },
        function (error, response) {
            if(isNull(error) && response && response.statusCode === 200 )
                self.cookie = null;
            return callback(error,response);
        }
    )
}

B2Drop.prototype.changeFolderSetting = function (folderUri, folderID, setting, callback) {

    let self = this;

    var queryString;

    request.put({
            url: Uri.shareLinkRequest + '/' + folderID + '?format=json' ,
            headers: {
                jar: self.cookie,
                requesttoken: self.requesttoken
            },
            form: setting
        },
        function (error, response) {
            //TODO check error
            queryString = qs.stringify( {
                format: 'json',
                path: folderUri,
                reshares: 'true'
            })

            request.get({
                    url: Uri.shareLinkRequest + '?' + queryString,
                    headers: {
                        jar: self.cookie,
                        requesttoken: self.requesttoken
                    }
                },
                function (error, response) {
                    return callback(null, response);
                });
        });
}

B2Drop.prototype.getShareLink = function (folderUri, password, callback) {
    let self = this;

    var queryString = qs.stringify( {
        format: 'json',
        password: '',
        passwordChanged: 'false',
        permission: '31',
        expireDate: '',
        shareType: '3',
        path: folderUri
    });


    request.post({
            url: Uri.shareLinkRequest + '?' + queryString,
            headers: {
                jar: self.cookie,
                requesttoken: self.requesttoken
            }
        },
        function (error, response) {

            if (!isNull(error)) {
                return callback(error, response);
            }

            queryString = qs.stringify({
                format: 'json',
                path: folderUri,
                reshares: 'true'
            })

            request.get({
                    url: Uri.shareLinkRequest + '?' + queryString,
                    headers: {
                        jar: self.cookie,
                        requesttoken: self.requesttoken
                    }
                },
                function (error, response, body) {
                    if (!isNull(error) || (response && response.statusCode != 200)) {
                        return callback(error, response, null)
                    }
                    else {
                        var info = JSON.parse(body);
                        const url = info.ocs.data[0].url;
                        const folderID = info.ocs.data[0].id;

                        self.changeFolderSetting(folderUri, folderID, {permissions: '15'}, function (err, response) {
                            if (!isNull(error) || (response && response.statusCode != 200)) {
                                return callback(error, response, url)
                            }
                            self.changeFolderSetting(folderUri, folderID, {password: password}, function (err, response) {
                                return callback(err, response,url);
                            });
                        });

                    }
            });
        });
};

B2Drop.prototype.initiateWebDavShareLink = function(sharelink,password,callback) {
    //TODO url check
    let self = this;
    self.authentication = Buffer.from(sharelink.split("/s/")[1] + ':null','latin1').toString('base64');


    self.connection = createClient(
        Uri.webdavUri,
        sharelink.split("/s/")[1] ,
        password
    );

    request.get({
            url: sharelink + '/authenticate',
            headers : {
                jar: self.cookie,
            }
        },
        function (error, response,body) {
            if(isNull(error) && response && response.statusCode === 200) {
                const $ = cheerio.load(body);
                self.requesttokenShareLink = $('head').attr('data-requesttoken');

                request.post({
                        url: sharelink + '/authenticate',
                        headers : {
                            jar: self.cookie,
                        },
                        formData: {
                            requesttoken: self.requesttokenShareLink,
                            password: password
                        }
                    },
                    function (err, resp) {
                    return callback(err,resp);
                })
            }
            else {
                return callback(error,response);
            }
        });
};

B2Drop.prototype.getDirectoryContents = function    (folderPath, callback) {


    let self = this;


    self.connection.getDirectoryContents(folderPath, {
        headers: {
            requesttoken: self.requesttokenShareLink,
            auth : "Basic" + self.authentication,

        }
    })
        .then(function(contents) {
            console.log(JSON.stringify(contents, undefined, 2));
            return callback(null,contents);
        },
              function(error) {

            console.log(error);
            return callback(error,null);

            }
        );

}

B2Drop.prototype.put = function (fileUri, inputStream, callback) {
        let self = this;

       self.connection.putFileContents(fileUri,inputStream,
           {
            headers: {
                jar: self.cookie,
                requesttoken: self.requesttokenShareLink,
                auth : "Basic" + self.authentication,
                overwrite: "true",
            }
           })
            .then(function(value) {
            // sucesso
                console.log("succ");
                return callback(null, value);
                }, function(motive) {
            // rejeitada
                console.log(motive);
                return callback(1,motive);
            });
}

B2Drop.prototype.get = function (fileUri, outputStream, callback) {
        const self = this;

        self.connection
            .getFileContents(fileUri,
                {
                    headers: {
                        jar: self.cookie,
                        requesttoken: self.requesttokenShareLink,
                        auth: "Basic" + self.authentication,
                        overwrite: "true"
                    }
                }
            )
            .then(function (data) {
                outputStream = data;
                return callback(null);
            }, function(error) {
                return callback(error);
            })

    }

B2Drop.prototype.delete = function (fileUri, callback) {
        const self = this;
        self.connection.delete(fileUri,  {
            headers: {
                jar: self.cookie,
                requesttoken: self.requesttokenShareLink,
                auth: "Basic" + self.authentication,
                overwrite: "true"
            }
        })
            .then(function(value) {
                // sucesso
                console.log("succ");
                return callback(null, value);
            }, function(motive) {
                // rejeitada
                console.log(motive);
                return callback(1,motive);
            });
}


module.exports.B2Drop = B2Drop;
