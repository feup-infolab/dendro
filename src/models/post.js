const Pathfinder = global.Pathfinder;
const db = require(Pathfinder.absPathInSrcFolder("mysql_models"));

let typeName;

let Post = function (type, postURI, userURI, projectURI)
{
    typeName = type;
    this.postURI = postURI;
    this.userURI = userURI;
    this.projectURI = projectURI;
    return this;
};

Post.prototype.saveToMySQL = function (callback)
{
    const self = this;
    db.post_types.findAll({
        where: {
            name: typeName
        }
    }).then(res => {
        self.typeId = res[0].dataValues.id;
        db.posts.create(self).then(() => {
            return callback(null);
        }).catch(err => {
            return callback(err);
        });
    });
};

Post.prototype.deleteFromMySQL = function (callback)
{
    const self = this;
    db.post_types.findAll({
        where: {
            name: typeName
        }
    }).then(res => {
        self.typeId = res[0].dataValues.id;
        db.posts.destroy({
            where: {
                postURI: self.postURI,
                userURI: self.userURI,
                typeId: self.typeId
            }
        }).then(() => {
            return callback(null);
        }).catch(err => {
            return callback(err);
        });
    });
};

module.exports.Post = Post;
