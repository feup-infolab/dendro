const path = require('path');

const Pathfinder = function()
{

}

if(process.env.NODE_ENV === "test")
{
    Pathfinder.appDir = path.resolve(path.dirname(require.main.filename), "../../..");
    console.log("Running in test mode and the app directory is : " + Pathfinder.appDir);
}
else
{
    Pathfinder.appDir = path.resolve(path.dirname(require.main.filename), "..");
    console.log("Running in production / dev mode and the app directory is : " + Pathfinder.appDir);
}

Pathfinder.absPathInApp = function(relativePath)
{
    return path.join(Pathfinder.appDir, relativePath);
};

Pathfinder.absPathInTestsFolder = function(relativePath)
{
    return path.join(Pathfinder.appDir, "test", relativePath);
};

Pathfinder.getAbsolutePathToPluginsFolder = function()
{
    const path = require('path');
    return path.join(Pathfinder.appDir, "src", "plugins");
};

Pathfinder.absPathInPluginsFolder = function(relativePath)
{
    return path.join(Pathfinder.getAbsolutePathToPluginsFolder(), relativePath);
};

Pathfinder.absPathInSrcFolder = function(relativePath)
{
    return path.join(Pathfinder.appDir, "src", relativePath);
};

Pathfinder.getPathToPublicFolder = function()
{
    return path.join(Pathfinder.appDir, "public");
};

Pathfinder.absPathInPublicFolder = function(relativePath)
{
    return path.join(Pathfinder.getPathToPublicFolder(), relativePath);
};


module.exports.Pathfinder = Pathfinder;