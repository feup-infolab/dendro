angular.module("dendroApp.controllers", [])
/**
 *  Deposit registry controller
 */
    .controller("depositCtrl", function (
        $scope,
        $http,
        listings,
        focus,
        preview,
        $localStorage,
        $timeout,
        metadataService,
        windowService,
        projectsService,
        usersService
    )
    {
        $scope.active_tab = null;
        $scope.offset = 1;
        $scope.page = 5;
        $scope.totalDeposits = 0;

        $scope.search = {
            creator: {
                type: "text",
                label: "Username",
                key: "creator",
                value: ""
            },
            project: {
                type: "text",
                label: "Project",
                key: "project",
                value: ""
            },
            dateFrom: {
                type: "date",
                label: "Date Start",
                key: "dateFrom",
                value: ""
            },
            dateTo: {
                type: "date",
                label: "Date End",
                key: "dateTo",
                value: ""
            },
            privateDeposit: {
                type: "checkbox",
                label: "Private Deposits only",
                key: "private",
                value: false
            },
            system: {
                type: "checkbox",
                list: true,
                label: "Platform Used",
                key: "platforms",
                value: [
                    {
                        name: "CKAN",
                        value: true
                    },
                    {
                        name: "DSpace",
                        value: true
                    },
                    {
                        name: "EPrints",
                        value: true
                    },
                    {
                        name: "Figshare",
                        value: true
                    },
                    {
                        name: "Zenodo",
                        value: true
                    },
                    {
                        name: "EUDAT B2Share",
                        value: true
                    }
                ]
            },
            ordering: {
                type: "dropdown",
                list: true,
                label: "Order By",
                key: "order",
                selected: "Date",
                value: [
                    {
                        name: "Date"
                    },
                    {
                        name: "Username"
                    },
                    {
                        name: "Project"
                    }
                ]
            }
        };

        $scope.hostUrl = window.location.protocol + "//" + window.location.host + "/user/";

        $scope.init = function ()
        {
            $scope.getRegistry(true);
        };

        $scope.getRegistry = function (change)
        {
            const handle = function (data, change)
            {
                $scope.offset = 1;
                $scope.updateDeposits(data);
                $scope.totalDeposits = 1;

                if (change && data.repositories instanceof Array && data.repositories.length > 0)
                {
                    const repository = data.repositories;
                    $scope.search.repositories = {
                        type: "checkbox",
                        list: true,
                        label: "Repository Used",
                        key: "repositories",
                        change: false,
                        value: []
                    };
                    for (let repo of repository)
                    {
                        $scope.search.repositories.value.push({
                            name: repo.repository,
                            count: repo.count,
                            value: true
                        });
                        $scope.totalDeposits += parseInt(repo.count);
                    }
                }
                else if($scope.search.repositories !== undefined)
                {
                    for (let repo of $scope.search.repositories.value)
                    {
                        if (repo.value === true)
                        {
                            $scope.totalDeposits += parseInt(repo.count);
                        }
                    }
                }
                //$scope.totalDeposits = Math.ceil($scope.totalDeposits / $scope.page);
            };

            let url = $scope.get_current_url();
            url += "deposits/get_deposits";
            listings.getListing($scope, url, $scope.page, $scope.offset - 1, $scope.search, change, handle);
        };

        $scope.updateDeposits = function (data)
        {
            let deposits = data.deposits;
            for (let i = 0; i < deposits.length; i++)
            {
                deposits[i].date = moment(deposits[i].date).fromNow();
            }
            $scope.deposits = deposits;
        };

        $scope.changePage = function (pageNumber)
        {
            let url = $scope.get_current_url();
            url += "deposits/get_deposits";
            listings.getListing($scope, url, $scope.page, pageNumber - 1, $scope.search, false, $scope.updateDeposits);
            $scope.offset = pageNumber;
        };

        $scope.nextPage = function ()
        {
            let url = $scope.get_current_url();
            url += "deposits/get_deposits";
            listings.getListing($scope, url, $scope.page, ++$scope.offset - 1, $scope.search, false, $scope.updateDeposits);
        };
        $scope.previousPage = function ()
        {
            let url = $scope.get_current_url();
            url += "deposits/get_deposits";
            listings.getListing($scope, url, $scope.page, --$scope.offset - 1, $scope.search, false, $scope.updateDeposits);
        };

        $scope.showPerPage = function (amount)
        {
            $scope.page = amount;
            $scope.getRegistry();
        };

        $scope.deposits = [];
    })
    .directive("searchBar", function (

    )
    {
        return {
            restrict: "ACE",
            scope: true,
            replace: true,
            templateUrl: "/app/views/search/filter_table.ejs",
            link: function (scope, elem, attr)
            {
                scope.attr = function ()
                {
                    return attr.searchmodel;
                };
                scope.update = function (change)
                {
                    if (change == false)
                    {
                        return attr.searchfunction + "(false)";
                    }
                    return attr.searchfunction + "(true)";
                };
            }
        };
    })
    .directive("pageNavigation", function (

    )
    {
        return {
            restrict: "ACE",
            scope: true,
            replace: true,
            templateUrl: "/app/views/search/dynamic_pagination.ejs",
            link: function (scope, elem, attr)
            {
                scope.max = function ()
                {
                    return attr.maximum;
                };
                scope.change = function (page)
                {
                    return attr.changepage + "(" + page + ")";
                };
                scope.next = function ()
                {
                    return attr.nextpage + "()";
                };
                scope.previous = function ()
                {
                    return attr.previouspage + "()";
                };
                scope.current = function ()
                {
                    return attr.current;
                };
            }
        };
    });
