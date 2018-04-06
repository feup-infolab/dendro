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
                  metricsService,
                  $interval) {
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

            var depositsSet =[deposit,deposit2,deposit3,deposit4,deposit5,deposit6,deposit7,deposit7,deposit7,deposit7,deposit7,deposit7,deposit3,deposit4,deposit5];



            $scope.init = function () {
                //$scope.loadData();
               // $scope.getOwner();


                setTimeline(depositsSet);
               // setGraphs(depositsSet);
                setUserGraphs(depositsSet);

                //$scope.startDeposits();

            };

            $scope.initsplash = function () {
                //$scope.loadData();
                // $scope.getOwner();


                setTimeline(depositsSet);
                setGraphs(depositsSet);
               // setUserGraphs(depositsSet);

                //$scope.startDeposits();

            };



            $scope.updateData = function () {
                $scope.type = $scope.type === 'pie' ?
                    'polarArea' : 'pie';
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

            function setUserGraphs(deposits) {
                var depositers = new Map();

                for (let i =0; i < deposits.length; i++){
                    depositers.set(deposits[i].user, 0);
                }
                for (let j = 0; j < deposits.length; j++){
                    depositers.set(deposits[j].user,depositers.get(deposits[j].user) + 1)
                }
                for (var [key, value] of depositers.entries()) {
                    $scope.labels.push(key);
                    $scope.data.push(value);

                }
                console.log($scope.labels);

                console.log($scope.data);
            }


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
                    //$scope.labels2.push(moment().month(depositDate.month()).format('MMMM'));
                    platforms.set(deposits[i].platformsUsed, platforms.get(deposits[i].platformsUsed) + 1 );
                }
                for (var [key, value] of platforms.entries()) {
                    $scope.labels.push(key);
                    $scope.data.push(value);

                }
                console.log($scope.labels);

                console.log($scope.data);
            }


            $interval($scope.updateData, 10000);



            //Chart Block
            $scope.labels = [];
            $scope.data = [];
            $scope.type = 'pie';



            $scope.labels2 = ['September','October', 'November','December', 'January', 'February'];
            $scope.data2 = [
                [5, 3, 7,8,9],
                [5,4,6,8,10,10]
            ];

            $scope.colors = [
                "#75CAEB",
                "#397367",
                "#5da399",
                "#42858c",
                "#042a2b",
                "#05b2dc",
            ];

            $scope.depositscolors = [
                "#05b2dc",
                "#28B62C",
            ];


            $scope.options = {
                scales: {
                    yAxes: [
                        {
                            ticks: {
                                min: 0, // it is for ignoring negative step.
                                beginAtZero: true,
                            }
                        }
                    ]
                }
            };

            $scope.datasetOverride = [
                {
                label: "Deposits",
                borderWidth: 1,
                type: 'bar'
            },
                {
                    label: "Evolution Line",
                    borderWidth: 2,
                    type: 'line'
                }];
        });
