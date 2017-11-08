const fs = require("fs");
const async = require("async");
const path = require("path");
const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Serializers = require(Pathfinder.absPathInSrcFolder("/utils/serializers.js"));

const deleteFolderRecursive = function (path)
{
    let files = [];
    if (fs.existsSync(path))
    {
        files = fs.readdirSync(path);
        files.forEach(function (file, index)
        {
            const curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory())
            { // recurse
                deleteFolderRecursive(curPath);
            }
            else
            { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

const createPackage = function (parentFolderPath, folder, callback)
{
    const folderToZip = path.join(parentFolderPath, folder.nie.title);
    const outputFilenameZip = path.join(parentFolderPath, folder.nie.title + ".zip");
    const outputFilenameRDF = path.join(parentFolderPath, folder.nie.title + ".rdf");
    const outputFilenameTXT = path.join(parentFolderPath, folder.nie.title + ".txt");
    const outputFilenameJSON = path.join(parentFolderPath, folder.nie.title + ".json");

    const filesToIncludeInPackage = [];
    const extraFiles = [];

    async.series([
        function (cb)
        {
            fs.readdir(folderToZip, function (err, files)
            {
                if (isNull(err))
                {
                    async.mapSeries(files, function (file, callback)
                    {
                        const absPathToChild = path.join(folderToZip, file);
                        fs.stat(absPathToChild, function (err, stats)
                        {
                            if (!stats.isDirectory())
                            {
                                filesToIncludeInPackage.push(absPathToChild);
                            }
                            return callback(err, stats);
                        });
                    }, function (err, results)
                    {
                        cb(err);
                    });
                }
                else
                {
                    cb(err, files);
                }
            });
        },
        function (cb)
        {
            const archiver = require("archiver");
            const output = fs.createWriteStream(outputFilenameZip);
            const zipArchive = archiver("zip", {
                zlib: {level: 9} // Sets the compression level.
            });
            filesToIncludeInPackage.push(outputFilenameZip);
            extraFiles.push(outputFilenameZip);
            folder.findMetadataRecursive(function (err, result)
            {
                if (isNull(err))
                {
                    const metadataRDF = require("pretty-data").pd.xml(Serializers.metadataToRDF(result));
                    fs.writeFile(outputFilenameRDF, metadataRDF, "utf-8", function (err)
                    {
                        if (isNull(err))
                        {
                            console.log("The file " + outputFilenameRDF + " was saved!");
                            filesToIncludeInPackage.push(outputFilenameRDF);
                            extraFiles.push(outputFilenameRDF);
                            // add the metadata rdf file to the zip folder
                            zipArchive.file(outputFilenameRDF, { name: folder.nie.title + ".rdf" });
                            const metadataTXT = Serializers.metadataToText(result);
                            fs.writeFile(outputFilenameTXT, metadataTXT, "utf-8", function (err)
                            {
                                if (isNull(err))
                                {
                                    console.log("The file " + outputFilenameTXT + " was saved!");
                                    filesToIncludeInPackage.push(outputFilenameTXT);
                                    extraFiles.push(outputFilenameTXT);
                                    // add the metadata txt file to the zip folder
                                    zipArchive.file(outputFilenameTXT, { name: folder.nie.title + ".txt" });
                                    const metadataJSON = require("pretty-data").pd.json(JSON.stringify(result));
                                    fs.writeFile(outputFilenameJSON, metadataJSON, "utf-8", function (err)
                                    {
                                        if (isNull(err))
                                        {
                                            console.log("The file " + outputFilenameJSON + " was saved!");
                                            filesToIncludeInPackage.push(outputFilenameJSON);
                                            extraFiles.push(outputFilenameJSON);
                                            // add the metadata JSON file to the zip folder
                                            zipArchive.file(outputFilenameJSON, { name: folder.nie.title + ".json" });
                                            zipArchive.pipe(output);
                                            zipArchive.directory(folderToZip, false);
                                            zipArchive.finalize(function (err, bytes)
                                            {
                                                if (err)
                                                {
                                                    cb(true, err);
                                                }
                                            });
                                            output.on("close", function ()
                                            {
                                                console.log("Done with the zip", folderToZip);
                                                cb(null, null);
                                            });
                                        }
                                        else
                                        {
                                            console.log(err);
                                            cb(true, null);
                                        }
                                    });
                                }
                                else
                                {
                                    console.log(err);
                                    cb(true, null);
                                }
                            });
                        }
                        else
                        {
                            console.log(err);
                            cb(true, null);
                        }
                    });
                }
                else
                {
                    const msg = "Error finding metadata in " + folder.uri;
                    console.error(msg);
                    cb(true, null);
                }
            });
        }
    ],
    function (err, results)
    {
        if (isNull(err))
        {
            return callback(err, filesToIncludeInPackage, extraFiles);
        }
        return callback(err, results);
    });
};

module.exports = {
    deleteFolderRecursive,
    createPackage
};
