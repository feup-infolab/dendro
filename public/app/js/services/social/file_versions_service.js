'use strict';

angular.module('dendroApp.services')
    .service('fileVersionsService', ['$http', function ($http) {

        this.countNumFileVersions = function ()
        {
            var requestUri = "/fileVersions/countNum";

            return $http({
                method: 'GET',
                url: requestUri,
                contentType: "application/json",
                headers: {'Accept': "application/json"}
            });
        };

        this.get_all_file_versions = function(currentPage)
        {
            var requestUri = "/fileVersions/all";

            return $http({
                method: 'GET',
                url: requestUri,
                contentType: "application/json",
                headers: {'Accept': "application/json"},
                params: {currentPage: currentPage}
            });
        };

        this.getFileVersion = function (fileVersionUri)
        {
            var requestUri = "/fileVersions/fileVersion";
            var params = {
                fileVersionUri : fileVersionUri
            };

            return $http({
                method: 'GET',
                url: requestUri,
                data: params,
                contentType: "application/json",
                headers: {'Accept': "aplication/json"}
            });
        };


    }]);
