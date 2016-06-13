var path    = require('path');
var debug_name = path.basename(__filename,'.js');
if( debug_name == 'index'){
  debug_name = path.basename(__dirname);
}
(require.main === module) && (function(){
    process.env.DEBUG = '*';
})()
var debug = require('debug')(debug_name);
var async = require('async');
var _ = require('underscore');
var events = require('events');

var fsExtra = require('fs-extra');
var tree_patcher = require('./tree_patcher');

var tree_with_patch = module.exports = function( source_data_path ) {

  var origin_data = null;
  var patched_data = null;

  var emitter = new events();

  var patch_data_path = path.join( source_data_path, 
                          '../' + path.basename(source_data_path, path.extname( source_data_path)) 
                               + '.patch.json');

  async.parallel([
    function(done) {
      fsExtra.readFile( source_data_path, 'utf8', function(err, res) {
        done(null, res);
      });
    },
    function(done) {
      fsExtra.readJSON( patch_data_path, function(err, res) {
        done(null, res);
      });
    }],function(err, datas) {
       debug(err);

       origin_data = JSON.parse(datas[0] || '{}');
       patched_data  = JSON.parse(datas[0] || '{}');

       var patches = datas[1] || [];

       tree_patcher.apply_patch( patched_data, patches );

       debug('inited', source_data_path, patch_data_path);

       emitter.emit('inited');
    });

  var temp_ops = [];

  return {
    get_patched : function( done ) {
      if( !patched_data ){
        emitter.once('inited', function() {
          // do update patches here;
          done(null, patched_data);
        });
      } else {
        done(null, patched_data);
      }
    },
    edit : function( params, done ) {

      function edit_patch( done ) {
        params = temp_ops.length ? temp_ops : [params];

        params.forEach(function( param ){
          debug('modifier', param.node_name, param.attributes);

          var origin_node = patched_data[param.node_name];

          _.extendOwn(origin_node.style, param.attributes.style);
          _.extendOwn(origin_node.effect, param.attributes.effect);
        });

        var patches = tree_patcher( origin_data, patched_data );
        debug('patch edited', patches);
        fsExtra.writeJSON( patch_data_path, patches, done );

        if( temp_ops.length ){
          temp_ops.length = 0;
        }
      }

      if( !origin_data ){
        temp_ops.push(params);
        emitter.once('inited', function() {
          // do update patches here;
          edit_patch( done );
        });
      } else {
        edit_patch( done );
      }
    },

    update_source : function( done ) {
      fsExtra.readJSON(source_data_path, function( err, updated_source ) {
        if( err ){
          return done(err);
        }

        var diff_patcher = tree_patcher(origin_data, updated_source);
        var patches = tree_patcher.merge_patch(patches, diff_patcher);
        origin_data = updated_source;
        fsExtra.writeJSON( patch_data_path, patches, done );

      });
    },
    get_node : function( pathname ) {
      return patched_data[pathname];
    }
  };
};


;(require.main === module) && (function(){
  var psd_tree = tree_with_patch('d:/temp/layer_name_map.json');

  async.waterfall([function(done) {
    psd_tree.get_patched(function(err, res) {
      console.log( err );

      console.log( Object.keys(res).length );
      var attributes = res['root_potion red_组 1_7 副本'];
      attributes.style.left = 120;

      done(null, {
        node_name : 'root_potion red_组 1_7 副本',
        attributes : attributes
      });
    });
  },
  function( editer, done ) {
    psd_tree.edit(editer, function() {
      done();
    });
  },
  function( done ) {
    psd_tree.get_patched(function(err, res) {
      console.log( err );

      console.log( Object.keys(res).length );

      var attributes = res['root_potion red_组 1_7 副本'];
      attributes.style.left = 20;

      done(null, {
        node_name : 'root_potion red_组 1_7 副本',
        attributes : attributes
      });

    });

  },
  function(editer, done) {
    psd_tree.edit(editer, function() {
      done();
    });
  }],function() {
    debug( 'all done');
  })
})();