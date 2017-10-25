const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;

function Upload (object)
{
    const self = this;
    Upload.baseConstructor.call(this, object);

    self.parentFolder = object.parent_folder;

    if( !isNull(object.username)
        &&
        !isNull(object.filename)
        &&
        !isNull(object.expected)
        &&
        typeof object.md5_checksum !== "undefined"
    )
    {
        if(typeof object.username === "string")
        {
            self.username = object.username;
        }
        else
        {
            throw "Invalid username parameter when setting up a new Upload.";
        }

        if(typeof object.filename === "string")
        {
            self.filename = object.filename;
        }
        else
        {
            throw "Invalid filename parameter when setting up a new Upload.";
        }

        if(typeof object.expected === "number")
        {
            self.expected = object.expected;
        }
        else
        {
            throw "Invalid 'expected' parameter when setting up a new Upload. It must be an integer";
        }

        if(typeof object.md5_checksum === "string")
        {
            self.md5_checksum = object.md5_checksum;
        }
        else
        {
            throw "Invalid 'md5_checksum' parameter when setting up a new Upload. It must be a string";
        }

        if (isNull(self.loaded))
        {
            self.loaded = 0;
        }
        else
        {
            if(typeof object.loaded === "number")
            {
                self.loaded = object.loaded;
            }
            else
            {
                throw "Invalid 'loaded' parameter when setting up a new Upload. It must be an integer";
            }
        }

        const uuid = require("uuid");
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
    const self = new Upload(object);

    if(typeof object.tmp_file_dir === "undefined")
    {
        const tmp = require("tmp");
        const path = require("path");

        tmp.dir(
            {
                mode: Config.tempFilesCreationMode,
                dir : Config.tempFilesDir
            },
            function(err, tmp_dir)
            {
                if (isNull(err))
                {
                    self.temp_dir = tmp_dir;
                    self.temp_file = path.join(tmp_dir, object.filename);
                    return callback(err, self);
                }
                else
                {
                    return callback(err, "Unable to create a temporary directory for upload of file " + object.filename + "by " + object.username);
                }
            });
    }
};


Upload.prototype.restart = function(callback)
{
    const self = this;

    fs.unlink(self.temp_file, function(err)
    {
        if(isNull(err))
        {
            self.loaded = 0;
            return callback(null);
        }
        else
        {
            const msg = "Unable to delete file " + self.temp_file + " when restarting the upload " + self.id;
            return callback(err, msg);
        }
    });
};

Upload.prototype.destroy = function(callback)
{
    const self = this;

    const rmdir = require('rmdir');

    rmdir(self.temp_dir, function (err, dirs, files) {
        console.log(dirs);
        console.log(files);
        console.log('all files are removed');

        return callback(err, dirs, files);
    });
};

Upload.prototype.set_expected = function(expected)
{
    const self = this;
    self.expected = expected;
};

Upload.prototype.pipe = function(part, callback)
{
    const self = this;
    const fs = require("fs");

    const targetStream = fs.createWriteStream(
        self.temp_file,
        {
            'flags': 'a'
        }
    );

    let error = null;

    targetStream.on('error', function(err){
        error = err;
    });

    targetStream.on('close', function() {


    });

    targetStream.on('finish', function(){
        if (!isNull(error))
        {
            fs.unlink(file.path);
            return callback(1, "There was an error writing to the temporary file on upload of file " + self.filename + " by username " + file.username, error);
        }
        else
        {
            self.loaded += part.byteCount;
            return callback(null);
        }
    });

    part.pipe(targetStream);
};

Upload.prototype.is_finished = function()
{
    const self = this;
    //console.log("FINISHED " + self.loaded / self.expected + " of file " + self.filename);
    return (self.loaded >= self.expected);
};

Upload.prototype.get_temp_file_size = function(callback)
{
    const self = this;

    const fs = require("fs");
    const stat = fs.statSync(self.temp_file);
    return callback(null, stat.size);
};

Upload = Class.extend(Upload, Class, true, "ddr:Upload");

module.exports.Upload = Upload;