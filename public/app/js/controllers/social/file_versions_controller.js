angular.module('dendroApp.controllers')
    /**
     *  Project administration controller
     *  Project administration controller
     */
    .controller('fileVersionsCtrl', function ($scope, $http, $filter, fileVersionsService, timelineService, $window)
    {

        $scope.fileVersions = [];
        $scope.totalFileVersions = 0;
        $scope.fileVersionsPerPage = 5; // this should match however many results your API puts on one page

        $scope.pagination = {
            current: 1
        };


        $scope.get_all_file_versions = function(currentPage)
        {
            $scope.getting_file_versions = true;
            fileVersionsService.get_all_file_versions(currentPage)
                .then(function(response)
                {
                    $scope.fileVersions = response.data;
                    $scope.getting_file_versions = false;
                })
                .catch(function(error){
                    console.error("Error getting posts " + JSON.stringify(error));
                    $scope.getting_file_versions = false;
                });
        };

        $scope.like_file_version = function (fileVersionUri) {
            console.log('at scope.likeVersion');
            $scope.liking_file_version = true;
            fileVersionsService.like_file_version(fileVersionUri)
                .then(function (response) {
                    console.log('likeVersion response is:');
                    console.log(response);
                    $scope.fileVersionLikesInfo(fileVersionUri);
                    $scope.liking_file_version = false;
                })
                .catch(function (error) {
                    console.error("Error Liking FileVersion " + JSON.stringify(error));
                    $scope.liking_file_version = false;
                });
        };

        $scope.fileVersionLikesInfo = function (fileVersionUri) {
            $scope.doing_fileVersionLikesInfo = true;

            fileVersionsService.fileVersionLikesInfo(fileVersionUri).then(function (response) {
                $scope.doing_fileVersionLikesInfo = false;
                $scope.likesFileVersionInfo[fileVersionUri] = response.data;
                return response.data;
            }).catch(function (error) {
                console.error("Error at file_versions_controller fileVersionLikesInfo" + JSON.stringify(error));
                $scope.doing_fileVersionLikesInfo = false;
                return false;
            });
        };

        //TODO change this to a user controller
        $scope.get_logged_user = function () {

            $scope.doing_get_logged_user = true;

            timelineService.get_logged_user()
                .then(function(response)
                {
                    //$scope.show_popup(response.data.message);
                    $scope.loggedUser = response.data.uri;

                    $scope.doing_get_logged_user = false;
                })
                .catch(function(error){
                    console.error("Error getting logged in user" + JSON.stringify(error));
                    $scope.doing_get_logged_user = false;
                });
        };

        $scope.init = function()
        {
            //For pagination purposes
            /*$scope.currentPage = 1;
             $scope.pageSize = 5;
             $scope.numPosts = 0;*/

            $scope.commentList = [];
            $scope.shareList = [];
            $scope.likedFileVersions = [];
            $scope.fileVersionsList = [];
            $scope.likesFileVersionInfo = [];
            $scope.countNumFileVersions();
            $scope.get_all_file_versions($scope.pagination.current);
        };

        $scope.show_popup = function(type, title, message)
        {
            if(type == "success")
            {
                new PNotify({
                    title: title,
                    text: message,
                    type: 'success',
                    opacity: 1.0,
                    delay: 2000,
                    addclass: "stack-bar-top",
                    cornerclass: "",
                    stack: stack_topright
                });
            }
            else if(type == "error")
            {
                new PNotify({
                    title: title,
                    text: message,
                    type: 'error',
                    opacity: 1.0,
                    delay: 5000,
                    addclass: "stack-bar-top",
                    cornerclass: "",
                    stack: stack_topright
                });
            }
            else if(type == "info")
            {
                new PNotify({
                    title: title,
                    text: message,
                    type: 'info',
                    opacity: 1.0,
                    delay: 8000,
                    addclass: "stack-bar-top",
                    cornerclass: "",
                    stack: stack_topright
                });
            }
        };

        $scope.countNumFileVersions = function () {

            fileVersionsService.countNumFileVersions()
                .then(function(response)
                {
                    $scope.totalFileVersions = response.data;
                })
                .catch(function(error){
                    console.error("Error number of File Versions" + JSON.stringify(error));
                });
        };

        $scope.get_logged_user = function () {

            $scope.doing_get_logged_user = true;

            timelineService.get_logged_user()
                .then(function(response)
                {
                    //$scope.show_popup(response.data.message);
                    $scope.loggedUser = response.data.uri;

                    $scope.doing_get_logged_user = false;
                })
                .catch(function(error){
                    console.error("Error getting logged in user" + JSON.stringify(error));
                    $scope.doing_get_logged_user = false;
                });
        };

        $scope.getFileVersion = function (fileVersionUri) {
            fileVersionsService.getFileVersion(fileVersionUri)
                .then(function (response) {
                    $scope.fileVersionsList[fileVersionUri] = response.data;
                })
                .catch(function (error) {
                    console.error("Error getting a FileVersion" + JSON.stringify(error));
                });
        };

        $scope.pageChangeHandler = function(num) {
            $scope.get_all_file_versions(num);
            $window.scrollTo(0, 0);//to scroll up to the top on page change
        };


        $scope.getCommentsFromFileVersion = function (fileVersionUri) {

            $scope.doing_getCommentsFromFileVersion = true;

            timelineService.getCommentsFromPost(fileVersionUri)
                .then(function(response)
                {
                    $scope.show_popup(response.data);
                    $scope.commentList[fileVersionUri] = response.data;
                    $scope.doing_getCommentsFromFileVersion = false;
                })
                .catch(function(error){
                    console.error("Error getting comments from a FileVersion" + JSON.stringify(error));
                    $scope.doing_getCommentsFromFileVersion = false;
                });
        };

        $scope.commentFileVersion = function (fileVersionUri, commentMsg) {

            $scope.doing_commentFileVersion = true;

            fileVersionsService.commentFileVersion(fileVersionUri, commentMsg)
                .then(function(response)
                {
                    $scope.show_popup(response.data.message);

                    $scope.getCommentsFromFileVersion(fileVersionUri);
                    $scope.doing_commentFileVersion = false;
                })
                .catch(function(error){
                    console.error("Error commenting a fileVersion" + JSON.stringify(error));
                    $scope.doing_commentFileVersion = false;
                });
        };

        $scope.shareFileVersion = function (fileVersionUri, shareMsg) {
            $scope.doing_shareFileVersion = true;

            fileVersionsService.shareFileVersion(fileVersionUri, shareMsg)
                .then(function(response)
                {
                    $scope.show_popup(response.data.message);
                    $scope.get_all_file_versions($scope.pagination.current);//TODO remove this function call???
                    $scope.doing_shareFileVersion = false;
                })
                .catch(function(error){
                    console.error("Error sharing a FileVersion" + JSON.stringify(error));
                    $scope.doing_shareFileVersion = false;
                });
        };

        $scope.getSharesFromFileVersion = function (fileVersionUri) {

            $scope.doing_getSharesFromFileVersion = true;

            fileVersionsService.getSharesFromFileVersion(fileVersionUri)
                .then(function(response)
                {
                    $scope.show_popup(response.data);
                    $scope.shareList[fileVersionUri] = response.data;
                    $scope.doing_getSharesFromFileVersion = false;
                })
                .catch(function(error){
                    console.error("Error getting shares from a fileVersion" + JSON.stringify(error));
                    $scope.doing_getSharesFromFileVersion = false;
                });
        };
    });