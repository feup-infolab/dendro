var async = require('async');
var path = require('path');
var needle = require('needle');
var _ = require('underscore');

var Config = function() { return GLOBAL.Config; }();

var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
var Interaction = require(Config.absPathInSrcFolder("/models/recommendation/interaction.js")).Interaction;
var File = require(Config.absPathInSrcFolder("/models/directory_structure/file.js")).File;

var DendroInteraction2CSV = require("../../dendro_interaction2csv").DendroInteraction2CSV;
var InteractionAnalyser = require("../models/interaction_analyser.js").InteractionAnalyser;

exports.home = function(req, res)
{
    DendroInteraction2CSV.renderView(res, "csv_generator", {
        title : "CSV Exporting options"
    });
};

var isValidURI = function(uriString)
{
    //from http://www.dzone.com/snippets/validate-url-regexp
    var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;

    return uriString != null && regexp.test(uriString);
};

var streamingExportToCSVFile = function(queryFunction, csvMappingFunction, fileNamePrefix, req, res, callback)
{
    if(!isValidURI(req.query.graph_uri))
    {
        res.status(400).json({
            result : "error",
            title : "Error fetching all interactions",
            message : "No graph URI specified"
        });
    }
    else
    {
        var slug = require('slug');

        var graphUri = req.query.graph_uri;
        var slugifiedGraphURI = slug(graphUri, "-");

        var fileName = fileNamePrefix+slugifiedGraphURI+".csv";
        var headers = {};

        File.createBlankTempFile(fileName, function(err, tempFileAbsPath){
            queryFunction(function(err, results, fetchNextPageCallback){
                if(!err)
                {
                    var fs = require('fs');

                    if(results != null && results instanceof Array && results.length > 0)
                    {
                        async.mapLimit(results, 1, function(result,callback){

                            //for those cases where the serialization function is already present in the result object
                            if(result[csvMappingFunction] != null && typeof result[csvMappingFunction] == "function")
                            {
                                var lineWriteResults = result[csvMappingFunction](headers);
                            }
                            //custom serialization function (non-model-based-object type of results)
                            else if(csvMappingFunction != null && typeof csvMappingFunction == "function")
                            {
                                var lineWriteResults = csvMappingFunction(result, headers);
                            }

                            headers = lineWriteResults.headers;
                            var csvLine = lineWriteResults.csv_line;

                            fs.appendFile(tempFileAbsPath, csvLine, function(err)
                            {
                                callback(err);
                            });
                        }, function(err)
                        {
                            if(!err)
                            {
                                fetchNextPageCallback(err);
                            }
                            else
                            {
                                res.status(500).json({
                                    result : "error",
                                    title : "Error writing interactions to CSV File of all interactions recorded in Dendro",
                                    message : results
                                });
                            }
                        });
                    }
                    else
                    {
                        //finish the file by writing the headers

                        var headersLine = '';
                        headers = Object.keys(headers);
                        for(var i = 0; i < headers.length; i++)
                        {
                            var header = headers[i];
                            headersLine = headersLine + header;
                            if(i < headersLine.length - 1)
                            {
                                headersLine = headersLine + ',';
                            }
                        }

                        fs.appendFile(tempFileAbsPath, headersLine, function(err)
                        {
                            console.log("Headers : " + headersLine);
                            callback(err, fileName, tempFileAbsPath);
                        });
                    }
                }
                else
                {
                    res.status(500).json({
                        result : "error",
                        title : "Error fetching all interactions recorded in Dendro",
                        message : results
                    });
                }
            }, true, graphUri);
        });
    }
};

var sendFile = function(err, fileName, tempFileAbsPath, req, res)
{
    if(!err)
    {
        console.log("Wrote headers to file..." + tempFileAbsPath);
        mimeType = Config.mimeType("csv");
        res.writeHead(200,
            {
                'Content-disposition': 'attachment; filename="' + fileName+"\"",
                'Content-Type': mimeType
            }
        );

        var fs = require('fs');
        var fileStream = fs.createReadStream(tempFileAbsPath);
        fileStream.pipe(res);
    }
    else
    {
        console.log("Error writing headers to file.");
        res.status(500).json({
            result : "error",
            title : "Error writing headers to file.",
            message : "Error writing headers to file."
        });
    }
};


exports.all = function(req, res)
{
    streamingExportToCSVFile(Interaction.all,
        'toCSVLine',
        "all_interactions_",
        req,
        res,
        function(err, fileName, tempFileAbsPath){
            sendFile(err, fileName, tempFileAbsPath, req, res);
        });
};

exports.average_metadata_sheet_size_per_interaction = function(req, res)
{
    streamingExportToCSVFile(InteractionAnalyser.average_metadata_sheet_size_per_interaction,
        function(result){
            var msg = "Average at : " + result.interaction_uri + " : " + result.avg_num_descriptors + ". Type: " + result.interaction_type;
            console.log(msg);

            var csvLine = result.interaction_uri+","+result.avg_num_descriptors+"\n";

            var headers = {
                interaction_uri : 0,
                avg_num_descriptors : 1
            };

            return {
                csv_line: csvLine,
                headers : headers
            };
        },
        "average_metadata_sheet_size_per_interaction_",
        req,
        res,
        function(err, fileName, tempFileAbsPath){
            sendFile(err, fileName, tempFileAbsPath, req, res);
        }
    );
};

