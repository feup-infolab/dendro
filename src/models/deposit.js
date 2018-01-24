
//follows the DC Terms ontology :
// @see http://bloody-byte.net/rdf/dc_owl2dl/dc.ttl
// creator is an URI to the author : http://dendro.fe.up.pt/user/<username>

const path = require("path");
const moment = require("moment");
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
    const uuid = require('uuid');

    //self.uri = Config.baseUri + "/deposit/" + uuid.v4();

    return self;
}

Deposit.createDepositRegistry = function (object, callback) {
    const newRegistry = new Deposit(object);

    const requestedResourceURI = object.ddr.exportedResource;

    const isResource = function (url)
    {
      const regexp = /\/r\/(folder|file)\/.*/;
        return regexp.test(url);
    };

    if(requestedResourceURI instanceof Array && requestedResourceURI.length > 0){
      const resourceUri = requestedResourceURI[0];
      if(isResource(resourceUri)){
        const info = new InformationElement({
          uri: resourceUri,
        });

        info.getOwnerProject(function (err, ie) {
          newRegistry.ddr.exportedFromProject = ie.uri;

          info.getParent(function(err, ie){
            newRegistry.ddr.exportedFromFolder = ie.uri;
            if (isNull(err)) {

              console.log("creating registry from deposit\n" + util.inspect(object));

              newRegistry.save(function(err, newRegistry){
                if(!err){
                  callback(err, newRegistry);
                } else{

                }
              });
            }
          });

        });
      }else{
        return;
      }
    }else{
      return;
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
        "   ?uri ddr:hasExternalUri ?repository . \n" +
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
            value: params.offset * params.limit
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
      "   ?uri ddr:hasExternalUri ?repository . \n" +
      "   ?uri ddr:exportedFromProject ?projused . \n" +
      "  ";

    const ending = "} \n" +
      "GROUP BY ?repository";

    let variables = [
      {
        type: Elements.types.resourceNoEscape,
        value: db.graphUri
      }];

    if(params.self){
      query +=
        "   { \n" +
        "       { \n" +
        "         ?uri ddr:privacyStatus [1] . \n" +
        "       } \n" +
        "       UNION \n" +
        "       { \n" +
        "         ?uri ddr:privacyStatus [2] . \n" +
        "         VALUES ?role { dcterms:creator dcterms:contributor } . \n" +
        "         ?projused ?role [3] . \n" +
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
      query += "    ?uri ddr:privacyStatus [1]";
      variables.push({
        type : Elements.ontologies.ddr.privacyStatus.type,
        value : "public"
      });
    }


    query += ending;

      db.connection.executeViaJDBC(query,variables, function (err, regs){
        callback(err, regs);
      });
};

Deposit = Class.extend(Deposit, Resource, "ddr:Registry");

module.exports.Deposit = Deposit;
