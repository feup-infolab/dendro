var Config = function() { return GLOBAL.Config; }();
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;

function Upload (object)
{
    var self = this;
    Upload.baseConstructor.call(this, object);

    if( object.username != null
        &&
        object.filename != null
        &&
        object.parent_folder != null
    )
    {
        self.username = object.username;
        self.filename = object.filename;
        self.parentFolder = object.parent_folder;

        if (self.loaded == null)
        {
            self.loaded = 0;
        }
        else
        {
            self.loaded = object.loaded;
        }

        var uuid = require('node-uuid');
        self.id = uuid.v4();
    }
    else
    {
        throw "Insufficient parameters provided to create a new Upload.";
    }

    return self;
}

Upload.create = function(object, callback)
{
    var self = new Upload(object);

    if(object.tmp_file_dir == null)
    {
        var tmp = require('tmp');
        var path = require('path');

        tmp.dir(
            {
                mode: Config.tempFilesCreationMode,
                dir : Config.tempFilesDir
            },
            function(err, tmp_dir)
            {
                if (!err)
                {
                    self.temp_dir = tmp_dir;
                    self.temp_file = path.join(tmp_dir, object.filename);
                    callback(err, self);
                }
                else
                {
                    callback(err, "Unable to create a temporary directory for upload of file " + object.filename + "by " + object.username);
                }
            });
    }
}

Upload.prototype.destroy = function(callback)
{
    var self = this;

    var rmdir = require('rmdir');

    rmdir(self.temp_dir, function (err, dirs, files) {
        console.log(dirs);
        console.log(files);
        console.log('all files are removed');

        callback(err, dirs, files);
    });
}

Upload.prototype.set_expected = function(expected)
{
    var self = this;
    self.expected = expected;
}

Upload.prototype.write_part = function(buffer, callback)
{
    var self = this;
    var fs = require('fs');
    fs.appendFile(
        self.temp_file,
        buffer,
        {
            'flags': 'a',
            'encoding' : 'utf8'
        },
        function(err, result)
        {
            if(!err)
            {
                callback(err, result);
            }
            else
            {
                callback(1, "There was an error writing to the temporary file on upload of file " + self.filename + " by username " + file.username);
            }
        }
    );
}

Upload.prototype.is_finished = function()
{
    var self = this;
    return (self.loaded >= self.expected);
}

Upload.prototype.get_temp_file_size = function(callback)
{
    var self = this;

    var fs = require('fs');
    var stat = fs.statSync(self.temp_file);
    callback(null, stat.size);
}

Upload = Class.extend(Upload, Class);

module.exports.Upload = Upload;