const Pathfinder = global.Pathfinder;
const Shibboleth = require(Pathfinder.absPathInSrcFolder("bootup/models/shibboleth/shibboleth.js")).Shibboleth;

class ShibbolethUP extends Shibboleth
{
    constructor(shibbolethConfig)
    {
        super(shibbolethConfig);
        const self = this;
        self.setMBoxKey("Mail");
        self.setFirstNameKey("GivenName");
        self.setSurnameKey("Surname");
        self.setUsernameKey("urn:oid:2.16.620.1.23");
    }
}

module.exports.Shibboleth = ShibbolethUP;