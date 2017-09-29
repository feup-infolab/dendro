const createClient = require("webdav");

//TO CHECK HTTP ERROR  error.status



function B2Drop(host,username,password,callback) {
    let self = this;

    self.host = host;
    self.username = username;
    self.password = password;

    self.connection =  createClient(
        self.host,
        self.username,
        self.password
    );
};

B2Drop.prototype.open = function (callback) {
    //let self = this;
};

//TODO
B2Drop.prototype.close = function (callback) {
    self.connection = null;
};


B2Drop.prototype.put = function (fileUri, inputStream, callback) {
    const self = this;

    self.connection.putFileContents(fileUri, inputStream)
        .then( function () {
	    console.log("path sucs");
            return callback(null);
        })
        .catch(function(err) {
	    console.log("path error");
            return callback(1,err);
        })

}

B2Drop.prototype.get = function (fileUri, outputStream,callback) {
    const self = this;

    self.connection
        .getFileContents(fileUri)
        .then( function(data) {
            outputStream = data;
            return callback(null);
        })
        .catch(function(err) {
           return callback(1,err);
        })
}

B2Drop.prototype.delete = function (fileUri, callback) {
    const self = this;
    self.connection.delete(fileUri)
        .then(function () {
            return callback(null);
        })
        .catch(function (err) {
            return callback(1,err);
        })
}


module.exports = B2Drop;


/**TESTES*/

var fs = require("fs");

/*
var temp = new B2Drop("https://b2drop.eudat.eu/remote.php/webdav/","up201404178@fe.up.pt","xdlol24PSD");

*/

var temp = new B2Drop("https://b2drop.eudat.eu/ocs/v2.php/apps/files_sharing/api/v1/shares?format=json", "","");
//temp.open();

/*
temp.connection.getDirectoryContents("/")
    .then(function(contents) {
        console.log(JSON.stringify(contents, undefined, 4));
    })
    .catch(function (error) {
        console.log(error);
    });
*/

/*var inputstream = fs.createReadStream('file.txt');

inputstream.on('open', function () {
    temp.put("file.txt",inputstream, function (err, info) {
            console.log("UP complete");
            console.log(err , info);
            console.log(info);
            inputstream.close();
        });
})/*



var outputStream = fs.createWriteStream('file.txt');

//401 test ,, switch password
/*
outputStream.on('open', function () {
    temp.get("file.txt",outputStream,function (data) {
            console.log("DOWN complete");
        });
})
*/
//404
/*
outputStream.on('open', function () {
    temp.get("freild.txt",outputStream,function (data) {
        console.log("DOWN complete");
    });
})
*/



var request = require('request');
request = request.defaults({jar: true});
//require('request').debug = true

const cheerio = require('cheerio');

var qs = require('querystring');



var cookie = request.jar();

var formDataPOST = {
    password:'',
    passwordChanged: 'false',
    permission: '31',
    expirteDate:'',
    shareType: '3',
    path : '/Documents'
};

//LOGIN
request.get({
        url: 'https://b2drop.eudat.eu/login',
        auth: {
            user: 'up201404178@fe.up.pt',
            pass: 'xdlol24PSD'
        },
        headers : {
            jar: cookie
        }
    },
    function (error, response, body) {
       // console.log('body',body);

        const $ = cheerio.load(body);
        var token = $('head').attr('data-requesttoken');
        console.log('token',token);

        var queryString = qs.stringify({
            format : 'json',
            password:'',
            passwordChanged: 'false',
            permission: '31',
            expirteDate:'',
            shareType: '3',
            path : '/Documents'
        });
        //GET SHARE LINK
        request.post({
                url: 'https://b2drop.eudat.eu/ocs/v2.php/apps/files_sharing/api/v1/shares' + '?' + queryString,
                headers: {
                    jar: cookie,
                    requesttoken: token
                   // formData: formDataPOST
                }
            },
            function (error, response, body) {
                console.log('error:', error); // Print the error if one occurred
                console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
              //  console.log('body',body);

                queryString = qs.stringify({
                    format: 'json',
                    path: '/Documents',
                    reshares: 'true'
                })

                request.get({
                        url: 'https://b2drop.eudat.eu/ocs/v2.php/apps/files_sharing/api/v1/shares' + '?' + queryString,
                        headers: {
                            jar: cookie,
                            requesttoken: token
                        }
                    },
                    function (error, response, body) {
                        console.log('error:', error); // Print the error if one occurred
                        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received

                        var info =  JSON.parse(body);
                        console.log('url', info.ocs.data[0].url);

                        request.get({
                            url:"https://b2drop.eudat.eu/logout",
                            headers: {
                                requesttoken: token
                            }
                        },
                            function (error, response, body) {
                                console.log('error:', error); // Print the error if one occurred
                                console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                               // console.log('body', body);
                            }
                        )
                    }// Print the HTML for the Google homepage.
                )
            }// Print the HTML for the Google homepage.
        )
    }// Print the HTML for the Google homepage.
)


