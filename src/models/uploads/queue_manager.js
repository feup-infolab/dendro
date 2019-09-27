const rlequire = require("rlequire");
const Queue = require("better-queue");



function Queue_manager ()
{
    const Queue_manager = Object.create(Queue_manager);

    var q = new Queue(fn);
    
    return Queue_manager;
}


Queue_manager.getQueue = function (){
    const self = this;

    return self.q;
};

Queue_manager.pushQueue = function (object)
{
    const self = this;
    self.q.push(object);
    console.log(q);
};


module.exports.Queue_manager = Queue_manager;