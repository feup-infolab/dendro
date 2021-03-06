"use strict";

angular.module("dendroApp.services")
    .service("notebookService",
        ["$http", "$rootScope", "windowService",
            function ($http, $rootScope, windowService)
            {
                this.activate_notebook = function (notebook)
                {
                    let uri;
                    if (notebook == null || notebook.uri == null)
                    {
                        return "No valid uri provided when attempting to start notebook";
                    }

                    uri = notebook.uri + "?activate";

                    return $http({
                        method: "POST",
                        url: uri,
                        data: JSON.stringify({}),
                        contentType: "application/json",
                        headers: {Accept: "application/json"}
                    }).then(function (response)
                    {
                        if (response.data != null && response.data instanceof Object)
                        {
                            windowService.redirectToUri(response.data.new_notebook_url);
                            $scope.load_folder_contents();
                            console.log("Returned");
                            return response;
                        }

                        windowService.show_popup("error", " There was an error starting the new Notebook");

                        return response;
                    });
                };
                this.mkdir = function (newFolderName, parentFolderUri)
                {
                    if (newFolderName != null)
                    {
                        var mkdirUrl = parentFolderUri + "?mkdir=" + newFolderName;

                        return $http({
                            method: "POST",
                            url: mkdirUrl,
                            data: JSON.stringify({}),
                            contentType: "application/json",
                            headers: {Accept: "application/json"}
                        });
                    }
                };

                this.rename = function (newName, resourceUri)
                {
                    if (newName != null)
                    {
                        var renameUrl = resourceUri + "?rename=" + newName;

                        return $http({
                            method: "POST",
                            url: renameUrl,
                            data: JSON.stringify({}),
                            contentType: "application/json",
                            headers: {Accept: "application/json"}
                        });
                    }
                };

                this.cut = function (resourcesToCut, targetFolderUri)
                {
                    var resourcesToCutUris = _.map(resourcesToCut, function (file)
                    {
                        return file.uri;
                    });

                    return $http({
                        method: "POST",
                        url: targetFolderUri + "?cut",
                        data: JSON.stringify({
                            files: resourcesToCutUris
                        }),
                        contentType: "application/json",
                        headers: {Accept: "application/json"}
                    });
                };

                this.copy = function (resourcesToCopy, targetFolderUri)
                {
                    var resourcesToCopyUris = _.map(resourcesToCopy, function (file)
                    {
                        return file.uri;
                    });

                    return $http({
                        method: "POST",
                        url: targetFolderUri + "?copy",
                        data: JSON.stringify({
                            files: resourcesToCopyUris
                        }),
                        contentType: "application/json",
                        headers: {Accept: "application/json"}
                    });
                };

                this.rm = function (fileOrFolder, forever)
                {
                    var uri = fileOrFolder.uri;

                    if (forever)
                    {
                        uri = uri + "?really_delete=true";
                    }

                    return $http({
                        method: "DELETE",
                        url: uri,
                        data: JSON.stringify({}),
                        contentType: "application/json",
                        headers: {Accept: "application/json"}
                    });
                };

                this.undelete = function (fileOrFolder)
                {
                    return $http({
                        method: "POST",
                        url: fileOrFolder.uri + "?undelete",
                        data: JSON.stringify({}),
                        contentType: "application/json",
                        headers: {Accept: "application/json"}
                    });
                };
            }]);
