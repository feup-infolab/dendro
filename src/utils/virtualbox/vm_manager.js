const _ = require("underscore");

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const virtualbox = require("virtualbox");

const VirtualBoxManager = function ()
{
};

VirtualBoxManager.vmName = Config.virtualbox.vmName;
VirtualBoxManager.reuseCheckpoints = Config.virtualbox.reuse_shapshots;
VirtualBoxManager.createCheckpoints = Config.virtualbox.create_snapshots;
VirtualBoxManager._destroyedSnapshotsOnce = false;
VirtualBoxManager._deletedSnapshots = {};

VirtualBoxManager.snapshotPrefix = "VirtualBoxManager_Snapshot_";
VirtualBoxManager.baselineSnapshot = "VirtualBoxManager_Baseline";

VirtualBoxManager.stopVM = function (callback)
{
    if (Config.virtualbox && Config.virtualbox.active)
    {
        virtualbox.isRunning(VirtualBoxManager.vmName, function (error, running)
        {
            if (isNull(error))
            {
                if (running)
                {
                    Logger.log("Stopping Virtualbox VM.");
                    virtualbox.stop(VirtualBoxManager.vmName, function startCallback (error)
                    {
                        if (isNull(error))
                        {
                            Logger.log("Stopped VM");
                        }
                        else
                        {
                            Logger.log("Failed to stop VM");
                            Logger.log("error", error);
                        }

                        callback(error);
                    });
                }
                else
                {
                    callback(null);
                }
            }
            else
            {
                callback(error);
            }
        });
    }
    else
    {
        callback(1, "Virtualbox flag not active in Deployment Config.");
    }
};

VirtualBoxManager.destroySnapshot = function (snapshotName, callback, onlyOnce)
{
    if (!(VirtualBoxManager._deletedSnapshots[snapshotName] && onlyOnce) || isNull(onlyOnce))
    {
        virtualbox.snapshotList(VirtualBoxManager.vmName, function (error, snapshotList, currentSnapshotUUID)
        {
            if (snapshotList && snapshotList instanceof Array)
            {
                const snapshotExists = _.filter(snapshotList, function (snapshot)
                {
                    return snapshot.name === snapshotName;
                }).length > 0;

                if (snapshotExists)
                {
                    virtualbox.snapshotDelete(VirtualBoxManager.vmName, snapshotName, function (error)
                    {
                        if (error) throw error;
                        else
                        {
                            VirtualBoxManager._deletedSnapshots[snapshotName] = true;
                            Logger.log("Snapshot " + snapshotName + " has been deleted!");
                            callback(error);
                        }
                    });
                }
                else
                {
                    callback(null);
                }
            }
            else
            {
                callback(null);
            }
        });
    }
    else
    {
        callback(null);
    }
};

VirtualBoxManager.returnToBaselineCheckpoint = function (callback)
{
    if (Config.virtualbox && Config.virtualbox.active)
    {
        Logger.log("Checking if baseline snapshot exists...");
        virtualbox.snapshotList(VirtualBoxManager.vmName, function (error, snapshotList, currentSnapshotUUID)
        {
            if (snapshotList && snapshotList instanceof Array)
            {
                Logger.log(JSON.stringify(snapshotList), JSON.stringify(currentSnapshotUUID));

                const baselineSnapshotExists = _.find(snapshotList, function (snapshot)
                {
                    if (snapshot.name === VirtualBoxManager.baselineSnapshot)
                    {
                        return true;
                    }

                    return false;
                });

                // if there is no reference checkpoint, we will create a new one.
                if (!baselineSnapshotExists)
                {
                    VirtualBoxManager.createCheckpoint(VirtualBoxManager.baselineSnapshot, callback, true);
                }
                else
                {
                    VirtualBoxManager.restoreCheckpoint(VirtualBoxManager.baselineSnapshot, callback, true);
                }
            }
            else
            {
                callback(null);
            }
        });
    }
    else
    {
        callback(1, "Virtualbox flag not active in Deployment Config.");
    }
};

