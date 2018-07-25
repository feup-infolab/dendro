const path = require("path");
const _ = require("underscore");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;

const InformationElement = rlequire("dendro", "src/models/directory_structure/information_element.js").InformationElement;
const Resource = rlequire("dendro", "src/models/resource.js").Resource;
const deposits = rlequire("dendro", "src/controllers/deposits");
const projects = rlequire("dendro", "src/controllers/projects");


const nodemailer = require("nodemailer");
const flash = require("connect-flash");
const async = require("async");
const contentDisposition = require("content-disposition");

exports.show = function (req, res)
{
  let uri = req.url;
  InformationElement.findByUri(uri, function(err, info){
    let parentUri = info.nie.isLogicalPartOf;
    let depositRegex = Resource.getResourceRegex("deposit").exec(parentUri);
    let projectRegex = Resource.getResourceRegex("project").exec(parentUri);
    if(depositRegex){
      deposits.show(req, res);
    }else if(projectRegex){
      projects.show(req, res);
    }
  });
};
