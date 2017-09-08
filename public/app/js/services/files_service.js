'use strict';

angular.module('dendroApp.services')
    .service('filesService',
        ['$http', '$rootScope', 'windowService',
            function ($http, $rootScope, windowService) {

        this.get_folder_contents = function(uri, including_deleted_files)
        {
            if(uri == null)
            {
                uri = windowService.get_current_url() + '?ls';
            }
            else
            {
                uri = uri + '?ls';
            }

            if(including_deleted_files)
            {
                uri = uri + "&show_deleted=1";
            }

            return $http({
                method: 'GET',
                url: uri,
                data: JSON.stringify({}),
                contentType: "application/json",
                headers: {"Accept": "application/json"}
            }).then(function(response) {
                    if(response.data != null && response.data instanceof Object)
                    {
                        return response.data;
                    }
                    else
                    {
                        return [];
                    }
                }
            );
        };

        this.get_stats = function(uri)
        {
            if(uri == null)
            {
                uri = windowService.get_current_url() + '?stats';
            }
            else
            {
                uri = uri + '?stats';
            }

            return $http({
                method: 'GET',
                url: uri,
                data: JSON.stringify({}),
                contentType: "application/json",
                headers: {"Accept": "application/json"}
            }).then(function(response) {
                    if(response.data != null && response.data instanceof Object)
                    {
                        return response;
                    }
                    else
                    {
                        return {};
                    }
                }
            );
        };

        this.mkdir = function(newFolderName, parentFolderUri)
        {
            if (newFolderName!=null)
            {
                var mkdirUrl = parentFolderUri + "?mkdir=" +newFolderName;

                return $http({
                    method: "POST",
                    url: mkdirUrl,
                    data: JSON.stringify({}),
                    contentType: "application/json",
                    headers: {"Accept": "application/json"}
                });
            }
        };

        this.rename = function(newName, resourceUri)
        {
            if (newName !=null)
            {
                var renameUrl = resourceUri + "?rename=" +newName;

                return $http({
                    method: "POST",
                    url: renameUrl,
                    data: JSON.stringify({}),
                    contentType: "application/json",
                    headers: {"Accept": "application/json"}
                });
            }
        };

        this.cut = function(resourcesToCut, targetFolderUri)
        {
            var resourcesToCutUris = _.map(resourcesToCut, function(file){
                return file.uri;
            });

            return $http({
                method: "POST",
                url: targetFolderUri + "?cut",
                data : JSON.stringify({
                    files : resourcesToCutUris
                }),
                contentType: "application/json",
                headers: {"Accept": "application/json"}
            });
        };

        this.copy = function(resourcesToCopy, targetFolderUri)
        {
            var resourcesToCopyUris = _.map(resourcesToCopy, function(file){
                return file.uri;
            });

            return $http({
                method: "POST",
                url: targetFolderUri + "?copy",
                data : JSON.stringify({
                    files : resourcesToCopyUris
                }),
                contentType: "application/json",
                headers: {"Accept": "application/json"}
            });
        };

        this.rm = function(fileOrFolder, forever)
        {
            var uri = fileOrFolder.uri;

            if(forever)
            {
                uri = uri + "?really_delete=true";
            }

            return $http({
                method: 'DELETE',
                url: uri,
                data: JSON.stringify({}),
                contentType: "application/json",
                headers: {"Accept": "application/json"}
            });
        };

        this.undelete = function(fileOrFolder)
        {
            return $http({
                method: "POST",
                url: fileOrFolder.uri + "?undelete",
                data: JSON.stringify({}),
                contentType: "application/json",
                headers: {"Accept": "application/json"}
            });
        };
    }]);