VirtualBoxManager.destroyAllSnapshots = function (callback, onlyOnce)
{
    if (Config.virtualbox && Config.virtualbox.active)
    {
        if (onlyOnce && VirtualBoxManager._destroyedSnapshotsOnce)
        {
            Logger.log("Already deleted Virtualbox Snapshots once, skipping...");
            callback(null);
        }
        else
        {
            Logger.log("Deleting all existing snapshots...");
            virtualbox.snapshotList(VirtualBoxManager.vmName, function (error, snapshotList, currentSnapshotUUID)
            {
                if (snapshotList && snapshotList instanceof Array)
                {
                    Logger.log(JSON.stringify(snapshotList), JSON.stringify(currentSnapshotUUID));

                    const async = require("async");
                    async.mapSeries(snapshotList, function (snapshot, cb)
                    {
                        if (snapshot.name.startsWith(VirtualBoxManager.snapshotPrefix))
                        {
                            VirtualBoxManager.destroySnapshot(snapshot.name, cb);
                        }
                        else
                        {
                            cb(null);
                        }
                    }, function (err, results)
                    {
                        VirtualBoxManager._destroyedSnapshotsOnce = true;
                        callback(err, results);
                    });
                }
                else
                {
                    callback(null);
                }
            });
        }
    }
    else
    {
        callback(1, "Virtualbox flag not active in Deployment Config.");
    }
};

VirtualBoxManager.startVM = function (callback)
{
    if (Config.virtualbox && Config.virtualbox.active)
    {
        Logger.log("Starting Virtualbox VM.");

        virtualbox.start(VirtualBoxManager.vmName, function startCallback (error)
        {
            if (isNull(error))
            {
                Logger.log("Started VM");
                callback(null);
            }
            else
            {
                Logger.log("Failed to start VM");
                Logger.log("error", error);
                callback(error);
            }
        });
    }
    else
    {
        callback(1, "Virtualbox flag not active in Deployment Config.");
    }
};

VirtualBoxManager.checkpointExists = function (checkpointName, callback, dontAddPrefix)
{
    if (!dontAddPrefix)
    {
        checkpointName = VirtualBoxManager.snapshotPrefix + checkpointName;
    }

    if (Config.virtualbox && Config.virtualbox.active)
    {
        virtualbox.snapshotList(VirtualBoxManager.vmName, function (error, snapshotList, currentSnapshotUUID)
        {
            if (isNull(error))
            {
                if (snapshotList && snapshotList instanceof Array)
                {
                    const matchingSnapshots = _.filter(snapshotList, function (snapshot)
                    {
                        return snapshot.name === checkpointName;
                    });

                    if (matchingSnapshots.length > 0)
                    {
                        callback(null, true);
                    }
                    else
                    {
                        callback(null, false);
                    }
                }
                else
                {
                    callback(null, false);
                }
            }
            else
            {
                const msg = "Error retrieving list of snapshots of virtual machine " + VirtualBoxManager.vmName;
                Logger.log("error", msg);
                callback(error, msg);
            }
        });
    }
    else
    {
        callback(1, "Virtualbox flag not active in Deployment Config.");
    }
};

VirtualBoxManager.createCheckpoint = function (checkpointName, callback, dontAddPrefix)
{
    if (!dontAddPrefix)
    {
        checkpointName = VirtualBoxManager.snapshotPrefix + checkpointName;
    }

    if (Config.virtualbox && Config.virtualbox.active && Config.virtualbox.create_snapshots)
    {
        virtualbox.snapshotTake(VirtualBoxManager.vmName, checkpointName, function (error, uuid)
        {
            if (error)
            {
                callback(1, "Error taking snapshot!");
            }
            else
            {
                if (uuid)
                {
                    console.log("Snapshot has been taken!");
                    console.log("UUID: ", uuid);
                    callback(null);
                }
                else
                {
                    callback(2, "Null checkpoint id returned when creating a new checkpoint!");
                }
            }
        });
    }
    else
    {
        callback(null, "Skipping checkpoint restore because \"virtualbox.create_snapshots\" is not active in Deployment Config.");
    }
};

