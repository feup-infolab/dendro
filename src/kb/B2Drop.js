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
    let self = this;


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


var userbase64 = new Buffer("hSqBnEXJ9tEKwZr", 'base64');
console.log(userbase64.toString('ascii'));

var temp = new B2Drop("https://b2drop.eudat.eu/public.php/webdav", "hSqBnEXJ9tEKwZr","");
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

var inputstream = fs.createReadStream('file.txt');

inputstream.on('open', function () {
    temp.put("file.txt",inputstream, function (err, info) {
            console.log("UP complete");
            console.log(err , info);
            console.log(info);
            inputstream.close();
        });
})



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
