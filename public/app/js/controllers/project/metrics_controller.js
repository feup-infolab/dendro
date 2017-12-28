angular.module('dendroApp.controllers')

/**
 * new project controller
 */
    .controller('metricsController',

        function ($scope,
                  $http,
                  $filter,
                  $q,
                  $log,
                  $sce,
                  focus,
                  preview,
                  $localStorage,
                  $timeout,
                  metadataService,
                  windowService,
                  filesService,
                  projectsService,
                  metricsService) {


            $scope.init = function () {
                //$scope.loadData();
               // $scope.getOwner();


                let deposit = {
                    creator : null,
                    date : "2017-12-28T19:54:56+00:00",
                    folder : "/r/folder/e5ccb0da-743d-4aff-88c9-8728db99339b",
                    folderName : "gravimetry01",
                    label : "B2Share Metrics",
                    platformsUsed : null,
                    privacy : "private",
                    projectTitle : "Gravimetry run campaign over the Azores",
                    projused : "/r/project/84ab852f-322c-485d-a7a9-0513ab55c6ea",
                    repository : "trng-b2share.eudat.eu",
                    uri : "/r/deposit/1f22e7d9-9db5-494b-ae84-feb0bd6c906c",
                    user : "demouser1"
                };

                let deposit2 = {
                    creator : null,
                    date : "2017-12-28T19:54:56+00:00",
                    folder : "/r/folder/e5ccb0da-743d-4aff-88c9-8728db99339b",
                    folderName : "gravimetry01",
                    label : "B2Share Metrics",
                    platformsUsed : null,
                    privacy : "private",
                    projectTitle : "Gravimetry run campaign over the Azores",
                    projused : "/r/project/84ab852f-322c-485d-a7a9-0513ab55c6ea",
                    repository : "trng-b2share.eudat.eu",
                    uri : "/r/deposit/1f22e7d9-9db5-494b-ae84-feb0bd6c906c",
                    user : "demouser1"
                };
                let deposit3 = {
                    creator : null,
                    date : "2017-12-28T19:54:56+00:00",
                    folder : "/r/folder/e5ccb0da-743d-4aff-88c9-8728db99339b",
                    folderName : "gravimetry01",
                    label : "B2Share Metrics",
                    platformsUsed : null,
                    privacy : "private",
                    projectTitle : "Gravimetry run campaign over the Azores",
                    projused : "/r/project/84ab852f-322c-485d-a7a9-0513ab55c6ea",
                    repository : "trng-b2share.eudat.eu",
                    uri : "/r/deposit/1f22e7d9-9db5-494b-ae84-feb0bd6c906c",
                    user : "demouser1"
                };
                let deposit4 = {
                    creator : null,
                    date : "2017-12-28T19:54:56+00:00",
                    folder : "/r/folder/e5ccb0da-743d-4aff-88c9-8728db99339b",
                    folderName : "gravimetry01",
                    label : "B2Share Metrics",
                    platformsUsed : null,
                    privacy : "private",
                    projectTitle : "Gravimetry run campaign over the Azores",
                    projused : "/r/project/84ab852f-322c-485d-a7a9-0513ab55c6ea",
                    repository : "trng-b2share.eudat.eu",
                    uri : "/r/deposit/1f22e7d9-9db5-494b-ae84-feb0bd6c906c",
                    user : "demouser1"
                };
                let deposit5 = {
                    creator : null,
                    date : "2017-12-28T19:54:56+00:00",
                    folder : "/r/folder/e5ccb0da-743d-4aff-88c9-8728db99339b",
                    folderName : "gravimetry01",
                    label : "B2Share Metrics",
                    platformsUsed : null,
                    privacy : "private",
                    projectTitle : "Gravimetry run campaign over the Azores",
                    projused : "/r/project/84ab852f-322c-485d-a7a9-0513ab55c6ea",
                    repository : "trng-b2share.eudat.eu",
                    uri : "/r/deposit/1f22e7d9-9db5-494b-ae84-feb0bd6c906c",
                    user : "demouser1"
                };

                var depositsSet =[deposit,deposit2,deposit3,deposit4,deposit5];
                setChart(depositsSet);

                $scope.startDeposits();

            };

            $scope.updateData = function () {
                $scope.data = $scope.data.map(function (data) {
                    return data.map(function (y) {
                        y = y + Math.random() * 10 - 5;
                        return parseInt(y < 0 ? 0 : y > 100 ? 100 : y);
                    });
                });
            };


            $scope.getDeposits = function () {
                function startDeposits (uri)
                {
                    metricsService.get_deposits(uri)
                        .then(function (response)
                        {
                            let res = response;
                            console.log(res);
                        });
                }
                if ($scope.showing_project_root())
                {
                    startDeposits($scope.get_calling_uri());
                }
                else
                {
                    $scope.get_owner_project()
                        .then(function (ownerProject)
                        {
                            if (ownerProject != null)
                            {
                                startDeposits(ownerProject.uri);
                            }
                        })
                        .catch(function (e)
                        {
                            console.log("error", "Unable to fetch parent project of the currently selected file.");
                            console.log("error", JSON.stringify(e));
                            windowService.show_popup("error", "Error", e.statusText);
                        });
                }
            };



            $scope.startDeposits = function () {
                let url = $scope.get_host();
                url += "/metrics/deposits";
                let platforms = ["CKAN","DSpace","EPrints","Figshare","Zenodo","EUDAT B2Share"];
                let param =
                    {
                        id: window.location.pathname,
                        platforms: platforms
                    };

                $http({
                    method: "GET",
                    url: url,
                    params: param,
                    contentType: "application/json",
                    headers: {"Accept": "application/json"}
                }).then(function (response) {
                    let deposits = response.data;
                    setChart(deposits);
                }).catch(function (error) {
                    console.log(error);
                });
            };

            function setChart(deposits) {
                for (let i =0; i < deposits.length; i++){
/*                    if (deposits[i].label === "new project"){
                        let event = {
                        };
                        var depositDate = new Date(deposits[i].date);
                        depositDate.getMonth();
                        event.badgeClass = "create";
                        event.badgeIconClass = "glyphicon-map-marker";
                        event.title = "Project " + deposits[i].projectTitle + "was created";
                        event.content = "The project " + deposits[i].projectTitle + " was created by "+ deposits[i].user + " on the "
                            + depositDate.getDay()+ "/"
                        + depositDate.getMonth()+"/" + depositDate.getFullYear();
                        $scope.events.push(event);
                    }*/

                    if (deposits[i].repository === "trng-b2share.eudat.eu"){
                        let event = {
                        };
                        var depositDate = new Date(deposits[i].date);
                        event.badgeClass = "b2share";
                        event.badgeIconClass = "glyphicon-copy";
                        event.title = "Deposit at " + deposits[i].description;
                        event.content = "Deposit created at " + deposits[i].description + " was created by "+ deposits[i].user + " on the "
                            + depositDate.getDay()+ "/"
                            + depositDate.getMonth()+"/" + depositDate.getFullYear() + " for the "+ deposits[i].projectTitle + " project.";
                        $scope.events.push(event);
                    }
                    else if (deposits[i].repository === "http://www.zenodo.org/"){
                        let event = {
                        };
                        var depositDate = new Date(deposits[i].date);
                        event.badgeClass = "b2share";
                        event.badgeIconClass = "glyphicon-copy";
                        event.title = "Deposit at " + deposits[i].description;
                        event.content = "Deposit created at " + deposits[i].description + " was created by "+ deposits[i].user + " on the "
                            + depositDate.getDay()+ "/"
                            + depositDate.getMonth()+"/" + depositDate.getFullYear() + " for the "+ deposits[i].projectTitle + " project.";
                        $scope.events.push(event);
                    }
                }
            }


            $scope.events = [];



            //Chart Block
            $scope.labels = [];
            $scope.data = [
                [0,0,0]
            ];
            $scope.datasetOverride = [{ yAxisID: 'y-axis-1' }, { yAxisID: 'y-axis-2' }];
            $scope.options = {
                scales: {
                    yAxes: [
                        {
                            id: 'y-axis-1',
                            type: 'linear',
                            display: true,
                            position: 'left'
                        },
                        {
                            id: 'y-axis-2',
                            type: 'linear',
                            display: true,
                            position: 'right'
                        }
                    ]
                }
            };
            $scope.colors = [
                { // grey
                    backgroundColor: 'rgba(148,159,177,0.2)',
                    pointBackgroundColor: 'rgba(148,159,177,1)',
                    pointHoverBackgroundColor: 'rgba(148,159,177,1)',
                    borderColor: 'rgba(148,159,177,1)',
                    pointBorderColor: '#fff',
                    pointHoverBorderColor: 'rgba(148,159,177,0.8)'
                },
                { // dark grey
                    backgroundColor: 'rgba(77,83,96,0.2)',
                    pointBackgroundColor: 'rgba(77,83,96,1)',
                    pointHoverBackgroundColor: 'rgba(77,83,96,1)',
                    borderColor: 'rgba(77,83,96,1)',
                    pointBorderColor: '#fff',
                    pointHoverBorderColor: 'rgba(77,83,96,0.8)'
                }
            ];
        });
