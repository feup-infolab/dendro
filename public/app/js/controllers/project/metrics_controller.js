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
                    platformsUsed : "CKAN",
                    privacy : "private",
                    projectTitle : "Gravimetry run campaign over the Azores",
                    projused : "/r/project/84ab852f-322c-485d-a7a9-0513ab55c6ea",
                    repository : "http://demo.ckan.org",
                    uri : "/r/deposit/1f22e7d9-9db5-494b-ae84-feb0bd6c906c",
                    user : "demouser1"
                };

                let deposit2 = {
                    creator : null,
                    date : "2017-12-28T19:54:56+00:00",
                    folder : "/r/folder/e5ccb0da-743d-4aff-88c9-8728db99339b",
                    folderName : "gravimetry01",
                    label : "B2Share Metrics",
                    platformsUsed : "DSpace",
                    privacy : "private",
                    projectTitle : "Gravimetry run campaign over the Azores",
                    projused : "/r/project/84ab852f-322c-485d-a7a9-0513ab55c6ea",
                    repository : "http://demo.dspace.org ",
                    uri : "/r/deposit/1f22e7d9-9db5-494b-ae84-feb0bd6c906c",
                    user : "demouser1"
                };
                let deposit3 = {
                    creator : null,
                    date : "2017-9-28T19:54:56+00:00",
                    folder : "/r/folder/e5ccb0da-743d-4aff-88c9-8728db99339b",
                    folderName : "gravimetry01",
                    label : "B2Share Metrics",
                    platformsUsed : "EUDAT B2Share",
                    privacy : "private",
                    projectTitle : "Gravimetry run campaign over the Azores",
                    projused : "/r/project/84ab852f-322c-485d-a7a9-0513ab55c6ea",
                    repository : "trng-b2share.eudat.eu",
                    uri : "/r/deposit/1f22e7d9-9db5-494b-ae84-feb0bd6c906c",
                    user : "demouser2"
                };
                let deposit4 = {
                    creator : null,
                    date : "2017-10-28T19:54:56+00:00",
                    folder : "/r/folder/e5ccb0da-743d-4aff-88c9-8728db99339b",
                    folderName : "gravimetry01",
                    label : "B2Share Metrics",
                    platformsUsed : "Zenodo",
                    privacy : "private",
                    projectTitle : "Gravimetry run campaign over the Azores",
                    projused : "/r/project/84ab852f-322c-485d-a7a9-0513ab55c6ea",
                    repository : "http://www.zenodo.org/",
                    uri : "/r/deposit/1f22e7d9-9db5-494b-ae84-feb0bd6c906c",
                    user : "demouser1"
                };
                let deposit5 = {
                    creator : null,
                    date : "2017-11-28T19:54:56+00:00",
                    folder : "/r/folder/e5ccb0da-743d-4aff-88c9-8728db99339b",
                    folderName : "gravimetry01",
                    label : "Ckan demo",
                    platformsUsed : "CKAN",
                    privacy : "private",
                    projectTitle : "Gravimetry run campaign over the Azores",
                    projused : "/r/project/84ab852f-322c-485d-a7a9-0513ab55c6ea",
                    repository : "http://demo.ckan.org",
                    uri : "/r/deposit/1f22e7d9-9db5-494b-ae84-feb0bd6c906c",
                    user : "demouser4"
                };
                let deposit6 = {
                    creator : null,
                    date : "2017-11-28T19:54:56+00:00",
                    folder : "/r/folder/e5ccb0da-743d-4aff-88c9-8728db99339b",
                    folderName : "gravimetry01",
                    label : "figshare demo",
                    platformsUsed : "Figshare",
                    privacy : "private",
                    projectTitle : "Gravimetry run campaign over the Azores",
                    projused : "/r/project/84ab852f-322c-485d-a7a9-0513ab55c6ea",
                    repository : "http://figshare.org",
                    uri : "/r/deposit/1f22e7d9-9db5-494b-ae84-feb0bd6c906c",
                    user : "demouser4"
                };
                let deposit7 = {
                    creator : null,
                    date : "2017-09-15T19:54:56+00:00",
                    folder : "/r/folder/e5ccb0da-743d-4aff-88c9-8728db99339b",
                    folderName : "gravimetry01",
                    label : "figshare demo",
                    platformsUsed : "EPrints",
                    privacy : "private",
                    projectTitle : "Gravimetry run campaign over the Azores",
                    projused : "/r/project/84ab852f-322c-485d-a7a9-0513ab55c6ea",
                    repository : "http://eprints.org",
                    uri : "/r/deposit/1f22e7d9-9db5-494b-ae84-feb0bd6c906c",
                    user : "demouser4"
                };

                var depositsSet =[deposit,deposit2,deposit3,deposit4,deposit5,deposit6,deposit7];
                setTimeline(depositsSet);
                setGraphs(depositsSet);

                //$scope.startDeposits();

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
                    };

                $http({
                    method: "GET",
                    url: url,
                    params: param,
                    contentType: "application/json",
                    headers: {"Accept": "application/json"}
                }).then(function (response) {
                    let deposits = response.data;
                    setTimeline(deposits);
                }).catch(function (error) {
                    console.log(error);
                });
            };

            function setTimeline(deposits) {
                for (let i =0; i < deposits.length; i++){
                    let event = {};
                    var pastTime =moment(deposits[i].date,"YYYY-MM-DDTHH:mmZ").fromNow();
                    var depositDate =moment(deposits[i].date,"YYYY-MM-DDTHH:mmZ");


                    event.when = " Deposited "+ pastTime;
                    event.depositAnchor = deposits[i].uri;
                    event.title = "Deposit at " + deposits[i].platformsUsed;
                    event.content = "Deposit created at " + deposits[i].repository + " was created by "+ deposits[i].user + " on the "
                            + depositDate.date()+ "/"
                            + (depositDate.month()+1) +"/" + depositDate.year(); + " for the "+ deposits[i].projectTitle + " project.";7
                    event.shortDate = depositDate.date()+ " of "+ depositDate.month();

                    if (deposits[i].platformsUsed === "CKAN"){
                        event.badgeClass = "ckan";
                        event.badgeIconClass = "glyphicon-copy";
                        event.image = "https://avatars1.githubusercontent.com/u/1630326?s=400&v=4";
                        $scope.events.push(event);
                    }
                    else if (deposits[i].platformsUsed === "Zenodo"){
                        event.badgeClass = "zenodo";
                        event.badgeIconClass = "glyphicon-copy";
                        event.image = "https://upload.wikimedia.org/wikipedia/commons/0/0f/Zenodo_logo.jpg";
                        $scope.events.push(event);
                    }
                    else if (deposits[i].platformsUsed === "EUDAT B2Share"){
                        event.badgeClass = "b2share";
                        event.badgeIconClass = "glyphicon-copy";
                        event.image = "https://www.eudat.eu/sites/default/files/logo-b2share.png";
                        $scope.events.push(event);
                    }
                    else if (deposits[i].platformsUsed === "Figshare"){
                        event.badgeClass = "figshare";
                        event.badgeIconClass = "glyphicon-copy";
                        event.image = "https://pbs.twimg.com/profile_images/1756579306/spiralsticker.png";
                        $scope.events.push(event);
                    }
                    else if (deposits[i].platformsUsed === "DSpace"){
                        event.badgeClass = "dspace";
                        event.badgeIconClass = "glyphicon-copy";
                        event.image = "http://www.dspace.org/sites/dspace.org/files/dspace_logo_0.png";
                        $scope.events.push(event);
                    }
                    else if (deposits[i].platformsUsed === "EPrints"){
                        event.badgeClass = "eprints";
                        event.badgeIconClass = "glyphicon-copy";
                        event.image = "http://www.eprints.org/uk/wp-content/uploads/EprintsServices2015url-small.png";
                        $scope.events.push(event);
                    }
                }
            }

            $scope.events = [];


            function setGraphs(deposits) {
                var platforms = new Map();
                platforms.set("Zenodo" ,0);
                platforms.set("CKAN",0);
                platforms.set("EUDAT B2Share",0,);
                platforms.set("Figshare",0,);
                platforms.set("DSpace",0,);
                platforms.set("EPrints",0);

                for (let i =0; i < deposits.length; i++){
                    let event = {};
                    var depositDate =moment(deposits[i].date,"YYYY-MM-DDTHH:mmZ");
                    $scope.labels.push(moment().month(depositDate.month()).format('MMMM'));
                    platforms.set(deposits[i].platformsUsed, platforms.get(deposits[i].platformsUsed) + 1 );
                }
            }







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
