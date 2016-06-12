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

var _psd_tree;
var _res_root;

var psd_tree = module.exports = {
  init : function( done ) {
    storage.get_res_root(function( err, doc ) {
      if( err ){
        return done(err);
      }

      _psd_tree = tree_with_patch( path.join( doc.root, 'layer_name_map.json' ) );
      _res_root = doc.root;
      done();
    });
  },
  change_res_root : function( root ) {
    _psd_tree = tree_with_patch( path.join( root, 'layer_name_map.json' ) );
    _res_root= root;
  },
  get_res_root : function() {
    return _res_root;
  }
};

psd_tree.init(function() {
  debug( 'psd_tree init', arguments);
});

var proxy_methods = ['get_patched',
                    'get_patched',
                    'edit'];

proxy_methods.forEach(function( name ) {
  psd_tree[name] = function() {
    _psd_tree[name].apply(_psd_tree, [].slice.call(arguments));
  }
});