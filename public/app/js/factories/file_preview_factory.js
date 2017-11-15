/**
 * Created by Filipe on 01/09/2014.
 */
angular.module("dendroApp.factories")
    .factory("preview", function ($http)
    {
        return {
            available: function (fileExtension)
            {
                if (!fileExtension)
                {
                    return false;
                }
                fileExtension = fileExtension.toLowerCase();
                if (this.load_views()[fileExtension] != null)
                {
                    return true;
                } return;
            },
            load: function ($scope, fileExtension, fileUri)
            {
                fileExtension = fileExtension.toLowerCase();
                if (this.load_views()[fileExtension] != null)
                {
                    this.load_views()[fileExtension]($scope, fileExtension, fileUri);
                }
            },
            load_dataset: function ($scope, fileExtension, fileUri)
            {
                fileUri = fileUri + "?data&format=csv";

                var dataset = new recline.Model.Dataset({
                    url: fileUri,
                    backend: "csv"
                });

                dataset.fetch().done(function (loadedData)
                {
                    var views = [
                        {
                            id: "grid",
                            label: "Grid",
                            view: new recline.View.SlickGrid({
                                model: dataset,
                                state: {
                                    gridOptions: {
                                        autoHeight: true,
                                        editable: false,
                                        // Enable support for row add
                                        enabledAddRow: false,
                                        // Enable support for row delete
                                        enabledDelRow: false,
                                        // Enable support for row Reoder
                                        enableReOrderRow: false,
                                        autoEdit: false,
                                        enableCellNavigation: true,
                                        enableColumnReorder: false
                                    }
                                }
                            })
                        },
                        {
                            id: "graph",
                            label: "Graph",
                            view: new recline.View.Graph({
                                model: dataset

                            })
                        },
                        {
                            id: "map",
                            label: "Map",
                            view: new recline.View.Map({
                                model: dataset,
                                state: {
                                    autoZoom: true,
                                    cluster: false
                                }
                            })
                        }
                    ];
                    var sidebarViews = [
                        {
                            id: "filterEditor", // used for routing
                            label: "Filters", // used for view switcher
                            view: new recline.View.FilterEditor({
                                model: dataset
                            })
                        }
                    ];
                    var multi_view = new recline.View.MultiView({
                        model: dataset,
                        views: views,
                        sidebarViews: sidebarViews,
                        el: angular.element("#data-viewer")
                    });

                    multi_view.visible = true;
                }).fail(function (err)
                {
                    console.log(err);
                });
            },
            load_text: function ($scope, fileExtension, fileUri)
            {
                angular.element("#data-viewer").html("");
                fileUri = fileUri + "?serve";

                $http.get(fileUri)
                    .then(function (response)
                    {
                        var data = response.data;
                        angular.element("#data-viewer").append("<div id=\"text-file-content\"></div>");
                        var pre = angular.element("<pre class=\"prettyprint\"></pre>");
                        if (data.constructor == Object)
                        {
                            data = JSON.stringify(data, null, 4);
                        }
                        pre.text(data);
                        angular.element("#text-file-content").append(pre);

                        prettyPrint();
                    })
                    .catch(function (error)
                    {
                        if (error.message != null)
                        {
                            $scope.show_popup("error", "Error", error.message);
                        }
                    });
            },
            load_image: function ($scope, fileExtension, fileUri)
            {
                angular.element("#data-viewer").html("");
                fileUri = fileUri + "?serve";

                $http.get(fileUri)
                    .then(function (response)
                    {
                        var data = response.data;
                        angular.element("#data-viewer").append("<img id=\"image-file-preview\" src=\"" + fileUri + "\" />");
                    })
                    .catch(function (error)
                    {
                        if (error.message != null)
                        {
                            $scope.show_popup("error", "Error", error.message);
                        }
                    });
            },
            load_pdf: function ($scope, fileExtension, fileUri)
            {
                angular.element("#data-viewer").html("");
                var is_chrome = navigator.userAgent.toLowerCase().indexOf("chrome") > -1;

                if (is_chrome)
                {
                    var downloadFileUri = fileUri + "?download";
                    angular.element("#data-viewer").append(
                        "<div class=\"row\" ng-if=\"!preview_available()\">" +
                        "<br/>" +
                        "<div class=\"col-xs-12\">" +
                        "<div class=\"alert alert-info\">" +
                        "PDF Previews are not yet supported when using Google Chrome. " +
                        "<a href=\"" + downloadFileUri + "\">Download file</a> ." +
                        "</div>" +
                        "</div>" +
                        "</div>");
                }
                else
                {
                    fileUri = fileUri + "?serve_base64";

                    $http.get(fileUri)
                        .then(function (response)
                        {
                            var data = response.data;
                            angular.element("#data-viewer").append("<iframe id=\"pdf-file-preview\" src=\"data:application/pdf;base64," + data + "\" ></iframe>");
                        })
                        .catch(function (error)
                        {
                            if (error.message != null)
                            {
                                $scope.show_popup("error", "Error", error.message);
                            }
                        });
                }
            },
            load_audio: function ($scope, fileExtension, fileUri)
            {
                angular.element("#data-viewer").html("");
                var types = {
                    mp3: "audio/mpeg",
                    wav: "audio/wav",
                    ogg: "audio/ogg"
                };
                if (types[fileExtension] == null)
                {
                    $scope.show_popup("error", "Error", "Error playing audio file.");
                    return;
                }

                fileUri = fileUri + "?serve_base64";

                $http.get(fileUri)
                    .then(function (response)
                    {
                        var data = response.data;
                        angular.element("#data-viewer").append("<audio preload=\"auto\" controls=\"controls\" id=\"audio-file-preview\"></audio>");

                        var src = angular.element("<source src=\"data:" + types[fileExtension] + ";base64," + data + "\">");

                        angular.element("#audio-file-preview").append(src);
                        angular.element("#audio-file-preview").append("Your browser does not support the audio tag.");
                    })
                    .catch(function (error)
                    {
                        if (error.message != null)
                        {
                            $scope.show_popup("error", "Error", error.message);
                        }
                    });
            },
            load_video: function ($scope, fileExtension, fileUri)
            {
                angular.element("#data-viewer").html("");
                var types = {
                    mp4: "video/mp4",
                    webm: "video/webm",
                    ogg: "video/ogg",
                    "3gp": "video/3gp",
                    flv: "video/flv"
                };
                if (types[fileExtension] == null)
                {
                    $scope.show_popup("error", "Error", "Error playing audio file.");
                    return;
                }

                fileUri = fileUri + "?serve_base64";

                $http.get(fileUri)
                    .then(function (response)
                    {
                        var data = response.data;
                        angular.element("#data-viewer").append("<video preload=\"auto\" controls=\"controls\"  id=\"video-file-preview\"></video>");

                        var src = angular.element("<source src=\"data:" + types[fileExtension] + ";base64," + data + "\">");

                        angular.element("#video-file-preview").append(src);
                        angular.element("#video-file-preview").append("Your browser does not support the video tag.");
                    })
                    .catch(function (error)
                    {
                        if (error.message != null)
                        {
                            $scope.show_popup("error", "Error", error.message);
                        }
                    });
            },
            load_views: function ()
            {
                return {
                    xls: this.load_dataset,
                    xlsx: this.load_dataset,
                    csv: this.load_dataset,
                    c: this.load_text,
                    css: this.load_text,
                    h: this.load_text,
                    htm: this.load_text,
                    html: this.load_text,
                    js: this.load_text,
                    json: this.load_text,
                    log: this.load_text,
                    php: this.load_text,
                    txt: this.load_text,
                    rdf: this.load_text,
                    xml: this.load_text,
                    bmp: this.load_image,
                    gif: this.load_image,
                    ico: this.load_image,
                    jpg: this.load_image,
                    jpeg: this.load_image,
                    png: this.load_image,
                    svg: this.load_image,
                    pdf: this.load_pdf,
                    mp3: this.load_audio,
                    wav: this.load_audio,
                    mp4: this.load_video,
                    ogg: this.load_video,
                    webm: this.load_video

                };
            }

        };
    });
