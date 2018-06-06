const Pathfinder = global.Pathfinder;
const Shibboleth = require(Pathfinder.absPathInSrcFolder("bootup/models/shibboleth/shibboleth.js")).Shibboleth;

class ShibbolethUP extends Shibboleth
{
    constructor(shibbolethConfig)
    {
        super(shibbolethConfig);
        const self = this;
        self.setMBoxKey("urn:oid:1.3.6.1.4.1.5923.1.1.1.6");
        self.setFirstNameKey("urn:oid:2.5.4.42");
        self.setSurnameKey("urn:oid:2.5.4.4");
        self.setUsernameKey("urn:oid:1.3.6.1.4.1.5923.1.1.1.6");
    }
}

module.exports.Shibboleth = ShibbolethUP;