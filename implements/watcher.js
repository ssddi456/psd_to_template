var path    = require('path');
var debug_name = path.basename(__filename,'.js');
if( debug_name == 'index'){
  debug_name = path.basename(__dirname);
}
(require.main === module) && (function(){
    process.env.DEBUG = '*';
})()
var debug = require('debug')(debug_name);

var events = require('events');;

var watchr = require('watchr');

module.exports = function watcher ( watch_pathes ) {
    var ret = new events();

    watchr.watch({
        paths: watch_pathes,
        listeners: {
            log: function(logLevel){
              if( logLevel =='debug' ){
                return;
              }
              debug('a log message occured:', arguments);
            },
            error: function(err){
                debug('an error occured:', err);
            },
            watching: function(err,watcherInstance,isWatching){
                if (err) {
                    debug("watching the path " + watcherInstance.path + " failed with error", err);
                } else {
                    debug("watching the path " + watcherInstance.path + " completed");
                }
            },
            change: function(changeType, filePath, fileCurrentStat, filePreviousStat){
              debug('a change event occured:', changeType, filePath);

              ret.emit('change', {
                changeType : changeType,
                filePath : filePath,
                fileCurrentStat : fileCurrentStat,
                filePreviousStat : filePreviousStat,
              });
            }
        },
        next: function(err,watchers){
            if (err) {
                return debug("watching everything failed with error", err);
            } else {
                debug('watching everything completed');
            }
            ret.destroy = function() {
                var i;
                debug('Stop watching our paths');
                for ( i=0;  i<watchers.length; i++ ) {
                    watchers[i].close();
                }
            };
            ret.emit('bootstraped');
        }
    });
    
    return ret;440
    
};
