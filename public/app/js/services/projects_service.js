'use strict';

angular.module('dendroApp.services')
    .service('projectsService',
        ['$q', '$http', 'windowService', '$location',
            function ($q, $http, windowService, $location)
            {
                this.create_new_project = function (new_project)
                {
                    if (new_project.ddr == null)
                    {
                        new_project.ddr = {};
                    }

                    var deferred = $q.defer();

                    var requestPayload = JSON.parse(JSON.stringify(new_project));

                    requestPayload.license = new_project.license.title;

                    var URL = windowService.get_current_url();

                    $http({
                        method: 'POST',
                        url: URL,
                        data: JSON.stringify(requestPayload),
                        contentType: 'application/json',
                        headers: {Accept: 'application/json'}
                    }).then(function (response)
                    {
                        $location.url('/');
                        var data = response.data;
                        deferred.resolve(data);
                    }
                    ).catch(function (error)
                    {
                        var serverResponse = error.data;
                        deferred.reject(serverResponse);
                    }
                    );

                    return deferred.promise;
                };

                this.update_contributors = function (contributors)
                {
                    var deferred = $q.defer();

                    var requestPayload = {
                        contributors: contributors
                    };

                    var URL = windowService.get_current_url();
                    URL += '?administer';

                    $http({
                        method: 'POST',
                        url: URL,
                        data: requestPayload,
                        contentType: 'application/json',
                        headers: {Accept: 'application/json'}
                    }).then(function (response)
                    {
                        $location.url('/');
                        var data = response.data;
                        deferred.resolve(data);
                    }
                    ).catch(function (error)
                    {
                        var serverResponse = error.data;
                        deferred.reject(serverResponse);
                    }
                    );

                    return deferred.promise;
                };

                this.get_contributors = function (contributors)
                {
                    var deferred = $q.defer();

                    var payload = JSON.stringify(contributors);

                    var URL = windowService.get_current_url();
                    URL += '?get_contributors';

                    $http({
                        method: 'GET',
                        url: URL,
                        data: payload,
                        contentType: 'application/json',
                        headers: {Accept: 'application/json'}
                    }).then(function (response)
                    {
                        var data = response.data;
                        deferred.resolve(data);
                    }
                    ).catch(function (error)
                    {
                        var serverResponse = error.data;
                        deferred.reject(serverResponse);
                    }
                    );

                    return deferred.promise;
                };

                this.get_owner_project_of_resource = function (uri)
                {
                    if (uri == null)
                    {
                        uri = windowService.get_current_url();
                    }

                    var requestUri = uri + '?owner_project';

                    var deserialize = $q.defer();

                    $http({
                        method: 'GET',
                        url: requestUri,
                        data: JSON.stringify({}),
                        contentType: 'application/json',
                        headers: {Accept: 'application/json'}
                    }).then(
                        function (response)
                        {
                            if (response.data != null && response.data instanceof Object)
                            {
                                deserialize.resolve(response.data);
                            }
                            else
                            {
                                deserialize.reject([]);
                            }
                        });

                    return deserialize.promise;
                };

                this.update_metadata = function (projectObject)
                {
                    var deferred = $q.defer();

                    var requestPayload = {
                        title: projectObject.dcterms.title,
                        description: projectObject.dcterms.description,
                        publisher: projectObject.dcterms.publisher,
                        contact_name: projectObject.schema.provider,
                        contact_phone: projectObject.schema.telephone,
                        contact_address: projectObject.schema.address,
                        contact_email: projectObject.schema.email,
                        language: projectObject.dcterms.language,
                        privacy: projectObject.ddr.privacyStatus,
                        license: projectObject.schema.license
                    };

                    var URL = windowService.get_current_url();
                    URL += '?administer';

                    $http({
                        method: 'POST',
                        url: URL,
                        data: requestPayload,
                        contentType: 'application/json',
                        headers: {Accept: 'application/json'}
                    }).then(function (response)
                    {
                        // $location.url('/');
                        var data = response.data;
                        deferred.resolve(data);
                    }
                    ).catch(function (error)
                    {
                        var serverResponse = error.data;
                        deferred.reject(serverResponse);
                    }
                    );

                    return deferred.promise;
                };

                this.getUserProjects = function ()
                {
                    var requestUri = '/projects/my';

                    return $http({
                        method: 'GET',
                        url: requestUri,
                        contentType: 'application/json',
                        headers: {Accept: 'application/json'}
                    });
                };

                this.getProjectInfo = function (projectUri)
                {
                    var requestUri = projectUri;

                    return $http({
                        method: 'GET',
                        url: requestUri,
                        contentType: 'application/json',
                        headers: {Accept: 'application/json'}
                    });
                };

                this.update_project_settings = function (project)
                {
                    var deferred = $q.defer();

                    var URL = windowService.get_current_url();
                    URL += '?administer&settings';

                    $http({
                        method: 'POST',
                        url: URL,
                        data: {
                            storage_limit: project.ddr.hasStorageLimit,
                            verified_uploads: project.ddr.requiresVerifiedUploads
                        },
                        contentType: 'application/json',
                        headers: {Accept: 'application/json'}
                    }).then(function (response)
                    {
                        var data = response.data;
                        deferred.resolve(data);
                    }
                    ).catch(function (error)
                    {
                        var serverResponse = error.data;
                        deferred.reject(serverResponse);
                    }
                    );

                    return deferred.promise;
                };
            }]);
