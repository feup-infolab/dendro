const rlequire = require("rlequire");
const b2dropAccount = rlequire("dendro", "test//mockdata/accounts/b2DropAccount.js");

const b2dropStorage = {
    username: b2dropAccount.username,
    password: b2dropAccount.password,
    hasStorageType: "b2drop"
};

module.exports = b2dropStorage;
