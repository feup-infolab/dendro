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
            /*console.log('I will update the profile picture');
            console.log('myCroppedImage is:');*/
            console.log('I will update the profile picture');
            console.log('myImage is:');
            console.log($scope.myCroppedImage);
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
            //var file=evt.currentTarget.files[0];
            //var file=compressedImage.compressed.dataURL;
            $scope.myImage=compressedImage.compressed.dataURL;
            /*var reader = new FileReader();
            reader.onload = function (evt) {
                $scope.$apply(function($scope){
                    $scope.myImage=evt.target.result;
                    console.log("cenas");
                });
            };
            reader.readAsDataURL(file);*/
        };
        //angular.element(document.querySelector('#fileInput')).on('change',handleFileSelect);
        $scope.$watch('imageCompressed', function() {
            if($scope.imageCompressed)
            {
                console.log("Hey imageCompressed has changed");
                handleFileSelect($scope.imageCompressed);
            }
        });

    });