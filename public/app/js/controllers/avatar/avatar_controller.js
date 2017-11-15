angular.module("dendroApp.controllers")
/**
 *  Avatar controller
 */
    .controller("avatarCtrl", function ($scope, $http, $filter, $window, $element, usersService)
    {
        $scope.editAvatarModalActivated = false;
        $scope.myImage = "";
        $scope.myCroppedImage = "";
        $scope.imageCompressed = null;
        $scope.avatarUri = "";

        $scope.openEditAvatarModal = function ()
        {
            $scope.editAvatarModalActivated = true;
        };

        $scope.closeEditAvatarModal = function ()
        {
            $scope.editAvatarModalActivated = false;
            $scope.myCroppedImage = null;
        };

        $scope.updateProfilePic = function ()
        {
            usersService.updateAvatar($scope.myCroppedImage)
                .then(function (response)
                {
                    location.reload();
                })
                .catch(function (error)
                {
                    console.error("Error updating avatar " + JSON.stringify(error));
                });
        };

        var handleFileSelect = function (compressedImage)
        {
            $scope.myImage = compressedImage.compressed.dataURL;
        };

        $scope.$watch("imageCompressed", function ()
        {
            if ($scope.imageCompressed)
            {
                handleFileSelect($scope.imageCompressed);
            }
        });
    });
