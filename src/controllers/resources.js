const path = require("path");
const _ = require("underscore");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;

const InformationElement = rlequire("dendro", "src/models/directory_structure/information_element.js").InformationElement;
const Resource = rlequire("dendro", "src/models/resource.js").Resource;
const Project = rlequire("dendro", "src/models/project.js").Project
const Deposit = rlequire("dendro", "src/models/deposit.js").Deposit;
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
    if(isNull(err)){
      info.getOwnerProject(function(err, project){
        if(isNull(err) && !isNull(project) && project instanceof Project){
          projects.show(req, res);
        }else{
          info.getOwnerDeposit(function(err, deposit){
            if(isNull(err) && !isNull(deposit) && deposit instanceof  Deposit){
              deposits.show(req, res);
            }
          });
        }
      });
    }
  });
};
