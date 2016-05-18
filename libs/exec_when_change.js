var debug = require('debug')('exec_when_change');

var watchr = require('watchr');
var events = require('events');

module.exports = function( folders, handle ) {
  var instance = new events();
  instance.on('change', handle );
  var g_wathers;
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

          compile(function() {
            // here need some tree updates
            if( changeType == 'update' ){
              if( filePath.indexOf( view_root ) == 0 ){
                debug('template change ');
                reload( filePath );
              } else {
                debug('static file change');
                instance.emit('change', changeType, filePath, fileCurrentStat, filePreviousStat );
              }
            }
          });
        }
    },
    next: function(err,watchers){
        if (err) {
          instance.emit('error', error);
          return debug("watching everything failed with error", err);
        } else {
            debug('watching everything completed');
        }

        g_wathers =watchers;

        // Close watchers after 60 seconds example
        // setTimeout(function(){
        //     var i;
        //     debug('Stop watching our paths');
        //     for ( i=0;  i<watchers.length; i++ ) {
        //         watchers[i].close();
        //     }
        // },60*1000);
    }
  });
  
  instance.stop = function() {
    if(g_wathers){
      for ( i=0;  i<watchers.length; i++ ) {
        watchers[i].close();
      }
    }
    instance.removeListener('change', handle );
  };

  return instance;
}