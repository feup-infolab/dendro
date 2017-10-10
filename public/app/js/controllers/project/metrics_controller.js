angular.module('dendroApp.controllers')

/**
 * new project controller
 */
    .controller('metricsController',

        function (

            $scope,
            $http,
            $q,
            $location,
            projectsService
        ) {

            $scope.labels = ["Download Sales", "In-Store Sales", "Mail-Order Sales"];
            $scope.data = [300, 500, 100];
            $scope.colours = [ '#803690', '#00ADF9', '#17ed6d'];

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
