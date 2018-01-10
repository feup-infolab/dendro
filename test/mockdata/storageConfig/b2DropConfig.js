const Pathfinder = global.Pathfinder;
const b2dropAccount = require(Pathfinder.absPathInTestsFolder("/mockdata/accounts/b2DropAccount.js"));

const b2dropStorage = {
    username: b2dropAccount.username,
    password: b2dropAccount.password,
    hasStorageType: "b2drop"
};

module.exports = b2dropStorage;
