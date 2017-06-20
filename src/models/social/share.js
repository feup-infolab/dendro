const Config = function () {
    return GLOBAL.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
const DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
const Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
const Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const Event = require(Config.absPathInSrcFolder("/models/social/event.js")).Event;
const Post = require(Config.absPathInSrcFolder("/models/social/post.js")).Post;
const uuid = require('uuid');

const db = function () {
    return GLOBAL.db.default;
}();
const db_social = function () {
    return GLOBAL.db.social;
}();

const gfs = function () {
    return GLOBAL.gfs.default;
}();
const async = require('async');

function Share (object)
{
    Share.baseConstructor.call(this, object);
    const self = this;

    self.copyOrInitDescriptors(object);

    self.rdf.type = "ddr:Share";
    self.rdf.isShare = true;
    
    let objectType;
    if(object.ddr.postURI)
    {
        console.log('is postURI');
        objectType = "ddr:Post";
    }
    else if(object.ddr.fileVersionUri){
        console.log('is fileVersionURI');
        objectType = "ddr:FileVersion";
    }


    const newId = uuid.v4();
    
    if(isNull(self.uri))
    {
        self.uri = "/r/shares/" + newId;
    }

    if(isNull(self.ddr.humanReadableURI))
    {
        self.ddr.humanReadableURI = Config.baseUri + "/shares/" + newId;
    }

    const descriptor = new Descriptor({
        prefixedForm: "rdf:type",
        type: DbConnection.prefixedResource,
        //value : "ddr:Post"
        value: objectType
    });

    /*var newAdminDescriptor = new Descriptor({
     prefixedForm : "rdf:type",
     type : DbConnection.prefixedResource,
     value : "ddr:Administrator"
     });*/
    self.insertDescriptors([descriptor], function(err, result){
        //return callback(err, newShare);
        console.log('result:', result);
        console.log('self here is:', self);
        return self;
    }, db_social.graphUri);

    //return self;
}

/*Share.prototype.save = function (object, callback) {
 var self = Share.baseConstructor.call(this, object);
 console.log('Share.baseConstructor:', Share.baseConstructor);
 //var self = this;
 console.log('self is:', self);
 console.log('will use the share.prototype.save');
 console.log('share uri is:', self.uri);
 console.log('self.baseConstructor:', self.baseConstructor);
 self.baseConstructor.save(function (err, newShare) {
 if(!err)
 {
 //self.insertDescriptors
 var descriptor = [new Descriptor ({prefixedForm : "rdf:type", value : "ddr:Post"})];
 self.insertDescriptors(descriptor, function(err, result){
 return callback(err, newShare);
 });

 //return callback(err, newShare);
 }
 else {
 return callback(err, newShare);
 }
 });
 };*/

//TODO alterar aqui que extends o Post
//Share = Class.extend(Share, Event);
Share = Class.extend(Share, Post);

module.exports.Share = Share;