angular.module("dendroApp.controllers")

/**
     * new project controller
     */
    .controller("projCtrl",

        function (

            $scope,
            $http,
            $q,
            $location,
            projectsService
        )
        {
            $scope.new_project = {
                privacy: "private"
            };

            $scope.create_project = function (new_project)
            {
                new_project.language = new_project.language.alpha2;

                projectsService.create_new_project(new_project)
                    .then(function (result)
                    {
                        var newURL = $scope.get_host() + "/projects/my";
                        window.location.href = newURL;
                        $scope.show_popup("success", "Success", "Project created");
                    })
                    .catch(function (error)
                    {
                        $scope.show_popup("error", "Error", error.message);
                    });
            };

            $scope.init = function ()
            {
                $scope.load_licenses()
                    .then(function (licenses)
                    {
                        $scope.new_project.license = _.find(licenses, function (license)
                        {
                            return license.id === "CC-BY-4.0";
                        });
                    });

                $scope.load_languages()
                    .then(function (languages)
                    {
                        $scope.new_project.language = _.find(languages, function (language)
                        {
                            return language.alpha2 === "en";
                        });
                    });
            };
        });
