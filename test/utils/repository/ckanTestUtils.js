const Pathfinder = global.Pathfinder;
const chai = require('chai');
const chaiHttp = require('chai-http');
const CKAN = require('ckan');
const CkanUtils = require(Pathfinder.absPathInSrcFolder('/utils/datasets/ckanUtils.js'));
const async = require('async');
const slug = require('slug');
chai.use(chaiHttp);

const createCkanOrganization = function (jsonOnly, agent, ckanRepoData, organizationData, cb)
{
    const client = new CKAN.Client(ckanRepoData.ddr.hasExternalUrl, ckanRepoData.ddr.hasAPIKey);
    client.action('organization_create',
        {
            name: organizationData.name,
            id: organizationData.id
        },
        function (err, result)
        {
            cb(err, result);
        });
};

const deleteCkanOrganization = function (jsonOnly, agent, ckanRepoData, organizationData, cb)
{
    const client = new CKAN.Client(ckanRepoData.ddr.hasExternalUrl, ckanRepoData.ddr.hasAPIKey);
    // organization_purge
    // client.action("organization_delete",
    client.action('organization_delete',
        {
            id: organizationData.id
        },
        function (err, result)
        {
            cb(err, result);
        });

    /* client.action("organization_show",
     {
     id: organizationData.id
     },
     function (err, info) {
     cb(err, result);
     });*/
};

const deleteAllPackagesFromOrganization = function (jsonOnly, agent, ckanRepoData, organizationData, cb)
{
    const client = new CKAN.Client(ckanRepoData.ddr.hasExternalUrl, ckanRepoData.ddr.hasAPIKey);

    client.action('organization_show',
        {
            id: organizationData.id,
            include_datasets: true
        },
        function (err, result)
        {
            if (err)
            {
                cb(err, result);
            }
            else
            {
                if (result.result.packages.length > 0)
                {
                    async.mapSeries(result.result.packages, function (package, cb)
                    {
                        /* client.action("package_delete",*/
                        client.action('dataset_purge',
                            {
                                id: package.id
                            },
                            function (err, result)
                            {
                                cb(err, result);
                            });
                    }, function (err, results)
                    {
                        cb(err, results);
                    });
                }
                else
                {
                    cb(err, result);
                }
            }
        });

    /* client.action("package_list",
        {},
        function (err, result) {
            if (err) {
                cb(err, result);
            }
            else {
                if(result.result.length > 0)
                {
                    async.mapSeries(result.result, function (packageName, cb) {
                        /!*client.action("package_delete",*!/
                        client.action("dataset_purge",
                            {
                                id: packageName
                            },
                            function (err, result) {
                                cb(err, result);
                            });
                    }, function (err, results) {
                        cb(err, results);
                    });
                }
                else
                {
                    cb(err, result);
                }
            }
        });*/
};

const uploadFileToCkanPackage = function (jsonOnly, agent, ckanRepoData, fileData, packageInfo, cb)
{
    const client = new CKAN.Client(ckanRepoData.repository.ddr.hasExternalUri, ckanRepoData.repository.ddr.hasAPIKey);
    client.upload_file_into_package(
        fileData.location,
        packageInfo.id,
        'This is the description of' + fileData.name,
        fileData.name,
        fileData.extension,
        fileData.extension.toUpperCase()
        , function (err, info)
        {
            cb(err, info);
        });
};

const getCkanFolderContents = function (jsonOnly, agent, ckanRepoData, folderData, cb)
{
    const client = new CKAN.Client(ckanRepoData.repository.ddr.hasExternalUri, ckanRepoData.repository.ddr.hasAPIKey);
    let packageId = CkanUtils.createPackageID(folderData.uri);
    client.action('package_show',
        {
            id: packageId
        },
        function (err, result)
        {
            if (result.success)
            {
                cb(err, result.result.resources);
            }
            else
            {
                cb(err, result);
            }
        });
};

module.exports = {
    createCkanOrganization: createCkanOrganization,
    deleteCkanOrganization: deleteCkanOrganization,
    deleteAllPackagesFromOrganization: deleteAllPackagesFromOrganization,
    uploadFileToCkanPackage: uploadFileToCkanPackage,
    getCkanFolderContents: getCkanFolderContents
};

