angular.module('dendroApp.controllers')

    /**
     * new project controller
     */
    .controller('projCtrl',

        function (

            $scope,
            $http,
            $q,
            $location,
            projectsService
        ) {
            $scope.new_project = {
                "privacy" : "private"
            };

            $scope.create_project = function (new_project) {
                projectsService.create_new_project(new_project)
                    .then(function (result) {

                        var newURL = $scope.get_host() + "/projects/my";
                        window.location.href= newURL;
                        $scope.show_popup("success", "Success", "Project created");


                    })
                    .catch(function (error) {
                        $scope.show_popup("error", "Error", error.message);
                    });
            };

        });
