/**
 * Created by Fábio on 31/03/2016.
 */

var Config = function() { return GLOBAL.Config; }();

B2Share.apiURL = Config.eudatBaseUrl + "/api";
B2Share.depositionURL = B2Share.apiURL + "/deposition/";
B2Share.depositionsURL = B2Share.apiURL + "/depositions";
B2Share.depositionFilesPath =  "/files";
B2Share.commitDepositionPath = "/commit";
B2Share.recordPath = Config.eudatBaseUrl + "/record";

var request = require('request');

function B2Share(accessToken){
    if(accessToken == null){
        throw "Undefined Access Token";
    }
    else{
        this.accessToken = accessToken;
    }
};

B2Share.prototype.createDeposition = function(callback){
    request.post({
        url: B2Share.depositionsURL + "?access_token=" + this.accessToken,
        rejectUnauthorized: false
    }, function(error, result, deposition){
        if(error){
            console.log("[B2SHARE] Deposition Error: " + error);
            callback(true);
        }
        else{
            if(result.statusCode != 201){
                console.log("[B2SHARE] Deposition Error: " + JSON.stringify(result));
                callback(true);
            }
            else{
                console.log("[B2SHARE] Deposition Created");
                callback(false, deposition);
            }
        }
    });
};

B2Share.prototype.uploadFileToDeposition = function(depositionID, file, callback){
    var fs = require('fs');
    var r = request.post({
        url: B2Share.depositionURL + depositionID + B2Share.depositionFilesPath + "?access_token=" + this.accessToken,
        json: true,
        rejectUnauthorized: false
    }, function(error, result, data){
        if(error){
            console.log("[B2SHARE] File Upload error: " + error);
            callback(true);
        }
        else{
            if(result.statusCode != 200){
                console.log("[B2SHARE] File Upload error:" + JSON.stringify(result));
                callback(true);
            }
            else{
                console.log("[B2SHARE] Success Uploading File" );
                callback(false);
            }
        }
    });

    var form = r.form();
    form.append('file', fs.createReadStream(file));
};

B2Share.prototype.uploadMultipleFilesToDeposition = function (depositionID, files, callback) {
    var async = require('async');
    var self = this;

    async.each(files, function(file, callback){
        self.uploadFileToDeposition(depositionID, file, function(error){
            if(error){
                callback(true);
            }
            else{
                callback(false);
            }
        });
    }, function(error){
        if(error){
            callback(true);
        }
        else{
            callback(false);
        }
    });
};

B2Share.prototype.depositionPublish = function(depositionID, metadata, callback){
    request.post({
        url: B2Share.depositionURL + depositionID + B2Share.commitDepositionPath + "?access_token=" + this.accessToken,
        json: true,
        body: metadata,
        rejectUnauthorized: false
    }, function(error, result, data){
        if(error){
            console.log("[B2SHARE] Error Publishing Dataset: " + error);
            callback(true);
        }
        else{
            if(result.statusCode != 201){
                console.log("[B2SHARE] Error Publishing Dataset:" + JSON.stringify(result));
                callback(true);
            }
            else{
                console.log("[B2SHARE] Success Committing Deposit: " + JSON.stringify(result));
                callback(false, result);
            }
        }
    });
};

module.exports = B2Share;