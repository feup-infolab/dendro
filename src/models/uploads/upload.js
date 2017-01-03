function Upload (object)
{
    var self = this;
    var uuid = require('node-uuid');

    if( object.username != null
        &&
        object.filename != null
        &&
        object.parent_folder != null)
    {
        self.username = object.username;
        self.filename = object.uri;
        self.parentFolder = object.uri;
        self.loaded = 0;
        self.id = uuid.v4();
        return self;
    }
    else
    {
        throw "An upload must have a owner username, a filename and a parent folder."
    }
}

exports.Upload = Upload;