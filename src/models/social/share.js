const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;
const Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const Post = require(Pathfinder.absPathInSrcFolder("/models/social/post.js")).Post;
const uuid = require("uuid");

const db_social = Config.getDBByID("social");

const async = require("async");

function Share (object)
{
    /*const self = this;
    self.addURIAndRDFType(object, "share", Share);
    Share.baseConstructor.call(this, object);

    self.copyOrInitDescriptors(object);
    
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

    if(isNull(self.ddr.humanReadableURI))
    {
        self.ddr.humanReadableURI = Config.baseUri + "/shares/" + newId;
    }

    const descriptor = new Descriptor({
        prefixedForm: "rdf:type",
        type: Elements.types.prefixedResource,
        //value : "ddr:Post"
        value: objectType
    });

    /!*var newAdminDescriptor = new Descriptor({
     prefixedForm : "rdf:type",
     type : Elements.types.prefixedResource,
     value : "ddr:Administrator"
     });*!/
    self.insertDescriptors([descriptor], function(err, result){
        //return callback(err, newShare);
        console.log('result:', result);
        console.log('self here is:', self);
        return self;
    }, db_social.graphUri);

    //return self;*/

    const self = this;
    self.addURIAndRDFType(object, "share", Share);
    Share.baseConstructor.call(this, object);

    self.copyOrInitDescriptors(object);

    const newId = uuid.v4();

    if(isNull(self.ddr.humanReadableURI))
    {
        self.ddr.humanReadableURI = Config.baseUri + "/shares/" + newId;
    }

    return self;
}

Share.buildFromInfo = function (info, callback) {
    let newShare = new this(info);
    callback(null, newShare);
};

Share = Class.extend(Share, Post, "ddr:Share");

module.exports.Share = Share;