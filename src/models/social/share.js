var Config = require("../meta/config.js").Config;
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
var Event = require(Config.absPathInSrcFolder("/models/social/event.js")).Event;
var Post = require(Config.absPathInSrcFolder("/models/social/post.js")).Post;
var uuid = require('node-uuid');

var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();

var gfs = function() { return GLOBAL.gfs.default; }();
var async = require('async');

function Share (object)
{
    Share.baseConstructor.call(this, object);
    var self = this;

    self.copyOrInitDescriptors(object);

    self.rdf.type = "ddr:Share";
    self.rdf.isShare = true;



    var objectType;
    if(object.ddr.postURI)
    {
        console.log('is postURI')
        objectType = "ddr:Post";
    }
    else if(object.ddr.fileVersionUri){
        console.log('is fileVersionURI');
        objectType = "ddr:FileVersion";
    }

    if(object.uri != null)
    {
        self.uri = object.uri;
    }
    else
    {
        self.uri = Config.baseUri + "/shares/" + uuid.v4();
    }

    var descriptor = new Descriptor ({
        prefixedForm : "rdf:type",
        type : DbConnection.prefixedResource,
        //value : "ddr:Post"
        value : objectType
    });

    /*var newAdminDescriptor = new Descriptor({
     prefixedForm : "rdf:type",
     type : DbConnection.prefixedResource,
     value : "ddr:Administrator"
     });*/
    self.insertDescriptors([descriptor], function(err, result){
        //callback(err, newShare);
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
 callback(err, newShare);
 });

 //callback(err, newShare);
 }
 else {
 callback(err, newShare);
 }
 });
 };*/

//TODO alterar aqui que extends o Post
//Share = Class.extend(Share, Event);
Share = Class.extend(Share, Post);

module.exports.Share = Share;