var _ = require('underscore');

function Queue(worker, options){
  this.queue = [];
  this.worker = worker;
  this.workers = 0;

  this.options = _.extend({}, Queue.DEFAULTS, options);
}

Queue.DEFAULTS = {
  concurrency: 1
};

Queue.prototype = {
  push: function(task, callback){
    this.queue.push({
      data: task,
      callback: typeof callback == 'function' ? callback : null
    });
    process.nextTick(this.process.bind(this));
  },
  process: function(){
    var task;
    if(this.workers < this.options.concurrency && this.queue.length){
      task = this.queue.shift();
      ++this.workers;
      this.worker(task.data, function(){
        --this.workers;
        if(task.callback){
          task.callback.apply(task, arguments);
        }
        process.nextTick(this.process.bind(this));
      }.bind(this));
    }
  }
};

module.exports = Queue;