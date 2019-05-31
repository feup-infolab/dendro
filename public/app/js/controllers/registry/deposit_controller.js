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
        usersService,
        depositsService
    )
    {
        $scope.active_tab = null;
        $scope.search_settings = {
            offset: 1,
            page: 5,
            totalDeposits: 0
        };

        $scope.search = {

            creator: {
                type: "text",
                label: "Username",
                key: "creator",
                value: "",
                hidden: false
            },
            project: {
                type: "text",
                label: "Deposit title",
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
                list: true,
                label: "Privacy",
                key: "privacy",
                value: [
                    {
                        name: "Public",
                        value: true
                    },
                    {
                        name: "Private",
                        value: true
                    },
                    {
                        name: "Metadata only",
                        value: true
                    },
                    {
                        name: "Embargoed",
                        value: true
                    }]
            },
            system: {
                type: "checkbox",
                list: true,
                label: "Repository Used",
                key: "platforms",
                value: [
                    {
                        name: "CKAN",
                        count: "0",
                        value: true
                    },
                    {
                        name: "Dendro",
                        count: "0",
                        value: true
                    },
                    {
                        name: "DSpace",
                        count: "0",
                        value: true
                    },
                    {
                        name: "EPrints",
                        count: "0",
                        value: true
                    },
                    {
                        name: "Figshare",
                        count: "0",
                        value: true
                    },
                    {
                        name: "Zenodo",
                        count: "0",
                        value: true
                    },
                    {
                        name: "EUDAT B2Share",
                        count: "0",
                        value: true
                    }
                ]
            },
            ordering: {
                type: "dropdown",
                list: true,
                label: "Order By",
                key: "ordering",
                selected: "date descending",
                value: [
                    {
                        name: "date ascending"
                    },
                    {
                        name: "date descending"
                    },
                    {
                        name: "username ascending"
                    },
                    {
                        name: "username descending"
                    },
                    {
                        name: "deposits ascending"
                    },
                    {
                        name: "deposits descending"
                    }
                ]
            },
            descriptorTag: {
                type: "dropdown",
                list: true,
                label: "Descriptor Value",
                key: "descriptorTag",
                selected: "Any",
                value: [
                    {
                        name: "Any"
                    },
                    {
                        name: "All"
                    }
                ]
            },
            descriptors: {
                key: "descriptors",
                type: "dropdown",
                array: [
                    {
                        descriptor: "descri",
                        name: "name",
                        uri: "asas"
                    },
                    {
                        descriptor: "descri",
                        name: "asasas",
                        uri: "asas"
                    }
                ]},
            descriptor_autocomplete: {
                key: "descriptor_autocomplete"
            },
            identifier: {
                type: "text",
                label: "Identifier",
                key: "identifier",
                value: ""
            },
            description: {
                type: "text",
                label: "Description",
                key: "description",
                value: ""
            }
        };
        $scope.select_descriptor_from_autocomplete_webpage = function (suggestion, model, label)
        {
            if (suggestion !== null && suggestion instanceof Object)
            {
                var autocompletedDescriptor = JSON.parse(JSON.stringify(suggestion));
                var value = {descriptor: autocompletedDescriptor.label, uri: autocompletedDescriptor.uri, name: ""};
                $scope.search.descriptors.array.push(value);
            }
        };

        $scope.hostUrl = window.location.protocol + "//" + window.location.host + "/user/";

        $scope.initSingleDeposit = function (rootDepositUri, isRoot, depositUri)
        {
            $scope.rootDepositUri = rootDepositUri;
            $scope.isDepositRoot = isRoot;
            $scope.depositUri = depositUri;
        };

        $scope.init = function ()
        {
            $scope.getRegistry(true);
            $scope.asyncSelected = "";
        };

        $scope.$watch("asyncSelected", function ()
        {
            console.log("asasasasas");
        });

        $scope.myInit = function ()
        {
            usersService.get_logged_user()
                .then(function (user)
                {
                    $scope.loggedUser = user;
                    $scope.getMyRegistry(true);
                })
                .catch(function (error)
                {
                    $scope.show_popup("error", error, "Error fetching user", 20000);
                });
        };
        $scope.updateDeposits = function (data, change)
        {
            $scope.deposits = data.deposits;
        };

        $scope.getRegistry = function (change)
        {
            const handle = function (data, change)
            {
                $scope.deposits = data.deposits;

                $scope.offset = 1;
                // $scope.updateDeposits(data);
                $scope.totalDeposits = 0;

                if (change && data.repositories instanceof Array && data.repositories.length > 0)
                {
                    const repository = data.repositories;
                    let depositCount = 0;
                    for (let repo of repository)
                    {
                        for (let repoInSystem of $scope.search.system.value)
                        {
                            if (repo.repository === repoInSystem.name)
                            {
                                repoInSystem.count = repo.count;
                            }
                        }
                        depositCount += parseInt(repo.count);
                    }
                    $scope.search_settings.totalDeposits = Math.ceil(depositCount / $scope.search_settings.page);
                }
                else if (change && data.repositories instanceof Array && data.repositories.length === 0)
                {
                    for (let repo of $scope.search.system.value)
                    {
                        repo.count = "0";
                    }
                    $scope.search_settings.totalDeposits = 0;
                }
            };

            let url = $scope.get_current_url();
            url += "deposits/search";
            listings.getListing($scope, url, $scope.search_settings.page, $scope.search_settings.offset - 1, $scope.search, change, handle);
        };

        $scope.getMyRegistry = function (change)
        {
            const handle = function (data, change)
            {
                $scope.deposits = data.deposits;

                $scope.offset = 1;
                $scope.totalDeposits = 0;

                if (change && data.repositories instanceof Array && data.repositories.length > 0)
                {
                    const repository = data.repositories;
                    let depositCount = 0;
                    for (let repo of repository)
                    {
                        for (let repoInSystem of $scope.search.system.value)
                        {
                            if (repo.repository === repoInSystem.name)
                            {
                                repoInSystem.count = repo.count;
                            }
                        }
                        depositCount += parseInt(repo.count);
                    }
                    $scope.search_settings.totalDeposits = Math.ceil(depositCount / $scope.search_settings.page);
                }
                else if (change && data.repositories instanceof Array && data.repositories.length === 0)
                {
                    for (let repo of $scope.search.system.value)
                    {
                        repo.count = "0";
                    }
                    $scope.search_settings.totalDeposits = 0;
                }
            };
            $scope.search.creator.value = $scope.loggedUser.ddr.username;
            $scope.search.creator.hidden = true;
            let url = windowService.get_protocol_and_host();
            url += "/deposits/search";
            listings.getListing($scope, url, $scope.search_settings.page, $scope.search_settings.offset - 1, $scope.search, change, handle);
        };

        $scope.changeMyPage = function (pageNumber)
        {
            let url = windowService.get_protocol_and_host();
            url += "/deposits/search";
            listings.getListing($scope, url, $scope.search_settings.page, pageNumber - 1, $scope.search, false, $scope.updateDeposits);
            $scope.search_settings.offset = pageNumber;
        };

        $scope.nextMyPage = function ()
        {
            let url = windowService.get_protocol_and_host();
            url += "/deposits/search";
            listings.getListing($scope, url, $scope.search_settings.page, ++$scope.search_settings.offset - 1, $scope.search, false, $scope.updateDeposits);
        };
        $scope.previousMyPage = function ()
        {
            let url = windowService.get_protocol_and_host();
            url += "/deposits/search";
            listings.getListing($scope, url, $scope.search_settings.page, --$scope.search_settings.offset - 1, $scope.search, false, $scope.updateDeposits);
        };

        $scope.changePage = function (pageNumber)
        {
            let url = $scope.get_current_url();
            url += "deposits/search";
            listings.getListing($scope, url, $scope.search_settings.page, pageNumber - 1, $scope.search, false, $scope.updateDeposits);
            $scope.search_settings.offset = pageNumber;
        };

        $scope.nextPage = function ()
        {
            let url = $scope.get_current_url();
            url += "deposits/search";
            listings.getListing($scope, url, $scope.search_settings.page, ++$scope.search_settings.offset - 1, $scope.search, false, $scope.updateDeposits);
        };
        $scope.previousPage = function ()
        {
            let url = $scope.get_current_url();
            url += "deposits/search";
            listings.getListing($scope, url, $scope.search_settings.page, --$scope.search_settings.offset - 1, $scope.search, false, $scope.updateDeposits);
        };

        $scope.showPerPage = function (amount)
        {
            $scope.search_settings.page = amount;
            $scope.getRegistry();
        };

        $scope.getDepositConditions = function ()
        {
            depositsService.get_deposit_conditions($scope.depositUri)
                .then(function (response)
                {
                    $scope.conditionsAccepted = response.conditionsAccepted;
                    $scope.conditionsAccepting = response.conditionsAccepting;
                })
                .catch(function (error)
                {
                    $scope.show_popup("error", "Error occurred", JSON.stringify(error));
                    $scope.conditionsAccepted = [];
                    $scope.conditionsAccepting = [];
                });
        };
        $scope.changeUserAccess = function (condition, value, forDelete)
        {
            depositsService.change_user_access(condition, value, forDelete)
                .then(function (response)
                {
                    depositsService.get_deposit_conditions()
                        .then(function (response)
                        {
                            $scope.conditionsAccepted = response.conditionsAccepted;
                            $scope.conditionsAccepting = response.conditionsAccepting;
                        })
                        .catch(function (error)
                        {
                            $scope.show_popup("error", "Error occurred", JSON.stringify(error));
                        });
                })
                .catch(function (error)
                {
                    $scope.show_popup("error", "Error occurred", JSON.stringify(error));
                });
        };

        $scope.deposits = [];
    })
    .directive("searchBar", function ()
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
                    if (change === false)
                    {
                        return attr.searchfunction + "(false)";
                    }
                    return attr.searchfunction + "(true)";
                };
            }
        };
    })
    .directive("pageNavigation", function ()
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
