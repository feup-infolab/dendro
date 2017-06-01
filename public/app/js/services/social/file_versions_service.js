'use strict';

angular.module('dendroApp.services')
    .service('fileVersionsService', ['$http', function ($http) {

        this.getFileVersionInfo = function (fileVersionUri) {
            return $http({
                method: 'GET',
                url: fileVersionUri,
                contentType: "application/json",
                accept: "text/html",
                headers: {'Accept': "application/json"}
            });
        };

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
                method: 'POST',
                url: requestUri,
                data: params,
                contentType: "application/json",
                headers: {'Accept': "aplication/json"}
            });
        };

        this.like_file_version = function (fileVersionUri)
        {
            var requestUri = "/fileVersions/like";

            var params = {
                fileVersionUri : fileVersionUri
            };

            return $http({
                method: 'POST',
                url: requestUri,
                data: params,
                contentType: "application/json",
                headers: {'Accept': "aplication/json"}
            });
        };


        this.fileVersionLikesInfo = function(fileVersionUri)
        {
            var requestUri = "/fileVersions/fileVersion/likesInfo";
            var params = {
                fileVersionUri : fileVersionUri
            };

            return $http({
                method: 'POST',
                url: requestUri,
                data: params,
                contentType: "application/json",
                headers: {'Accept': "application/json"}
            });
        };

        this.commentFileVersion = function (fileVersionUri, commentMsg) {
            var requestUri = "/fileVersions/comment";

            var params = {
                fileVersionUri : fileVersionUri,
                commentMsg: commentMsg
            };

            return $http({
                method: 'POST',
                url: requestUri,
                data: params,
                contentType: "application/json",
                headers: {'Accept': "application/json"}
            });
        };

        this.shareFileVersion = function(fileVersionUri, shareMsg)
        {
            var requestUri = "/fileVersions/share";

            var params = {
                fileVersionUri : fileVersionUri,
                shareMsg: shareMsg
            };

            return $http({
                method: 'POST',
                url: requestUri,
                data: params,
                contentType: "application/json",
                headers: {'Accept': "application/json"}
            });
        };

        this.getSharesFromFileVersion = function(fileVersionUri)
        {
            var requestUri = "/fileVersions/shares";

            var params = {
                fileVersionUri : fileVersionUri
            };

            return $http({
                method: 'POST',
                url: requestUri,
                data: params,
                contentType: "application/json",
                headers: {'Accept': "application/json"}
            });
        };

        this.getCommentsFromFileVersion = function(fileVersionUri)
        {
            var requestUri = "/fileVersions/comments";

            var params = {
                fileVersionUri : fileVersionUri
            };

            return $http({
                method: 'POST',
                url: requestUri,
                data: params,
                contentType: "application/json",
                headers: {'Accept': "application/json"}
            });
        };

        this.getLikesFromFileVersion = function(fileVersionUri)
        {
            var requestUri = "/fileVersions/likes";

            var params = {
                fileVersionUri : fileVersionUri
            };

            return $http({
                method: 'POST',
                url: requestUri,
                data: params,
                contentType: "application/json",
                headers: {'Accept': "application/json"}
            });
        };

    }]);