exports.average_descriptor_length_per_interaction = function(req, res)
{
    streamingExportToCSVFile(InteractionAnalyser.average_descriptor_size_per_interaction,
        function(result, existingHeaders){

            var headerNames = Object.keys(result);
            var headers = JSON.parse(JSON.stringify(existingHeaders));

            if(headers["interaction_uri"] == null)
            {
                headers["interaction_uri"] = 0;
            }

            if(headers["interaction_date"] == null)
            {
                headers["interaction_date"] = 1;
            }

            /*Update header positions*/
            for(var i = 0; i < headerNames.length; i++)
            {
                var descriptor = new Descriptor({uri : headerNames[i]});

                if(descriptor instanceof Descriptor)
                {
                    var descriptorPrefixedEscaped = descriptor.prefix + "_" + descriptor.shortName;
                    if(headers[descriptorPrefixedEscaped] == null)
                    {
                        headers[descriptorPrefixedEscaped] = Object.keys(headers).length;
                    }
                }
            }

            /*organize values according to their header positions*/
            var values = new Array(Object.keys(headers).length);

            for(var i = 0; i < headerNames.length; i++)
            {
                var descriptor = new Descriptor({uri : headerNames[i]});

                if(descriptor instanceof Descriptor)
                {
                    var descriptorPrefixedEscaped = descriptor.prefix + "_" + descriptor.shortName;

                    var pos = headers[descriptorPrefixedEscaped];
                    values[pos]= result[headerNames[i]];
                }
                else if(result[headerNames[i]] != null)
                {
                    var pos = headers[headerNames[i]];
                    values[pos]= result[headerNames[i]];
                }
            }

            /**produce csv line **/

            var csvLine = "";
            for(var i = 0; i < values.length; i++)
            {
                csvLine = csvLine + values[i];
                if(i < values.length - 1)
                {
                    csvLine = csvLine + ",";
                }
            }

            csvLine = csvLine + "\n";

            console.log(csvLine);

            return {
                csv_line: csvLine,
                headers : headers
            };
        },
        "average_descriptor_size_per_interaction_",
        req,
        res,
        function(err, fileName, tempFileAbsPath){
            sendFile(err, fileName, tempFileAbsPath, req, res);
        }
    );
};

exports.number_of_descriptors_of_each_type_per_interaction = function(req, res)
{
    streamingExportToCSVFile(InteractionAnalyser.number_of_descriptors_of_each_type_per_interaction,
        function(result, existingHeaders){

            var headerNames = [];
            for(var i = 0; i < result.length; i++)
            {
                headerNames.push(result[i].descriptor);
            }

            var headers = JSON.parse(JSON.stringify(existingHeaders));

            if(headers["interaction_uri"] == null)
            {
                headers["interaction_uri"] = 0;
            }

            if(headers["interaction_date"] == null)
            {
                headers["interaction_date"] = 1;
            }

            /*Update header positions*/
            for(var i = 0; i < headerNames.length; i++)
            {
                var descriptor = new Descriptor({uri : headerNames[i]});

                if(descriptor instanceof Descriptor)
                {
                    var descriptorPrefixedEscaped = descriptor.prefix + "_" + descriptor.shortName;
                    if(headers[descriptorPrefixedEscaped] == null)
                    {
                        headers[descriptorPrefixedEscaped] = Object.keys(headers).length;
                    }
                }
            }

            /*organize values according to their header positions*/
            var values = new Array(Object.keys(headers).length);

            for(var i = 0; i < result.length; i++)
            {
                var descriptor = new Descriptor({uri : result[i].descriptor});

                if(descriptor instanceof Descriptor)
                {
                    var descriptorPrefixedEscaped = descriptor.prefix + "_" + descriptor.shortName;

                    var pos = headers[descriptorPrefixedEscaped];
                    values[pos]= result[i]['total_instances'];
                }

                values[0] = result[i]['interaction_uri'];
                values[1] = result[i]['interaction_date'];
            }

            /**produce csv line **/

            var csvLine = "";
            for(var i = 0; i < values.length; i++)
            {
                csvLine = csvLine + values[i];
                if(i < values.length - 1)
                {
                    csvLine = csvLine + ",";
                }
            }

            csvLine = csvLine + "\n";

            console.log(csvLine);

            return {
                csv_line: csvLine,
                headers : headers
            };
        },
        "number_of_descriptors_of_each_type_per_interaction_",
        req,
        res,
        function(err, fileName, tempFileAbsPath){
            sendFile(err, fileName, tempFileAbsPath, req, res);
        }
    );
};

exports.total_number_of_descriptors_per_interaction = function(req, res)
{
    streamingExportToCSVFile(InteractionAnalyser.total_number_of_descriptors_per_interaction,
        function(result){
            var msg = "Total at : " + result.interaction_uri + " : " + result.total_num_descriptors + ". Type: " + result.interaction_type;
            console.log(msg);

            var csvLine = result.interaction_uri+","+result.date_created+","+result.total_num_descriptors+"\n";

            var headers = {
                interaction_uri : 0,
                date_created : 1,
                total_num_descriptors : 2
            };

            return {
                csv_line: csvLine,
                headers : headers
            };
        },
        "total_number_of_descriptors_per_interaction_",
        req,
        res,
        function(err, fileName, tempFileAbsPath){
            sendFile(err, fileName, tempFileAbsPath, req, res);
        }
    );
};