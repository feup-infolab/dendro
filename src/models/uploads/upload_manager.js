const path = require("path");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Class = rlequire("dendro", "src/models/meta/class.js").Class;
const Upload = rlequire("dendro", "src/models/uploads/upload.js").Upload;

let UploadManager = function (tmp_files_dir)
{

};

if (typeof UploadManager.__uploads === "undefined")
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
        throw "Upload with id " + id + " not found";
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
        return callback(1, "Upload with id " + id + " not found");
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
        return callback(1, "Upload with id " + id + " not found");
    }
};

UploadManager = Class.extend(UploadManager, Class, true);

module.exports.UploadManager = UploadManager;
