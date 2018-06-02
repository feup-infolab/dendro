
//follows the DC Terms ontology :
// @see http://bloody-byte.net/rdf/dc_owl2dl/dc.ttl
// creator is an URI to the author : http://dendro.fe.up.pt/user/<username>

const path = require("path");
const moment = require("moment");
const request = require("request");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const DbConnection = require(Pathfinder.absPathInSrcFolder("/kb/db.js")).DbConnection;
const Utils = require(Pathfinder.absPathInPublicFolder("/js/utils.js")).Utils;
const Resource = require(Pathfinder.absPathInSrcFolder("/models/resource.js")).Resource;
const Project = require(Pathfinder.absPathInSrcFolder("/models/project")).Project;
const Folder = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
const File = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/file.js")).File;
const User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
const Ontology = require(Pathfinder.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
const Interaction = require(Pathfinder.absPathInSrcFolder("/models/recommendation/interaction.js")).Interaction;
const Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const InformationElement = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
const Elements = require(Pathfinder.absPathInSrcFolder('/models/meta/elements.js')).Elements;
const db = Config.getDBByID();
const gfs = Config.getGFSByID();

const B2ShareClient = require("@feup-infolab/node-b2share-v2");


const util = require('util');
const async = require("async");
const _ = require("underscore");

function Deposit(object){

    const self = this;
    self.addURIAndRDFType(object, "deposit", Deposit);
    Deposit.baseConstructor.call(this, object);

    self.copyOrInitDescriptors(object);

    let now = moment().format();
    self.dcterms.date = now;
    self.ddr.lastVerifiedDate = now;
    self.ddr.isAvailable = true;

    return self;
}

Deposit.createDepositRegistry = function (object, callback) {
    const newRegistry = new Deposit(object);

    const requestedResourceURI = object.ddr.exportedFromFolder;

    const isResource = function (url)
    {
      const regexp = /\/r\/(folder|file)\/.*/;
        return regexp.test(url);
    };

    if(isNull(object.ddr.lastVerifiedDate)){
      object.ddr.lastVerifiedDate = moment().format();
    }
    object.ddr.isAvailable = true;

    if(isResource(requestedResourceURI)){

      console.log("creating registry from deposit\n" + util.inspect(object));

      newRegistry.save(function(err, newRegistry){
        if(!err){
          callback(err, newRegistry);
        } else{

        }
      });
    }else{
      callback(1);
    }
};

Deposit.createQuery = function(params, callback){
    let query =
        "SELECT DISTINCT ?label ?user ?date ?platformsUsed ?projectTitle ?projused ?creator ?privacy ?uri ?folder ?folderName ?repository \n" +
        "FROM [0] \n"  +
        "WHERE " +
        "{ \n" +
        "   ?uri rdf:type ddr:Registry . \n" +
        "   ?uri ddr:exportedFromProject ?projused . \n" +
        "   ?projused rdf:type ddr:Project . \n" +
        "   ?projused dcterms:title ?projectTitle . \n" +
        "   ?projused ddr:privacyStatus ?privacy . \n" +
        "   ?uri dcterms:creator ?user . \n" +
        "   ?uri dcterms:title ?label . \n" +
        "   ?uri dcterms:date ?date . \n" +
        "   ?uri ddr:exportedFromFolder ?folder . \n" +
        "   ?uri ddr:exportedToRepository ?repository . \n" +
        "   ?folder nie:title ?folderName . \n";

    let i = 1;

    let variables = [
        {
            type: Elements.types.resourceNoEscape,
            value: db.graphUri
        }];

    if(params.self){
        if(isNull(params.private) || params.private === "false"){
            query +=
              "   { \n" +
              "       { \n" +
              "         ?uri ddr:privacyStatus [" + i++ + "] . \n" +
              "       } \n" +
              "       UNION \n" +
              "       { \n" +
              "         ?uri ddr:privacyStatus [" + i++ + "] . \n" +
              "         VALUES ?role { dcterms:creator dcterms:contributor } . \n" +
              "         ?projused ?role [" + i++ + "] . \n" +
              "       } \n" +
              "   } \n";

            variables.push(
              {
                type : Elements.ontologies.ddr.privacyStatus.type,
                value : "public"
              }
            );
        }else {
          query +=
            "    ?uri ddr:privacyStatus [" + i++ + "] . \n" +
            "    VALUES ?role { dcterms:creator dcterms:contributor } . \n" +
            "    ?projused ?role [" + i++ + "] . \n";
        }
        variables = variables.concat([
          {
            type : Elements.ontologies.ddr.privacyStatus.type,
            value : "private"
          },
          {
            type : Elements.ontologies.dcterms.creator.type,
            value : params.self
          }]);
    }else{
      query += "   ?uri ddr:privacyStatus [" + i++ + "] . \n";
      variables.push({
        type : Elements.ontologies.ddr.privacyStatus.type,
        value : "public"
      },);
    }

    let ending =
        "} \n" +
        "ORDER BY DESC(?" + params.order + ") \n" +
        "OFFSET [" + i++ + "] \n" +
        "LIMIT [" + i++ + "]";

    if(params.offset){
        variables.push({
            type: Elements.types.string,
            value: (params.offset * params.limit).toString()
        });
    } else{
        variables.push({
            type: Elements.types.string,
            value: "0"
        });
    }

    if(params.limit){
        variables.push({
            type: Elements.types.string,
            value: params.limit
        });
    } else{
        variables.push({
            type: Elements.types.string,
            value: "10"
        });
    }

    if(params.project){
        query += "  ?projused dcterms:title [" + i++ + "] \n";
        variables.push({
            type: Elements.ontologies.dcterms.title.type,
            value: params.project
        });
    }
    if(params.creator){
        query += "  ?uri dcterms:creator [" + i++ + "] \n";
        variables.push({
            type: Elements.ontologies.dcterms.creator.type,
            value: params.creator
        });
    }
    if(params.platforms){
      query +=
        "    VALUES ?platformsUsed {";

      for(let j = 0; j < params.platforms.length; j++) {
        query += "[" + i++ + "] ";
        variables.push({
          type: Elements.types.string,
          value: params.platforms[j]
        });
      }
      query +=
      "} . \n" +
        "    ?uri ddr:exportedToPlatform ?platformsUsed . \n";


    }
    if(params.repositories){
      query +=
        "    VALUES ?repository { ";

      for(let j = 0; j < params.repositories.length; j++) {
        query += "[" + i++ + "] ";
        variables.push({
          type: Elements.ontologies.ddr.hasExternalUri.type ,
          value: params.repositories[j]
        });
      }
      query +=
        "} . \n" +
        "    ?uri ddr:hasExternalUri ?repository . \n";


    }
    if(params.dateFrom){
        query += "  FILTER (?date > [" + i++ + "]^^xsd:dateTime )\n";
        variables.push({
            type: Elements.types.string,
            value: params.dateFrom,
        });
    }
    if(params.dateTo){
        query += "  FILTER ([" + i++ + "]^^xsd:dateTime > ?date )\n";
        variables.push({
            type: Elements.types.string,
            value: params.dateTo,
        });
    }

    query += ending;
    db.connection.executeViaJDBC(query,variables, function (err, regs){
            callback(err, regs);
        });
};

Deposit.validatePlatformUri = function(deposit, callback){

  const appendPlatformUrl = function({ ddr : {exportedToPlatform : platform, exportedToRepository : url}}){
    const https = "https://";
    switch(platform){
      case "EUDAT B2Share":
        return https + url + "/api/records/";
      case "CKAN":
        return https + url + "/dataset/";
      case "Figshare":
        break;
      case "Zenodo":
        break;
      case "EPrints":
        break;
      default:
        return url;
    }
  };
  //if it has external repository uri
  if(deposit.ddr.lastVerifiedDate){
    const now = moment();
    const lastChecked = moment(deposit.ddr.lastVerifiedDate);
    //calculate difference
    const difference = now.diff(lastChecked, "hours");

    if(difference >= 24){
      //make call to the uri and see if request is 404 or not
      const uri = appendPlatformUrl(deposit) + deposit.dcterms.identifier;
      request(uri, function (error, response, body) {
        if(error || response.statusCode === 404){
          deposit.ddr.isAvailable = false;
        }else if(response.statusCode === 200){
          //status code is acceptable
          deposit.ddr.isAvailable = true;
        }
        deposit.ddr.lastVerifiedDate = now.format();
        deposit.save(function(err, result){
          if(isNull(err)){
            callback(result);
          }else {
            callback(result);
          }
        });
      })
    } else callback(deposit);
  } else callback(deposit);


};

Deposit.createAndInsertFromObject = function(object, callback){
    const self = Object.create(this.prototype);
    self.constructor(object);
    self.save(function(err, newRegistry){
        if(isNull(err)){

        }else{

        }
    })
};

Deposit.getAllRepositories = function(params, callback){
    let query =
      "SELECT ?repository COUNT(?repository) as ?count\n" +
      "FROM [0] \n" +
      "WHERE \n" +
      "{ \n" +
      "   ?uri rdf:type ddr:Registry . \n" +
      "   ?uri ddr:exportedToRepository ?repository . \n" +
      "   ?uri ddr:exportedFromProject ?projused . \n" +
      "  ";

    const ending = "} \n" +
      "GROUP BY ?repository";

    let variables = [
      {
        type: Elements.types.resourceNoEscape,
        value: db.graphUri
      }];

    let i = 1;

    if(params.self){
      query +=
        "   { \n" +
        "       { \n" +
        "         ?uri ddr:privacyStatus [" + i++ + "] . \n" +
        "       } \n" +
        "       UNION \n" +
        "       { \n" +
        "         ?uri ddr:privacyStatus [" + i++ + "] . \n" +
        "         VALUES ?role { dcterms:creator dcterms:contributor } . \n" +
        "         ?projused ?role [" + i++ + "] . \n" +
        "       } \n" +
        "   } \n";

      variables = variables.concat([
        {
          type : Elements.ontologies.ddr.privacyStatus.type,
          value : "public"
        },
        {
          type : Elements.ontologies.ddr.privacyStatus.type,
          value : "private"
        },
        {
          type : Elements.ontologies.dcterms.creator.type,
          value : params.self
        }]);
    } else{
      query += "    ?uri ddr:privacyStatus [" + i++ + "]";
      variables.push({
        type : Elements.ontologies.ddr.privacyStatus.type,
        value : "public"
      });
    }


    if(params.project){
      query += "  ?projused dcterms:title [" + i++ + "] \n";
      variables.push({
        type: Elements.ontologies.dcterms.title.type,
        value: params.project
      });
    }
    if(params.creator){
      query += "  ?uri dcterms:creator [" + i++ + "] \n";
      variables.push({
        type: Elements.ontologies.dcterms.creator.type,
        value: params.creator
      });
    }
    if(params.platforms){
      query +=
        "    VALUES ?platformsUsed {";

      for(let j = 0; j < params.platforms.length; j++) {
        query += "[" + i++ + "] ";
        variables.push({
          type: Elements.types.string,
          value: params.platforms[j]
        });
      }
      query +=
        "} . \n" +
        "    ?uri ddr:exportedToPlatform ?platformsUsed . \n";


    }
    if(params.repositories){
      query +=
        "    VALUES ?repository { ";

      for(let j = 0; j < params.repositories.length; j++) {
        query += "[" + i++ + "] ";
        variables.push({
          type: Elements.ontologies.ddr.hasExternalUri.type ,
          value: params.repositories[j]
        });
      }
      query +=
        "} . \n" +
        "    ?uri ddr:hasExternalUri ?repository . \n";


    }
    if(params.dateFrom){
      query += "  FILTER (?date > [" + i++ + "]^^xsd:dateTime )\n";
      variables.push({
        type: Elements.types.string,
        value: params.dateFrom,
      });
    }
    if(params.dateTo){
    query += "  FILTER ([" + i++ + "]^^xsd:dateTime > ?date )\n";
    variables.push({
      type: Elements.types.string,
      value: params.dateTo,
    });
  }



  query += ending;

      db.connection.executeViaJDBC(query,variables, function (err, regs){
        callback(err, regs);
      });
};

Deposit = Class.extend(Deposit, Resource, "ddr:Registry");

module.exports.Deposit = Deposit;