VirtualBoxManager.restoreCheckpoint = function (checkpointName, callback, dontAddPrefix)
{
    if (!dontAddPrefix)
    {
        checkpointName = VirtualBoxManager.snapshotPrefix + checkpointName;
    }

    if (Config.virtualbox && Config.virtualbox.active)
    {
        VirtualBoxManager.checkpointExists(checkpointName, function (err, exists)
        {
            if (isNull(err))
            {
                if (exists)
                {
                    VirtualBoxManager.stopVM(function (err, result)
                    {
                        if (isNull(err))
                        {
                            virtualbox.snapshotRestore(VirtualBoxManager.vmName, checkpointName, function (err, output)
                            {
                                if (isNull(err))
                                {
                                    VirtualBoxManager.startVM(function (err, result)
                                    {
                                        if (isNull(err))
                                        {
                                            console.log("Snapshot has been restored!");
                                            console.log("UUID: ", output);
                                            callback(null);
                                        }
                                        else
                                        {
                                            Logger.log("error", err);
                                            Logger.log("error", result);
                                            callback(err);
                                        }
                                    });
                                }
                                else
                                {
                                    Logger.log("error", err);
                                    Logger.log("error", output);
                                    callback(1, "Error restoring snapshot!");
                                }
                            });
                        }
                        else
                        {
                            Logger.log("error", err);
                            Logger.log("error", result);
                            callback(3, "Unable to stop virtual machine ");
                        }
                    });
                }
                else
                {
                    Logger.log("warn", err);
                    Logger.log("warn", exists);
                    callback(null, "Virtualbox checkpoint " + checkpointName + " not found. Continuing...");
                }
            }
            else
            {
                Logger.log("error", err);
                Logger.log("error", exists);
                callback(err, exists);
            }
        }, dontAddPrefix);
    }
    else
    {
        callback(null, "Skipping checkpoint restore because \"virtualbox.reuse_shapshots\" is not active in Deployment Config.");
    }
};

VirtualBoxManager.deleteVM = function (onlyOnce, evenCurrentState, callback)
{
    if (Config.virtualbox && Config.virtualbox.active)
    {
        const performOperation = function ()
        {
            Logger.log("Deleting Virtualbox VM.");

            Logger.log("Deleted VM.");
        };

        if (onlyOnce)
        {
            if (!VirtualBoxManager._deletedOnce)
            {
                performOperation();
                VirtualBoxManager._deletedOnce = true;
            }
        }
        else
        {
            performOperation();
        }
    }
    else
    {
        callback(1, "Virtualbox flag not active in Deployment Config.");
    }
};

VirtualBoxManager.restartVM = function (onlyOnce, callback)
{
    Logger.log("Restarting Virtualbox VM " + VirtualBoxManager.vmName);
    if (Config.virtualbox && Config.virtualbox.active)
    {
        const performOperation = function (callback)
        {
            Logger.log("Restarting VM " + VirtualBoxManager.vmName);

            virtualbox.acpipowerbutton(VirtualBoxManager.vmName, function (error)
            {
                if (error)
                {
                    Logger.log("error", "Virtual Machine " + VirtualBoxManager.vmName + "failed to stop");
                    Logger.log("error", error);
                    callback(error);
                }
                else
                {
                    Logger.log("Virtual Machine " + VirtualBoxManager.vmName + "has stopped");
                    virtualbox.start(VirtualBoxManager.vmName, function (error)
                    {
                        if (!isNull(error))
                        {
                            Logger.log("error", "Virtual Machine " + VirtualBoxManager.vmName + "failed to stop");
                            Logger.log("error", error);
                            callback(error);
                        }
                        else
                        {
                            Logger.log("Virtual Machine " + VirtualBoxManager.vmName + "restarted. ");
                            callback(null);
                        }
                    });
                }
            });
        };

        if (onlyOnce)
        {
            if (!VirtualBoxManager._restartedOnce)
            {
                performOperation();
                VirtualBoxManager._restartedOnce = true;
            }
        }
        else
        {
            performOperation(callback);
        }

        Logger.log("Restarted VM.");
    }
    else
    {
        callback(1, "Virtualbox flag not active in Deployment Config.");
    }
};

module.exports.VirtualBoxManager = VirtualBoxManager;
