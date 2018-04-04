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
VirtualBoxManager.reuseCheckpoints = Config.virtualbox.reuseCheckpoints;
VirtualBoxManager._destroyedSnapshotsOnce = false;

VirtualBoxManager.stopVM = function (callback)
{
    if (Config.virtualbox && Config.virtualbox.active)
    {
        Logger.log("Stopping Virtualbox VM.");

        virtualbox.stop(VirtualBoxManager.vmName, function startCallback (error)
        {
            if (isNull(error))
            {
                Logger.log("Stopped VM");
                callback(error);
            }
            else
            {
                Logger.log("Failed to stop VM");
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

VirtualBoxManager.destroyAllSnapshots = function (callback, onlyOnce)
{
    if (Config.virtualbox && Config.virtualbox.active)
    {
        if(onlyOnce && VirtualBoxManager._destroyedSnapshotsOnce)
        {
            callback(null);
        }
        else
        {
            Logger.log("Deleting all existing snapshots...");
            virtualbox.snapshotList(VirtualBoxManager.vmName, function (error, snapshotList, currentSnapshotUUID)
            {
                if (snapshotList && snapshotList instanceof Array)
                {
                    console.log(JSON.stringify(snapshotList), JSON.stringify(currentSnapshotUUID));

                    const async = require("async");
                    async.mapSeries(snapshotList, function (snapshot, cb)
                    {
                        virtualbox.snapshotDelete(VirtualBoxManager.vmName, snapshot.name, function (error)
                        {
                            if (error) throw error;
                            Logger.log("Snapshot has been deleted!");
                            callback(error);
                        });
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

                if (!Config.virtualbox.reuse_shapshots)
                {
                    VirtualBoxManager.destroyAllSnapshots(function (err, result)
                    {
                        callback(err, result);
                    });
                }
                else
                {
                    Logger.log("Reusing VM snapshots...");
                    callback(null);
                }
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

VirtualBoxManager.checkpointExists = function (checkpointName, callback)
{
    if (Config.virtualbox && Config.virtualbox.active)
    {
        virtualbox.snapshotList(VirtualBoxManager.vmName, function (error, snapshotList, currentSnapshotUUID)
        {
            if (snapshotList && snapshotList instanceof Array)
            {
                const matchingSnapshots = _.filter(snapshotList, function(snapshot){
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
        });
    }
    else
    {
        callback(1, "Virtualbox flag not active in Deployment Config.");
    }
};

VirtualBoxManager.createCheckpoint = function (checkpointName, callback)
{
    if (Config.virtualbox && Config.virtualbox.active)
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
        callback(1, "Virtualbox flag not active in Deployment Config.");
    }
};

VirtualBoxManager.restoreCheckpoint = function (checkpointName, callback)
{
    if (Config.virtualbox && Config.virtualbox.active)
    {
        virtualbox.snapshotRestore(VirtualBoxManager.vmName, checkpointName, function (error, uuid)
        {
            if (error)
            {
                callback(1, "Error restoring snapshot!");
            }
            else
            {
                if (uuid)
                {
                    console.log("Snapshot has been restored!");
                    console.log("UUID: ", uuid);
                }
                else
                {
                    callback(2, "Null uuid returned when restoring a snapshot!");
                }
            }
        });
    }
    else
    {
        callback(1, "Virtualbox flag not active in Deployment Config.");
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
    Logger.log("Restarting all Virtualbox containers.");
    if (Config.virtualbox && Config.virtualbox.active)
    {
        const performOperation = function ()
        {
            Logger.log("Restarted VM.");
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
            performOperation();
        }

        Logger.log("Restarted VM.");
    }
    else
    {
        callback(1, "Virtualbox flag not active in Deployment Config.");
    }
};

module.exports.VirtualBoxManager = VirtualBoxManager;
