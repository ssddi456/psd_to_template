var path    = require('path');
var debug_name = path.basename(__filename,'.js');
if( debug_name == 'index'){
  debug_name = path.basename(__dirname);
}
(require.main === module) && (function(){
    process.env.DEBUG = '*';
})()
var debug = require('debug')(debug_name);


var storage = require('../libs/storage');;
var tree_with_patch = require('../libs/tree_with_patch');
var watcher = require('../implements/watcher');

var _psd_tree;
var _res_root;
var _map_file;
var _watcher;


var LRServer = require('../libs/livereload_server_instance');
function reload( filepath ){
  debug('reload', filepath);
  LRServer.broadcast({
    command: 'reload',
    path: filepath,
    liveCSS: true
  });
}

var change_handler = function( data ) {
  var changeType  = data.changeType;
  var filePath  = data.filePath;
  var fileCurrentStat  = data.fileCurrentStat;
  var filePreviousStat  = data.filePreviousStat;

  if( filePath == _map_file && changeType == 'update' ){
    _psd_tree.update_source();
  }
  reload( filePath );
}

var psd_tree = module.exports = {
  init : function( done ) {
    storage.get_res_root(function( err, doc ) {
      if( err ){
        return done(err);
      }
      _map_file = path.join( doc.root, 'layer_name_map.json' );
      _psd_tree = tree_with_patch( _map_file );
      _res_root = doc.root;

      _watcher = watcher([doc.root]);
      _watcher.on('change', change_handler);

      done();
    });
  },
  change_res_root : function( root ) {

    _map_file = path.join( root, 'layer_name_map.json' );
    _psd_tree = tree_with_patch( _map_file );
    _res_root = root;

    _watcher.destroy();
    _watcher = watcher([root]);
    _watcher.on('change', change_handler);
  },
  get_res_root : function() {
    return _res_root;
  }
};

psd_tree.init(function() {
  debug( 'psd_tree init', arguments);
});

var proxy_methods = [
                      'get_node',
                      'get_patched',
                      'get_patched',
                      'edit'
                    ];

proxy_methods.forEach(function( name ) {
  psd_tree[name] = function() {
    return _psd_tree[name].apply(_psd_tree, [].slice.call(arguments));
  }
});