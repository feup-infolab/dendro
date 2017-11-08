const path = require('path');
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;

const isNull = require(Pathfinder.absPathInSrcFolder('/utils/null.js')).isNull;
const Class = require(Pathfinder.absPathInSrcFolder('/models/meta/class.js')).Class;
const Upload = require(Pathfinder.absPathInSrcFolder('/models/uploads/upload.js')).Upload;

let UploadManager = function (tmp_files_dir)
{

};

if (typeof UploadManager.__uploads === 'undefined')
{
    UploadManager.__uploads = {};
}

UploadManager.add_upload = function (username, filename, size, md5_checksum, parent_folder, callback)
{
    Upload.create(
        {
            username: username,
            filename: filename,
            expected: size,
            md5_checksum: md5_checksum,
            parent_folder: parent_folder
        }, function (err, upload)
        {
            if (isNull(err))
            {
                const id = upload.id;
                UploadManager.__uploads[id] = upload;
                return callback(null, upload);
            }
            return callback(err, upload);
        });
};

UploadManager.get_upload_by_id = function (id)
{
    return UploadManager.__uploads[id];
};

UploadManager.finished = function (id)
{
    const upload = UploadManager.__uploads[id];
    if (!isNull(upload))
    {
        return null;
    }
    return upload.finished();
};

UploadManager.setUploadExpectedBytes = function (id, bytes)
{
    const upload = UploadManager.__uploads[id];

    if (!isNull(upload))
    {
        upload.set_expected(bytes);
    }
    else
    {
        throw 'Upload with id ' + id + ' not found';
    }
};

UploadManager.writeBytesToUpload = function (id, buffer, callback)
{
    const upload = UploadManager.__uploads[id];

    if (!isNull(upload))
    {
        upload.write_part(buffer, callback);
    }
    else
    {
        return callback(1, 'Upload with id ' + id + ' not found');
    }
};

UploadManager.destroy_upload = function (id, callback)
{
    const upload = UploadManager.__uploads[id];

    if (!isNull(upload))
    {
        upload.destroy(callback);
    }
    else
    {
        return callback(1, 'Upload with id ' + id + ' not found');
    }
};

UploadManager = Class.extend(UploadManager, Class, true);

module.exports.UploadManager = UploadManager;
