const chai = require("chai");
const chaiHttp = require("chai-http");
const CKAN = require("ckan.js");
const async = require("async");
chai.use(chaiHttp);

const createCkanOrganization = function (jsonOnly, agent, ckanRepoData, organizationData, cb) {
    const client = new CKAN.Client(ckanRepoData.ddr.hasExternalUrl, ckanRepoData.ddr.hasAPIKey);
    client.action("organization_create",
        {
            name: organizationData.name,
            id: organizationData.id
        },
        function (err, result) {
            cb(err, result);
        });
};

const deleteCkanOrganization = function (jsonOnly, agent, ckanRepoData, organizationData, cb) {
    const client = new CKAN.Client(ckanRepoData.ddr.hasExternalUrl, ckanRepoData.ddr.hasAPIKey);
    //organization_purge
    //client.action("organization_delete",
    client.action("organization_delete",
        {
            id: organizationData.id
        },
        function (err, result) {
            cb(err, result);
        });

    /*client.action("organization_show",
     {
     id: organizationData.id
     },
     function (err, info) {
     cb(err, result);
     });*/
};

const deleteAllPackagesFromOrganization = function (jsonOnly, agent, ckanRepoData, organizationData, cb) {
    const client = new CKAN.Client(ckanRepoData.ddr.hasExternalUrl, ckanRepoData.ddr.hasAPIKey);

    client.action("organization_show",
        {
            id: organizationData.id,
            include_datasets: true
        },
        function (err, result) {
            if (err) {
                cb(err, result);
            }
            else {
                if(result.result.packages.length > 0)
                {
                    async.mapSeries(result.result.packages, function (package, cb) {
                        client.action("package_delete",
                            {
                                id: package.id
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
        });
}

const uploadFileToCkanPackage = function (jsonOnly, agent, ckanRepoData, fileData, packageInfo, cb) {
    const client = new CKAN.Client(ckanRepoData.repository.ddr.hasExternalUri, ckanRepoData.repository.ddr.hasAPIKey);
    client.upload_file_into_package(
        fileData.location,
        packageInfo.id,
        "This is the description of" + fileData.name,
        fileData.name,
        fileData.extension,
        fileData.extension.toUpperCase()
        , function (err, info) {
            cb(err, info);
    });
}


module.exports = {
    createCkanOrganization: createCkanOrganization,
    deleteCkanOrganization: deleteCkanOrganization,
    deleteAllPackagesFromOrganization: deleteAllPackagesFromOrganization,
    uploadFileToCkanPackage: uploadFileToCkanPackage
};

