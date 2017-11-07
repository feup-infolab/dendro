const chai = require('chai');
const fs = require('fs');
const tmp = require('tmp');
const path = require('path');
const async = require('async');
const chaiHttp = require('chai-http');
const _ = require('underscore');
const recursive = require('recursive-readdir');

chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;
const File = require(Pathfinder.absPathInSrcFolder('models/directory_structure/file.js')).File;
const Elements = require(Pathfinder.absPathInSrcFolder('/models/meta/elements.js')).Elements;
const isNull = require(Pathfinder.absPathInSrcFolder('/utils/null.js')).isNull;

const binaryParser = function (res, cb)
{
    res.setEncoding('binary');
    res.data = '';
    res.on('data', function (chunk)
    {
        res.data += chunk;
    });
    res.on('end', function ()
    {
        cb(null, new Buffer(res.data, 'binary'));
    });
};

const listAllMyProjects = function (jsonOnly, agent, cb)
{
    const path = '/projects/my';
    if (jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const listAllProjects = function (jsonOnly, agent, cb)
{
    const path = '/projects';
    if (jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const getNewProjectPage = function (jsonOnly, agent, cb)
{
    const path = '/projects/new';
    if (jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const createNewProject = function (jsonOnly, agent, projectData, cb)
{
    if (jsonOnly)
    {
        agent
            .post('/projects/new')
            .set('Accept', 'application/json')
            .send(projectData)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post('/projects/new')
            .send(projectData)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const viewProject = function (jsonOnly, agent, projectHandle, cb)
{
    if (jsonOnly)
    {
        agent
            .get('/project/' + projectHandle)
            .set('Accept', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get('/project/' + projectHandle)
            .set('Accept', 'text/html')
            .set('Content-Type', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const updateMetadataWrongRoute = function (jsonOnly, agent, projectHandle, metadata, cb)
{
    if (jsonOnly)
    {
        agent
            .post('/project/' + projectHandle + '?update_metadata')
            .set('Accept', 'application/json')
            .send(metadata)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post('/project/' + projectHandle + '?update_metadata')
            .send(metadata)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const updateMetadataCorrectRoute = function (jsonOnly, agent, projectHandle, folderPath, metadata, cb)
{
    // / project/:handle/data/folderpath?update_metadata
    const path = '/project/' + projectHandle + '/data/' + folderPath + '?update_metadata';
    if (jsonOnly)
    {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send(metadata)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .set('Content-Type', 'application/json')
            .send(metadata)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const getMetadataRecomendationsForProject = function (jsonOnly, agent, projectHandle, cb)
{
    if (jsonOnly)
    {
        agent
            .get('/project/' + projectHandle + '?metadata_recommendations')
            .set('Accept', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get('/project/' + projectHandle + '?metadata_recommendations')
            .set('Accept', 'text/html')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const getRecommendationOntologiesForProject = function (jsonOnly, agent, projectHandle, cb)
{
    // recommendation_ontologies
    const path = '/project/' + projectHandle + '?recommendation_ontologies';
    if (jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set('Accept', 'text/html')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const getProjectRootContent = function (jsonOnly, agent, projectHandle, cb)
{
    if (jsonOnly)
    {
        agent
            .get('/project/' + projectHandle + '?ls')
            .set('Accept', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get('/project/' + projectHandle + '?ls')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const getResourceMetadata = function (jsonOnly, agent, projectHandle, folderPath, cb)
{
    // http://127.0.0.1:3001/project/testproject1/data/folder1?metadata
    const path = '/project/' + projectHandle + '/data/' + folderPath + '?metadata';
    if (jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set('Content-Type', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const getProjectMetadata = function (jsonOnly, agent, projectHandle, cb)
{
    const path = '/project/' + projectHandle + '?metadata';
    if (jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set('Accept', 'text/html')
            .set('Content-Type', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const getProjectMetadataDeep = function (jsonOnly, agent, projectHandle, cb)
{
    const path = '/project/' + projectHandle + '?metadata&deep';
    if (jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set('Accept', 'text/html')
            .set('Content-Type', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const removeDescriptorFromFolder = function (jsonOnly, agent, projectHandle, folderPath, prefixedForm, cb)
{
    getResourceMetadata(jsonOnly, agent, projectHandle, folderPath, function (err, res)
    {
        const descriptors = JSON.parse(res.text).descriptors;
        const newDescriptors = _.reject(descriptors, function (descriptor)
        {
            return descriptor.prefixedForm == prefixedForm;
        });
        updateMetadataCorrectRoute(jsonOnly, agent, projectHandle, folderPath, newDescriptors, function (error, response)
        {
            cb(error, response);
        });
    });
};

const getProjectVersion = function (jsonOnly, agent, projectHandle, version, cb)
{
    // project/:handle?version
    const path = '/project/' + projectHandle;
    if (jsonOnly)
    {
        agent
            .get(path)
            .query({version: version})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .query({version: version})
            .set('Content-Type', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const importProjectHTMLPage = function (jsonOnly, agent, cb)
{
    const path = '/projects/import';
    if (jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const importProject = function (jsonOnly, agent, project, cb)
{
    // /projects/import
    const path = '/projects/import';
    if (jsonOnly)
    {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .query({ imported_project_handle: project.handle})
            .query({ imported_project_title: project.title})
            .attach('file', project.backup_path)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .set('Content-Type', 'application/json')
            .query({ imported_project_handle: project.handle})
            .attach('file', project.backup_path)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const getRequestProjectAccessPage = function (jsonOnly, agent, projectHandle, cb)
{
    // /project/:handle/request_access
    const path = '/project/' + projectHandle + '?request_access';
    if (jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set('Content-Type', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const requestAccessToProject = function (jsonOnly, agent, projectHandle, cb)
{
    // /project/:handle/request_access
    const path = '/project/' + projectHandle + '?request_access';
    if (jsonOnly)
    {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .set('Content-Type', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const deleteProject = function (jsonOnly, agent, projectHandle, cb)
{
    // /project/:handle/delete
    const path = '/project/' + projectHandle + '?delete';
    if (jsonOnly)
    {
        agent
            .delete(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .delete(path)
            .set('Content-Type', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const undeleteProject = function (jsonOnly, agent, projectHandle, cb)
{
    // /project/:handle/undelete
    const path = '/project/' + projectHandle + '?undelete';
    if (jsonOnly)
    {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .set('Content-Type', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const createFolderInProjectRoot = function (jsonOnly, agent, projectHandle, folderName, cb)
{
    // /project/:handle?mkdir
    const path = '/project/' + projectHandle;
    if (jsonOnly)
    {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .query({mkdir: folderName})
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .set('Accept', 'text/html')
            .set('Content-Type', 'application/json')
            .query({mkdir: folderName})
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const getProjectRecentChanges = function (jsonOnly, agent, projectHandle, cb)
{
    // / project/:handle?recent_changes
    const path = '/project/' + projectHandle + '?recent_changes';
    if (jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set('Accept', 'text/html')
            .set('Content-Type', 'application/json')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const administer = function (agent, modify, projectData, projectHandle, cb)
{
    if (modify)
    {
        agent
            .post('/project/' + projectHandle + '?administer')
            .send(projectData)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get('/project/' + projectHandle + '?administer')
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const bagit = function (agent, projectHandle, cb)
{
    agent
        .get('/project/' + projectHandle + '?bagit')
        .buffer()
        .parse(binaryParser)
        .end(function (err, res)
        {
            cb(err, res);
        });
};

const getProjectContributors = function (agent, projectHandle, cb)
{
    // project/proj1?get_contributors
    const path = '/project/' + projectHandle + '?get_contributors';
    agent
        .get(path)
        .end(function (err, res)
        {
            cb(err, res);
        });
};

const getContentsOfFile = function (zipPath, callback)
{
    File.unzip(zipPath, function (err, pathOfUnzippedContents)
    {
        let contentsOfZippedFile = '';
        recursive(pathOfUnzippedContents, function (err, files)
        {
            if (!err)
            {
                files = files.sort();
                for (let i = 0; i < files.length; i++)
                {
                    let file = files[i];
                    file = files[i].replace(pathOfUnzippedContents, '');
                    contentsOfZippedFile += file + '\n';
                }

                callback(null, contentsOfZippedFile);
            }
            else
            {
                callback(err);
            }
        });
    });
};

const getProjectBagitMetadataFromBackup = function (pathOfUnzippedContents)
{
    const metadataFilePath = path.join(pathOfUnzippedContents, 'bag-info.txt');
    return fs.readFileSync(metadataFilePath, 'utf8');
};

const getFileTreeMetadataFromBackup = function (pathOfUnzippedContents, projectHandle)
{
    const metadataFilePath = path.join(pathOfUnzippedContents, 'data', projectHandle, 'metadata.json');
    metadataContents = fs.readFileSync(metadataFilePath, 'utf8');

    const regex = RegExp('[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}', 'g');

    metadataContents = JSON.parse(metadataContents);

    function getTitle (obj)
    {
        if (obj.metadata !== null)
        {
            for (let i = 0; i < obj.metadata.length; i++)
            {
                if (obj.metadata[i].prefixedForm === 'nie:title')
                {
                    return obj.metadata[i].value;
                }
            }

            return null;
        }
        return null;
    }

    function replaceAllUrisWithTitles (obj)
    {
        const objTitle = getTitle(obj);
        obj.resource = objTitle;

        if (obj.children instanceof Array)
        {
            for (let i = 0; i < obj.children.length; i++)
            {
                replaceAllUrisWithTitles(obj.children[i]);
            }
        }

        return obj;
    }

    function replaceAllUrisWithDummyValue (obj)
    {
        for (let property in obj)
        {
            if (typeof obj[property] === 'string' && obj[property].match(regex))
            {
                obj[property] = 'an_uri';
            }
            else
            {
                if (typeof obj[property] === 'object')
                {
                    replaceAllUrisWithDummyValue(obj[property]);
                }
            }
        }

        return obj;
    }

    function sortChildrenByTitle (obj)
    {
        if (obj.children instanceof Array)
        {
            obj.children = obj.children.sort(function (a, b)
            {
                return a.resource < b.resource;
            });

            for (let i = 0; i < obj.children.length; i++)
            {
                sortChildrenByTitle(obj.children[i]);
            }
        }

        return obj;
    }

    function sortMetadataValuesAlphabetically (obj)
    {
        if (obj.children instanceof Array)
        {
            _.map(obj.children, function (child)
            {
                child.metadata;
            });

            obj.children = obj.children.sort(function (a, b)
            {
                return a.resource < b.resource;
            });

            for (let i = 0; i < obj.children.length; i++)
            {
                sortChildrenByTitle(obj.children[i]);
            }
        }

        return obj;
    }

    metadataContents = replaceAllUrisWithTitles(metadataContents);
    metadataContents = replaceAllUrisWithDummyValue(metadataContents);
    metadataContents = sortChildrenByTitle(metadataContents);
    metadataContents = sortMetadataValuesAlphabetically(metadataContents);

    return metadataContents;
};

const metadataMatchesBackup = function (project, bodyBuffer, callback)
{
    const parseBagItMetadata = function (result)
    {
        const split = result.split('\n');
        const parsed = {};

        function sortObject (obj)
        {
            return Object.keys(obj)
                .sort().reduce((a, v) =>
                {
                    a[v] = obj[v];
                    return a;
                }, {});
        }

        for (let i = 0; i < split.length; i++)
        {
            if (split !== '')
            {
                let piece = split[i];
                let indexOfColon = piece.indexOf(':');

                let descriptor = piece.substr(0, indexOfColon);
                let value = piece.substr(indexOfColon + 1);

                parsed[descriptor] = value;
            }
        }

        return sortObject(parsed);
    };

    tmp.dir(
        {
            mode: Config.tempFilesCreationMode,
            dir: Config.tempFilesDir
        },
        function (err, tempFolderPath)
        {
            if (!err)
            {
                const tempBackupFilePath = path.join(tempFolderPath, project.handle + '.zip');
                const mockBackupFilePath = project.backup_path;
                fs.writeFileSync(tempBackupFilePath, bodyBuffer);

                async.mapSeries(
                    [tempBackupFilePath, mockBackupFilePath],
                    function (zipFilePath, callback)
                    {
                        File.unzip(zipFilePath, function (err, pathOfUnzippedContents)
                        {
                            projectBagItMetadata = getProjectBagitMetadataFromBackup(pathOfUnzippedContents);
                            projectTreeMetadata = getFileTreeMetadataFromBackup(pathOfUnzippedContents, project.handle);
                            callback(null, {
                                bagitMetadata: projectBagItMetadata,
                                projectTreeMetadata: projectTreeMetadata
                            });
                        });
                    },
                    function (err, results)
                    {
                        if (!err)
                        {
                            const returnedBagitMetadata = parseBagItMetadata(results[0].bagitMetadata);
                            const mockupBagitMetadata = parseBagItMetadata(results[1].bagitMetadata);
                            const bagitMetadataIsValid = (JSON.stringify(mockupBagitMetadata) === JSON.stringify(returnedBagitMetadata));

                            if (!bagitMetadataIsValid)
                            {
                                console.error(JSON.stringify(returnedBagitMetadata, null, 4));
                            }

                            const returnedProjectTreeMetadata = results[0].projectTreeMetadata;
                            const mockupProjectTreeMetadata = results[1].projectTreeMetadata;

                            const deepEqual = require('deep-equal');
                            const fileTreeMetadataIsValid = deepEqual(returnedProjectTreeMetadata, mockupProjectTreeMetadata);

                            const diff = require('deep-diff').diff;
                            const fileTreeMetadataDiffs = diff(returnedProjectTreeMetadata, mockupProjectTreeMetadata);

                            if (!fileTreeMetadataIsValid)
                            {
                                console.error(JSON.stringify(fileTreeMetadataDiffs, null, 4));
                            }

                            callback(null, bagitMetadataIsValid && fileTreeMetadataIsValid);
                        }
                        else
                        {
                            callback(err, results);
                        }
                    }
                );
            }
            else
            {
                callback(err);
            }
        });
};

const contentsMatchBackup = function (project, bodyBuffer, callback)
{
    const fs = require('fs');
    const tmp = require('tmp');
    const path = require('path');

    tmp.dir(
        {
            mode: Config.tempFilesCreationMode,
            dir: Config.tempFilesDir
        },
        function (err, tempFolderPath)
        {
            if (!err)
            {
                const tempBackupFilePath = path.join(tempFolderPath, project.handle + '.zip');
                const mockBackupFilePath = project.backup_path;
                fs.writeFileSync(tempBackupFilePath, bodyBuffer);

                getContentsOfFile(tempBackupFilePath, function (err1, result1)
                {
                    getContentsOfFile(mockBackupFilePath, function (err2, result2)
                    {
                        if (!err1 && !err2)
                        {
                            if (result1 !== result2)
                            {
                                console.error(result1);
                                console.error(result2);
                            }

                            callback(null, result1 === result2);
                        }
                        else
                        {
                            callback(1);
                        }
                    });
                });
            }
            else
            {
                callback(err);
            }
        });
};

const countProjectTriples = function (projectUri, callback)
{
    const self = this;

    const query =
        'SELECT COUNT(*) as ?resource_count \n' +
        'FROM [0] \n' +
        'WHERE ' +
        '{ \n' +
        '   { \n' +
        '       [1] ?p1 ?o1 . \n' +
        '   } \n' +
        '   UNION \n' +
        '   { \n' +
        '       ?s ?p [1] . \n' +
        '   } \n' +
        '} \n';

    const db = Config.getDBByID();
    db.connection.executeViaJDBC(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.types.resource,
                value: projectUri
            }
        ],
        function (err, result)
        {
            if (isNull(err))
            {
                if (result instanceof Array && result.length === 1)
                {
                    return callback(null, parseInt(result[0].resource_count));
                }
                return callback(1, 'invalid result retrieved when querying for project resource count');
            }
            return callback(err, -1);
        });
};

const countProjectFilesInGridFS = function (projectUri, callback, customBucket)
{
    const self = this;

    let collectionName;
    if (!isNull(customBucket))
    {
        collectionName = customBucket;
    }
    else
    {
        collectionName = 'fs.files';
    }

    /**
     * YOU NEED MONGODB 10GEN to run this, or it will give errors.
     */

    const gfs = Config.getGFSByID();
    gfs.connection.db.collection(collectionName, function (err, collection)
    {
        if (isNull(err))
        {
            collection.count(
                {
                    'metadata.project.uri': projectUri
                },
                function (err, result)
                {
                    if (isNull(err))
                    {
                        if (!isNull(result) && typeof result === 'number')
                        {
                            return callback(null, result);
                        }
                        return callback(null, 0);
                    }
                    console.error('* YOU NEED MONGODB 10GEN to run this aggregate function, or it will give errors. Error retrieving project size : ' + JSON.stringify(err) + JSON.stringify(result));
                    return callback(1, 'Error retrieving project size : ' + JSON.stringify(err) + JSON.stringify(result));
                });
        }
        else
        {
            console.error('* YOU NEED MONGODB 10GEN to run this aggregate function, or it will give errors. Error retrieving project size : ' + JSON.stringify(err) + JSON.stringify(result));
            return callback(1, 'Error retrieving files collection : ' + collection);
        }
    });
};

const getProjectUriFromHandle = function (agent, projectHandle, callback)
{
    listAllMyProjects(true, agent, function (err, res)
    {
        const myProjects = res.body.projects;
        const project = _.find(myProjects, function (project)
        {
            return project.ddr.handle === projectHandle;
        });

        callback(err, (project) ? project.uri : null);
    });
};

module.exports = {
    updateMetadataCorrectRoute: updateMetadataCorrectRoute,
    listAllMyProjects: listAllMyProjects,
    listAllProjects: listAllProjects,
    getNewProjectPage: getNewProjectPage,
    createNewProject: createNewProject,
    viewProject: viewProject,
    updateMetadataWrongRoute: updateMetadataWrongRoute,
    getMetadataRecomendationsForProject: getMetadataRecomendationsForProject,
    getProjectRootContent: getProjectRootContent,
    getResourceMetadata: getResourceMetadata,
    removeDescriptorFromFolder: removeDescriptorFromFolder,
    getProjectRecentChanges: getProjectRecentChanges,
    getProjectVersion: getProjectVersion,
    importProjectHTMLPage: importProjectHTMLPage,
    importProject: importProject,
    getRequestProjectAccessPage: getRequestProjectAccessPage,
    requestAccessToProject: requestAccessToProject,
    deleteProject: deleteProject,
    undeleteProject: undeleteProject,
    createFolderInProjectRoot: createFolderInProjectRoot,
    administer: administer,
    bagit: bagit,
    getProjectContributors: getProjectContributors,
    getRecommendationOntologiesForProject: getRecommendationOntologiesForProject,
    getProjectMetadata: getProjectMetadata,
    getProjectBagitMetadata: getProjectBagitMetadataFromBackup,
    getProjectMetadataDeep: getProjectMetadataDeep,
    contentsMatchBackup: contentsMatchBackup,
    metadataMatchesBackup: metadataMatchesBackup,
    countProjectTriples: countProjectTriples,
    countProjectFilesInGridFS: countProjectFilesInGridFS,
    getProjectUriFromHandle: getProjectUriFromHandle
};
