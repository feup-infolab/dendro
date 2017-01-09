var Config = function() { return GLOBAL.Config; }();
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var Upload = require(Config.absPathInSrcFolder("/models/uploads/upload.js")).Upload;

function UploadManager ()
{
}

if(UploadManager.__uploads == null)
{
    UploadManager.__uploads = {};
}

UploadManager.add_upload = function(username, filename, parent_folder)
{
    var newUpload = new Upload(
        {
            username : username,
            filename : filename,
            parent_folder : parent_folder
    });

    var id = newUpload.id;
    UploadManager.__uploads[id] = newUpload;
    return newUpload;
}


UploadManager.get_upload_by_id = function(id)
{
    return UploadManager.__uploads[id];
}

UploadManager.finished = function(id)
{
    var upload = UploadManager.__uploads[id];
    if(upload != null)
    {
        return null;
    }
    else
    {
        return upload.finished();
    }
}

UploadManager = Class.extend(UploadManager, Class);

module.exports.UploadManager = UploadManager;