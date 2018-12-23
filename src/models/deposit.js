
//follows the DC Terms ontology :
// @see http://bloody-byte.net/rdf/dc_owl2dl/dc.ttl
// creator is an URI to the author : http://dendro.fe.up.pt/user/<username>

const moment = require("moment");
const rlequire = require("rlequire");
const request = require("request");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Resource = rlequire("dendro", "src/models/resource.js").Resource;
const Project = rlequire("dendro", "src/models/project.js").Project;
const Folder = rlequire("dendro", "src/models/directory_structure/folder.js").Folder;
const Class = rlequire("dendro", "src//models/meta/class.js").Class;
const Elements = rlequire("dendro", "src//models/meta/elements.js").Elements;
const db = Config.getDBByID();
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const StorageConfig = rlequire("dendro", "src/models/storage/storageConfig.js").StorageConfig;

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

/**
 * Verifies input
 * @param data
 * @param callback
 */
Deposit.createDepositRegistry = function (data, callback) {
    let object = data.registryData;
    let content = data.requestedResource;
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

      let storageConf = new StorageConfig({
        ddr: {
          hasStorageType: "local"
        }
      });

      storageConf.save(function (err, savedConfiguration)
      {
        if (isNull(err)) {
          newRegistry.ddr.hasStorageConfig = savedConfiguration.uri;
          //save deposited contents to dendro
          Deposit.saveContents({newDeposit: newRegistry, content: content, user:data.user}, function(err, msg){
            newRegistry.save(function(err, newRegistry){
              if(!err){
                callback(err, newRegistry);
              } else{
                callback(err, "not good");
              }
            });
          });
        }
      });



    }else{
      callback(1);
    }
};

/**
 * Query to check a limited amount of deposits
 * @param params
 * @param callback
 */
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
        "   ?uri ddr:exportedToPlatform ?platformsUsed . \n" +
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
    /*if(params.platforms){
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


    }*/
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

/**
 *  Check if deposit still exists in outside repository
 * @param deposit metadata to check
 * @param callback function to call after the operation terminates
 */
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
        return https + url;
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

/**
 * Creates a deposit
 * @param object with metadata to be saved
 * @param callback when function finishes
 */
Deposit.createAndInsertFromObject = function(object, callback){
    const self = Object.create(this.prototype);
    self.constructor(object);
    self.save(function(err, newRegistry){
        if(isNull(err)){

        }else{

        }
    })
};

/**
 * Gets a list of all the repositories used for all the existing deposits
 * @param params
 * @param callback
 */
Deposit.getAllRepositories = function(params, callback){
    let query =
      "SELECT ?repository COUNT(?repository) as ?count\n" +
      "FROM [0] \n" +
      "WHERE \n" +
      "{ \n" +
      "   ?uri rdf:type ddr:Registry . \n" +
      "   ?uri ddr:exportedToRepository ?repository . \n" +
      "   ?uri ddr:exportedFromProject ?projused . \n";
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
      query += "   ?uri ddr:privacyStatus [" + i++ + "] . \n";
      variables.push({
        type : Elements.ontologies.ddr.privacyStatus.type,
        value : "public"
      });
    }


    if(params.project){
      query += "   ?projused dcterms:title [" + i++ + "] \n";
      variables.push({
        type: Elements.ontologies.dcterms.title.type,
        value: params.project
      });
    }
    if(params.creator){
      query += "   ?uri dcterms:creator [" + i++ + "] \n";
      variables.push({
        type: Elements.ontologies.dcterms.creator.type,
        value: params.creator
      });
    }
    if(params.platforms){
      query +=
        "   VALUES ?platformsUsed {";

      for(let j = 0; j < params.platforms.length; j++) {
        query += "[" + i++ + "] ";
        variables.push({
          type: Elements.types.string,
          value: params.platforms[j]
        });
      }
      query +=
        "} . \n" +
        "   ?uri ddr:exportedToPlatform ?platformsUsed . \n";


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

/**
 * Saves the exported contents to dendro
 * @param params
 * @param callback
 */
Deposit.saveContents = function(params, callback){
  let newDeposit = params.newDeposit;
  newDeposit.save(function(err, newDeposit){
    const rootFolder = new Folder({
      nie: {
        title: "deposit",
        isLogicalPartOf: newDeposit.uri
      },
      ddr: {
        humanReadableURI: newDeposit.ddr.humanReadableURI + "/data"
      }
    });

    rootFolder.save(function (err, result)
    {
      if (isNull(err))
      {
        newDeposit.ddr.rootFolder = rootFolder.uri;
        newDeposit.nie.hasLogicalPart = rootFolder.uri;

        newDeposit.save(function (err, result)
        {
          if (isNull(err)) {

            let content = params.content;
            //TODO check if file or folder
            content.copyPaste({includeMetadata: true, destinationFolder: rootFolder, user:params.user}, function(err, msg){
              callback(err, newDeposit);
            });

            //pass contents here

          }
          else
          {
            Logger.log("error", "There was an error re-saving the project " + newDeposit.ddr.humanReadableURI + " while creating it: " + JSON.stringify(result));
            callback(err, result);
          }
        });
      }
      else
      {
        Logger.log("error", "There was an error saving the root folder of deposit " + newDeposit.ddr.humanReadableURI + ": " + JSON.stringify(result));
        return callback(err, result);
      }
    });
  });

};


Deposit.prototype.findMetadata = function (callback, typeConfigsToRetain)
{
  const self = this;

  const descriptors = self.getPropertiesFromOntologies(
    null,
    typeConfigsToRetain);

  return callback(null,
    {
      descriptors: descriptors,
      title: self.dcterms.title
    }
  );
};


/**
 * Returns the project associated with the
 * @param callback
 */
Deposit.prototype.getProject = function(callback){
  let self = this;
  let projectUri = self.ddr.exportedFromProject;

  Project.findByUri(projectUri, function(err, project){
    callback(err, project);
  });
};

Deposit = Class.extend(Deposit, Resource, "ddr:Registry");

module.exports.Deposit = Deposit;
