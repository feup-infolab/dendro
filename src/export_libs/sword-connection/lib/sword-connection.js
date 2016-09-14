/**
 * Created by Filipe on 09/07/2014.
 */
var jarPath = './export_libs/sword-connection/sword2-client.jar'; //attention with this path, relative path from the root project

function SwordConnection(user, password, serviceDocumentRef){
    var newConnection = Object.create(SwordConnection);
    newConnection.user = user;
    newConnection.password = password;
    newConnection.serviceDocRef = serviceDocumentRef;

    return newConnection;
}
executeCommand = function(command,callback){
    var exec = require('child_process').exec;

    var child = exec(command, function (error, stdout, stderr) {
        if(error)
        {
            callback(true,stderr, null);
        } else {
            var data = JSON.parse(stdout);

            if(data.success == 'true'){
                callback(false,data.message, data.response);
            }
            else{
                if('message' in data){
                    callback(true, data.message, null);
                }
                else{
                    callback(true, null,null);
                }

            }
        }
    });
}
SwordConnection.listCollections = function(callback){

    var option = "list-collections";
    var command = "java -jar " + jarPath + " " + option + " " + "sword" + " " + this.user + " " + this.password + " " + this.serviceDocRef;

    executeCommand(command,callback);
};
SwordConnection.sendFile = function(repositoryType, filePath,collectionRef,sendMetadata,metadataJsonRef,callback){
    var option = "send-file";
    var command = "java -jar " + jarPath + " " + option +" " +repositoryType + " " + this.user + " " + this.password + " " + this.serviceDocRef;
    command += " " + filePath + " " + collectionRef + " " + sendMetadata;
    if(sendMetadata)
        command += " " + metadataJsonRef;
    executeCommand(command,callback);
};
module.exports.SwordConnection = SwordConnection;