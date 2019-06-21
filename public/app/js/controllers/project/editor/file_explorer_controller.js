angular.module("dendroApp.controllers")
/*
    *  File Browser controller
    */
    .controller("fileExplorerCtrl", function (
        $scope,
        $rootScope,
        $http,
        $filter,
        $q,
        $log,
        $timeout,
        $compile,
        Upload,
        focus,
        preview,
        $localStorage,
        metadataService,
        windowService,
        cacheService,
        filesService,
        interactionsService,
        ontologiesService,
        storageService,
        recommendationService,
        usersService,
        ContextMenuEvents,
        Utils
    )
    {
        $scope.menuOptions = function (item)
        {
            if (!$scope.shared.multiple_selection_active)
            {
                $scope.clear_selected_files();
            }
            item.selected = true;
            var items;

            if (item && item.ddr.fileExtension === "folder")
            {
                items = [];

                if ($scope.runningOnSmartphoneOrTablet())
                {
                    items.push(
                        {
                            click: function ($itemScope, $event, modelValue, text, $li)
                            {
                                $scope.open_for_mobile_devices();
                            },
                            html: function ()
                            {
                                return "<a href=\"#\"><img class=\"icon16\" id=\"open_folder_button\" src=\"/images/icons/folder_vertical_open.png\">Open</a></li>";
                            },
                            children: null
                        });
                }

                items.push({
                    click: function ($itemScope, $event, modelValue, text, $li)
                    {
                        $scope.download_selected_items();
                    },
                    html: function ()
                    {
                        return "<a href=\"#\"><img class=\"icon16\" data-loading-text=\"Downloading...\" src=\"/images/icons/arrow_down.png\">&nbsp;Download</a>";
                    },
                    children: null
                });

                items.push({
                    click: function ($itemScope, $event, modelValue, text, $li)
                    {
                        $scope.backup_folder();
                    },
                    html: function ()
                    {
                        return "<a href=\"#\"><img class=\"icon16\" data-loading-text=\"Backup...\" src=\"/images/icons/folder_vertical_zipper.png\">&nbsp;Backup</a>";
                    },
                    children: null
                });
            }
            else
            {
                items = [
                    {
                        click: function ($itemScope, $event, modelValue, text, $li)
                        {
                            $scope.download_selected_items();
                        },
                        html: function ()
                        {
                            return "<a href=\"#\"><img class=\"icon16\" data-loading-text=\"Downloading...\" src=\"/images/icons/arrow_down.png\">&nbsp;Download</a>";
                        },
                        children: null
                    }
                ];
            }

            items.push({
                click: function ($itemScope, $event, modelValue, text, $li)
                {
                    $scope.rename();
                },
                html: function ()
                {
                    return "<a href=\"#\"><img class=\"icon16\" src=\"/images/icons/textfield_rename.png\">&nbsp;Rename</a>";
                },
                children: null
            });

            /* items.push({
                click: function ($itemScope, $event, modelValue, text, $li)
                {
                    $scope.copy();
                },
                html: function ()
                {
                    return "<a href=\"#\"><img class=\"icon16\" src=\"/images/icons/page_copy.png\">&nbsp;Copy</a>";
                },
                children: null
            });*/

            items.push({
                click: function ($itemScope, $event, modelValue, text, $li)
                {
                    $scope.cut();
                },
                html: function ()
                {
                    return "<a href=\"#\"><img class=\"icon16\" src=\"/images/icons/cut.png\">&nbsp;Cut</a>";
                },
                children: null
            });

            if ($scope.file_explorer_selected_something())
            {
                if ($scope.file_explorer_selected_contains_deleted())
                {
                    items.push({
                        click: function ($itemScope, $event, modelValue, text, $li)
                        {
                            $scope.delete_file_or_folder();
                        },
                        html: function ()
                        {
                            return "<a href=\"#\"><img class=\"icon16\" data-loading-text=\"Deleting...\" src=\"/images/icons/cross.png\">&nbsp;Delete (files already deleted will be lost forever!)</a>";
                        },
                        children: null
                    });
                }
                else
                {
                    items.push({
                        click: function ($itemScope, $event, modelValue, text, $li)
                        {
                            $scope.delete_file_or_folder();
                        },
                        html: function ()
                        {
                            return "<a href=\"#\"><img class=\"icon16\" data-loading-text=\"Deleting...\" src=\"/images/icons/cross.png\">&nbsp;Delete</a>";
                        },
                        children: null
                    });
                }
            }

            if (item.ddr)
            {
                if (item.ddr.deleted)
                {
                    items.push({
                        click: function ($itemScope, $event, modelValue, text, $li)
                        {
                            $scope.undelete_file_or_folder();
                        },
                        html: function ()
                        {
                            return "<a href=\"#\"><img class=\"icon16\" data-loading-text=\"Deleting...\" src=\"/images/icons/redo.png\">&nbsp;Undelete</a>";
                        },
                        children: null
                    });
                }
            }

            return items;
        };

        $scope.thumbnailable = function (file)
        {
            if (!Utils.isNull($rootScope.config))
            {
                const thumbnailable = $rootScope.config.thumbnailable_file_extensions[file.ddr.fileExtension];

                if (!Utils.isNull(thumbnailable))
                {
                    return true;
                }
                return false;
            }
            return false;
        };

        $scope.delete_file_or_folder = function ()
        {
            var selectedFiles = $scope.get_selected_files();
            if (selectedFiles.length > 0)
            {
                var message = "Are you sure you want to delete the current selection?\n\nFiles already marked as deleted will be deleted FOREVER!";

                bootbox.confirm(message, function (result)
                {
                    if (result)
                    {
                        async.mapSeries(selectedFiles, function (selectedFile, callback)
                        {
                            var forever = selectedFile.ddr.deleted;
                            var successMessage;

                            var extension = selectedFile.ddr.fileExtension;
                            if (extension === "folder")
                            {
                                successMessage = "Folder " + selectedFile.nie.title + " deleted successfully";
                            }
                            else
                            {
                                successMessage = "File " + selectedFile.nie.title + " deleted successfully";
                            }

                            filesService.rm(selectedFile,
                                forever
                            ).then(function (response)
                            {
                                callback(null, response);
                                $scope.show_popup("success", "Success", successMessage);
                            })
                                .catch(function (e)
                                {
                                    console.log("error", "Unable to delete " + selectedFile.uri + JSON.stringify(e));
                                    windowService.show_popup("error", "Error", e.statusText);
                                    callback(1, "Unable to delete " + selectedFile.uri);
                                });
                        }, function (err, results)
                        {
                            if (!err)
                            {
                                $scope.clear_selected_files();
                                $scope.load_folder_contents($scope.shared.showing_deleted_files);
                                $scope.load_metadata();
                            }
                        });
                    }
                });
            }
        };

        $scope.undelete_file_or_folder = function ()
        {
            var selectedFiles = $scope.get_selected_files();
            if (selectedFiles.length > 0)
            {
                var message = "Are you sure you want to undelete the current selection?";

                bootbox.confirm(message, function (result)
                {
                    if (result)
                    {
                        async.mapSeries(selectedFiles, function (selectedFile, callback)
                        {
                            const extension = selectedFile.ddr.fileExtension;

                            let successMessage;

                            if (extension === "folder")
                            {
                                successMessage = "Folder " + selectedFile.nie.title + " undeleted successfully";
                            }
                            else
                            {
                                successMessage = "File " + selectedFile.nie.title + " undeleted successfully";
                            }

                            filesService.undelete(selectedFile).then(function (response)
                            {
                                callback(null, response);
                                $scope.show_popup("success", "Success", successMessage);
                            })
                                .catch(function (e)
                                {
                                    console.log("error", "Unable to delete " + selectedFile.uri + JSON.stringify(e));
                                    windowService.show_popup("error", "Error", e.statusText);
                                });
                        }, function (err, results)
                        {
                            if (!err)
                            {
                                $scope.clear_selected_files();
                                $scope.load_folder_contents($scope.shared.showing_deleted_files);
                                $scope.load_metadata();
                            }
                        });
                    }
                });
            }
        };

        $scope.toggle_upload_area = function ()
        {
            angular.element("#upload_droparea_button").triggerHandler("click");
            // $scope.upload_area_visible = !$scope.upload_area_visible;
            // $scope.restore_area_visible = false;
        };

        $scope.toggle_restore_area = function ()
        {
            angular.element("#upload_restore_droparea_button").triggerHandler("click");
            // $scope.upload_area_visible = false;
            // $scope.restore_area_visible = !$scope.restore_area_visible;
        };

        $scope.mkdir = function ()
        {
            bootbox.prompt("Please enter the name of the new folder", function (newFolderName)
            {
                if (!Utils.isNull(newFolderName))
                {
                    if (!newFolderName.match(/^[^\\\/:*?"<>|]{1,}$/g))
                    {
                        bootbox.alert("Invalid folder name specified", function ()
                        {
                        });
                    }
                    else
                    {
                        if (!Utils.isNull(newFolderName))
                        {
                            filesService.mkdir(newFolderName,
                                $scope.get_calling_uri()
                            ).then(function (result)
                            {
                                $scope.load_folder_contents();
                            }).catch(function (error)
                            {
                                console.log("error", "Unable to create new folder " + JSON.stringify(error));
                                windowService.show_popup("error", " There was an error creating the new folder", "Server returned status code " + status + " and message :\n" + error);
                            });
                        }
                    }
                }
            });
        };

        $scope.rename = function ()
        {
            var selectedFiles = $scope.get_selected_files();
            if (selectedFiles.length === 1)
            {
                bootbox.prompt("Please enter the new name", function (newName)
                {
                    if (!Utils.isNull(newName))
                    {
                        if (!newName.match(/^[^\\\/:*?"<>|]{1,}$/g))
                        {
                            bootbox.alert("Invalid name specified", function ()
                            {
                            });
                        }
                        else
                        {
                            if (!Utils.isNull(newName))
                            {
                                filesService.rename(newName,
                                    selectedFiles[0].uri
                                ).then(function (result)
                                {
                                    $scope.load_folder_contents();
                                    windowService.show_popup("success", "OK", "Rename successful");
                                }).catch(function (error)
                                {
                                    console.log("error", "Unable to rename resource: " + JSON.stringify(error));
                                    windowService.show_popup("error", "There was an error renaming the resource", error.data.message);
                                });
                            }
                        }
                    }
                });
            }
            else
            {
                windowService.show_popup("warning", "Selection a file or folder", "Please select a single file or folder before renaming", 1000);
            }
        };

        $scope.cut = function ()
        {
            $scope.clear_clipboard(true);
            if ($scope.get_selected_files().length > 0)
            {
                $localStorage.cut_files = $scope.get_selected_files();
                $scope.cut_files = $scope.get_selected_files();
                windowService.show_popup("info", $scope.cut_files.length + " files cut", "Go to the target folder and paste them", 700);
            }
            else
            {
                windowService.show_popup("warning", "Nothing selected", "Please select the files before cutting", 1000);
            }
        };

        $scope.copy = function ()
        {
            $scope.clear_clipboard(true);
            if ($scope.get_selected_files().length > 0)
            {
                $localStorage.copied_files = $scope.get_selected_files();
                $scope.copied_files = $scope.get_selected_files();
                windowService.show_popup("info", $scope.copied_files.length + " files copied", "Go to the target folder and paste them", 700);
            }
            else
            {
                windowService.show_popup("warning", "Nothing selected", "Please select the files before copying", 1000);
            }
        };

        $scope.open_for_mobile_devices = function ()
        {
            var selectedFiles = $scope.get_selected_files();
            if (!Utils.isNull(selectedFiles) && selectedFiles instanceof Array && selectedFiles.length > 0)
            {
                var selectedFolder = $scope.get_selected_files()[0];

                $scope.shared.initial_metadata = $filter("filter")($scope.shared.initial_metadata, $scope.only_editable_metadata_descriptors);
                $scope.shared.metadata = $filter("filter")($scope.shared.metadata, $scope.only_editable_metadata_descriptors);
                $scope.change_location(
                    selectedFolder.uri,
                    metadataService.dirty_metadata(
                        $scope.shared.initial_metadata,
                        $scope.shared.metadata
                    )
                );
                $scope.lastClickInFileExplorer = null;
            }
        };

        $scope.get_clipboard_file_count = function ()
        {
            if (!Utils.isNull($scope.copied_files) && $scope.copied_files instanceof Array)
            {
                if ($scope.copied_files.length > 0)
                {
                    return $scope.copied_files.length;
                }
                else if ($scope.cut_files.length > 0)
                {
                    return $scope.cut_files.length;
                }
            }
            return 0;
        };

        $scope.files_exist_in_clipboard = function ()
        {
            return ($scope.get_clipboard_file_count() > 0);
        };

        $scope.clear_clipboard = function (hide_popup)
        {
            $scope.copied_files = [];
            $localStorage.copied_files = [];
            $scope.cut_files = [];
            $localStorage.cut_files = [];

            if (!hide_popup)
            {
                windowService.show_popup("info", "Clipboard cleared", "No files waiting to be copied or moved", 700);
            }
        };

        $scope.paste = function ()
        {
            if ($scope.cut_files.length > 0)
            {
                filesService.cut($scope.cut_files, $scope.get_calling_uri())
                    .then(function (response)
                    {
                        windowService.show_popup("success", "Files moved", response.data.message);
                        $scope.clear_clipboard(true);
                        $scope.load_folder_contents($scope.showing_deleted_files);
                    })
                    .catch(function (error)
                    {
                        console.log("error", JSON.stringify(error));
                        windowService.show_popup("error", "Error moving files.", error.data.message, 5000);
                    });
            }
            else if ($scope.copied_files.length > 0)
            {
                filesService.copy($scope.copied_files, $scope.get_calling_uri())
                    .then(function (response)
                    {
                        windowService.show_popup("success", "Files copied", response.data.message);
                        $scope.clear_clipboard(true);
                        $scope.load_folder_contents($scope.showing_deleted_files);
                    })
                    .catch(function (error)
                    {
                        console.log("error", JSON.stringify(error));
                        windowService.show_popup("error", "Error copying files", JSON.stringify(error.message), 5000);
                    });
            }
            else
            {
                windowService.show_popup("info", "Nothing selected", "Please select the files before cutting");
            }
        };

        $scope.upload_callback = function (err, result)
        {
            if (!err)
            {
                $scope.show_popup("success", "Success", "File uploaded successfully.");
                $scope.get_folder_contents(true);
            }
            else
            {
                $scope.show_popup("error", result.name, result.error);
            }
        };

        $scope.restore_callback = function (err, result)
        {
            if (!err)
            {
                $scope.show_popup("success", "Success", "Backup successfully restored");
                $scope.load_metadata();
                $scope.get_folder_contents(true);
            }
            else
            {
                $scope.show_popup("error", "Error", "There was an error restoring your data.");
            }
        };

        $scope.clear_selection_and_get_parent_metadata = function ()
        {
            $scope.clear_selected_files();
            return $scope.load_metadata();
        };

        $scope.toggle_select_file_at_index_for_multiple_selection = function (index)
        {
            if (!Utils.isNull($scope.shared.folder_contents) && $scope.shared.folder_contents instanceof Array)
            {
                if ($scope.shared.folder_contents.length > index)
                {
                    $scope.shared.folder_contents[index].selected = !$scope.shared.folder_contents[index].selected;
                }
            }
        };

        $scope.clicked_file_explorer_node = function (index, isProject)
        {
            if ($scope.shared.multiple_selection_active)
            {
                $scope.toggle_select_file_at_index_for_multiple_selection(index);
            }
            else
            {
                $scope.newClickInFileExplorer = {
                    index: index,
                    time_stamp: new Date()
                };

                if (Utils.isNull($scope.lastClickInFileExplorer))
                {
                    $scope.lastClickInFileExplorer = $scope.lastClickInFileExplorer = {
                        index: -1,
                        time_stamp: new Date(0)
                    };
                }

                var DOUBLE_CLICK_DELTA = 500;

                $scope.$watch("$scope.newClickInFileExplorer", function (val)
                {
                    if ($scope.newClickInFileExplorer)
                    {
                        // DOUBLE CLICK: Second click registered in the waiting for second click period
                        if ($scope.waitingForSecondClickInFileExplorer)
                        {
                            if ($scope.lastClickInFileExplorer.index === $scope.newClickInFileExplorer.index)
                            {
                                $scope.shared.initial_metadata = $filter("filter")($scope.shared.initial_metadata, $scope.only_editable_metadata_descriptors);
                                $scope.shared.metadata = $filter("filter")($scope.shared.metadata, $scope.only_editable_metadata_descriptors);
                                $scope.change_location(
                                    $scope.shared.folder_contents[index].uri,
                                    metadataService.dirty_metadata(
                                        $scope.shared.initial_metadata,
                                        $scope.shared.metadata
                                    )
                                );
                                // $scope.show_popup('success', "double click", "double click");
                                $scope.lastClickInFileExplorer = null;
                                return;
                            }
                            // over a different item in the file browser

                            $scope.select_item_in_folder_browser(index, isProject);
                        }
                        // SINGLE CLICK: Click registered after the second click waiting period
                        else
                        {
                            // over the previously selected item
                            if ($scope.lastClickInFileExplorer && $scope.lastClickInFileExplorer.index === $scope.newClickInFileExplorer.index && !Utils.isNull($scope.shared.selected_file))
                            {
                                $scope.deselect_item_in_folder_browser();
                                // $scope.show_popup('info', "SINGLE click", "SINGLE click");
                            }
                            // over a different item in the file browser
                            else
                            {
                                $scope.select_item_in_folder_browser(index, isProject);
                                // $scope.show_popup('info', "single click over a different item", "single click");
                            }

                            var set_double_click_timeout = function ()
                            {
                                $timeout(function ()
                                {
                                    $scope.waitingForSecondClickInFileExplorer = false;
                                    // $scope.show_popup('info', "No second click", "stopped waiting for double click");
                                }, DOUBLE_CLICK_DELTA);
                            };

                            $scope.waitingForSecondClickInFileExplorer = true;
                            set_double_click_timeout();
                        }

                        $scope.lastClickInFileExplorer = $scope.newClickInFileExplorer;
                    }
                });
            }
        };

        $scope.go_up_in_folder_explorer = function ()
        {
            $scope.confirm_change_of_resource_being_edited(function (confirmed)
            {
                if (confirmed)
                {
                    if ($scope.showing_project_root())
                    {
                        usersService.get_logged_user()
                            .then(function (user)
                            {
                                if (!user)
                                {
                                    window.location.href = "/projects/my";
                                }
                                else
                                {
                                    window.location.href = "/projects";
                                }
                            });
                    }
                    else
                    {
                        var url = window.location.href;
                        var regex = new RegExp("/[^/]*$");
                        var withoutLastSection = url.replace(regex, "/");

                        if (withoutLastSection.endsWith("/"))
                        {
                            withoutLastSection = withoutLastSection.substring(0, withoutLastSection.length - 1);
                        }

                        window.location.href = withoutLastSection;
                    }
                }
            },
            metadataService.dirty_metadata(
                $scope.shared.initial_metadata,
                $scope.shared.metadata
            )
            );
        };

        $scope.deselect_item_in_folder_browser = function ()
        {
            $scope.confirm_change_of_resource_being_edited(function (confirmed)
            {
                if (confirmed)
                {
                    $scope.clear_selected_files();

                    recommendationService.get_recommendations(
                        $scope.get_calling_uri(),
                        $scope.descriptor_filter,
                        $scope.shared.metadata,
                        $scope.recommend_already_filled_in,
                        $scope.recommendations_page,
                        $scope.recommendations_page_size
                    );

                    metadataService.load_metadata()
                        .then(
                            function (metadata)
                            {
                                $scope.reset_metadata(metadata);
                            }
                        );

                    if ($scope.preview_available())
                    {
                        $scope.load_preview();
                    }
                    if (!Utils.isNull(windowService.showing_history) && windowService.showing_history)
                    {
                        windowService.get_change_log();
                    }
                }
            }, $scope.dirty_metadata());
        };

        $scope.select_item_in_folder_browser = function (index, isProject)
        {
            $scope.confirm_change_of_resource_being_edited(function (confirmed)
            {
                if (confirmed)
                {
                    $scope.clear_selected_files();

                    $scope.get_folder_contents()
                        .then(
                            function (folderContents)
                            {
                                var newSelectedFile = folderContents[index];

                                $scope.set_selected_file(index);
                                if (isProject)
                                {
                                    recommendationService.get_recommendations(
                                        $scope.get_calling_uri(),
                                        $scope.descriptor_filter,
                                        $scope.shared.metadata,
                                        $scope.recommend_already_filled_in,
                                        $scope.recommendations_page,
                                        $scope.recommendations_page_size
                                    );
                                }

                                metadataService.load_metadata($scope.get_calling_uri())
                                    .then(function (metadata)
                                    {
                                        $scope.reset_metadata(metadata);
                                    });

                                if ($scope.preview_available()) // && !is_chrome())
                                {
                                    $scope.load_preview();
                                }
                                if (!Utils.isNull($scope.showing_history) && $scope.showing_history)
                                {
                                    $scope.get_change_log(newSelectedFile.uri);
                                }
                            }
                        );
                }
            }, $scope.dirty_metadata());
        };

        $scope.toggle_show_deleted_files = function ()
        {
            if (Utils.isNull($scope.shared.showing_deleted_files))
            {
                $scope.shared.showing_deleted_files = true;
            }
            else
            {
                $scope.shared.showing_deleted_files = !$scope.shared.showing_deleted_files;
            }

            storageService.save_to_local_storage("showing_deleted_files", $scope.shared.showing_deleted_files, "shared");

            if ($scope.shared.showing_deleted_files)
            {
                $scope.get_folder_contents(true);
            }
            else
            {
                $scope.get_folder_contents();
            }
        };

        $scope.toggle_multiple_selection = function ()
        {
            $scope.shared.multiple_selection_active = !$scope.shared.multiple_selection_active;
            if (!$scope.shared.multiple_selection_active)
            {
                $scope.clear_selected_files();
            }
        };

        $scope.toggle_select_all_files = function ()
        {
            $scope.shared.multiple_selection_active = !$scope.shared.multiple_selection_active;
            $scope.select_all_files($scope.shared.multiple_selection_active);
        };

        $scope.download_folder = function ()
        {
            windowService.download_url($scope.get_current_url(), "?download");
        };

        $scope.delete_deposit = function ()
        {
            window.location.href = $scope.get_current_url() + "?delete";
        };

        $scope.backup_folder = function ()
        {
            var selectedFiles = $scope.get_selected_files();
            if (selectedFiles.length && selectedFiles.length > 0)
            {
                $scope.backup_selected_items();
            }
            else
            {
                windowService.download_url($scope.get_current_url(), "?backup");
            }
        };

        $scope.get_restore_url = function ()
        {
            return URI($scope.get_calling_uri()).addSearch("restore").toString();
        };
        $scope.get_upload_url = function ()
        {
            return URI($scope.get_calling_uri()).addSearch("upload").toString();
        };
        $scope.get_resume_url = function ()
        {
            return URI($scope.get_calling_uri()).addSearch("resume").toString();
        };
        $scope.get_restart_url = function ()
        {
            return URI($scope.get_calling_uri()).addSearch("restart").toString();
        };

        $scope.init = function ()
        {
            $scope.set_from_local_storage_and_then_from_value("upload_area_visible", false);
            $scope.set_from_local_storage_and_then_from_value("restore_area_visible", false);
            $scope.set_from_local_storage_and_then_from_value("cut_files", []);
            $scope.set_from_local_storage_and_then_from_value("copied_files", []);
            $scope.set_from_local_storage_and_then_from_value("showing_deleted_files", false, $scope, "shared");

            $scope.modelOptionsObj = {
                debounce: 100
            };

            $scope.multiple = true;

            $scope.pattern = "*";
            $scope.acceptSelect = true;
            $scope.disabled = false;
            $scope.capture = "camera";

            /* $scope.validateObj= {
            size: {max: '2000MB', min: '1B'},
            height: {max: 12000},
            width: {max: 12000}
            //,
            //duration: {max: '5m'}
        }; */

            $scope.keepDistinct = true;
            $scope.maxFiles = 10;
            $scope.ignoreInvalid = false;

            $scope.allowDir = false;
            $scope.dropAvailable = true;
        };
    });
