const uuid = require("uuid");

class Progress
{
    constructor (startingUser)
    {
        this.progressID = uuid.v4();
        this.lastUpdated = new Date();
        this.user = startingUser;

        Progress.pendingProgresses[this.progressID] = this;
    }

    getUserURI ()
    {
        return this.user;
    }

    getLastUpdated ()
    {
        return this.lastUpdated;
    }

    touch()
    {
        this.lastUpdated = new Date();
    }

    dismiss ()
    {
        delete Progress.pendingProgresses[this.progressID];
    }

    getProgressID()
    {
        return this.progressID;
    }
}

Progress.pendingProgresses = {};

module.exports.Progress = Progress;
