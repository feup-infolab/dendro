var Config = function() { return GLOBAL.Config; }();
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var Upload = require(Config.absPathInSrcFolder("/models/uploads/upload.js")).Upload;

function UploadManager (tmp_files_dir)
{

}

if(UploadManager.__uploads == null)
{
    UploadManager.__uploads = {};
}

UploadManager.add_upload = function(username, filename, size, md5_checksum, parent_folder, callback)
{
    Upload.create(
        {
            username : username,
            filename : filename,
            expected : size,
            md5_checksum  : md5_checksum,
            parent_folder : parent_folder
    }, function(err, upload){
        if(!err)
        {
            var id = upload.id;
            UploadManager.__uploads[id] = upload;
            callback(null, upload);
        }
        else
        {
            callback(err, upload);
        }
    });
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

UploadManager.setUploadExpectedBytes = function(id, bytes)
{
    var upload = UploadManager.__uploads[id];

    if(upload != null)
    {
        upload.set_expected(bytes);
    }
    else
    {
        throw "Upload with id " + id + " not found";
    }
}

UploadManager.writeBytesToUpload = function(id, buffer, callback)
{
    var upload = UploadManager.__uploads[id];

    if(upload != null)
    {
        upload.write_part(buffer, callback);
    }
    else
    {
        callback(1, "Upload with id " + id + " not found");
    }
}

UploadManager.destroy_upload= function (id, callback)
{
    var upload = UploadManager.__uploads[id];

    if(upload != null)
    {
        upload.destroy(callback);
    }
    else
    {
        callback(1, "Upload with id " + id + " not found");
    }
}

UploadManager = Class.extend(UploadManager, Class);

module.exports.UploadManager = UploadManager;