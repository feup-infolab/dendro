const slug = require("slugify");

module.exports = function (text)
{
    return slug(text, {replacement: "_", remove: /[$*_+~.()'"!\-:@\\/]/g});
};
