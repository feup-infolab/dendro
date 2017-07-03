angular.module('dendroApp.controllers')
/**
 *  Avatar controller
 */
    .controller('avatarCtrl', function ($scope, $http, $filter, $window, $element, usersService)
    {
        $scope.editAvatarModalActivated = false;
        $scope.myImage='';
        $scope.myCroppedImage='';
        $scope.imageCompressed = null;
        $scope.avatarUri = '';

        $scope.openEditAvatarModal = function () {
            console.log("opened avatar modal");
            $scope.editAvatarModalActivated = true;
        };

        $scope.closeEditAvatarModal = function () {
            console.log("closed avatar modal");
            $scope.editAvatarModalActivated = false;
            $scope.myCroppedImage = null;
        };

        $scope.updateProfilePic = function () {
            usersService.update_avatar($scope.myCroppedImage)
                .then(function(response)
                {
                    console.log('updatedAvatar');
                    location.reload();
                })
                .catch(function(error){
                    console.error("Error updating avatar " + JSON.stringify(error));
                });
        };

        var handleFileSelect=function(compressedImage) {
            $scope.myImage=compressedImage.compressed.dataURL;
        };

        $scope.$watch('imageCompressed', function() {
            if($scope.imageCompressed)
            {
                console.log("Hey imageCompressed has changed");
                handleFileSelect($scope.imageCompressed);
            }
        });

    });