var path    = require('path');
var debug_name = path.basename(__filename,'.js');
if( debug_name == 'index'){
  debug_name = path.basename(__dirname);
}
(require.main === module) && (function(){
    process.env.DEBUG = '*';
})()
var debug = require('debug')(debug_name);

var events = require('events');

var fsExtra = require('fs-extra');
var tree_patcher = require('./tree_patcher');

module.exports = function( source_data_path ) {

  var origin_data = null;
  var patches = null;

  var emitter = new events();

  var patch_data_path = path.relative( source_data_path, 
                          './' + path.basename(source_data_path, path.extname( source_data_path)) 
                               + '.patch.json');

  var async = require('async');

  async.paralle([
    function(done) {
      fsExtra.readJSON( source_data_path, done);
    },
    function(done) {
      fsExtra.readJSON( patch_data_path, done);
    }],function(err, datas) {
       origin_data = datas[0];
       patches = datas[1];

       emitter.emit('inited');
    });

  var temp_ops = [];

  return {
    edit : function( params, done ) {
      if( !origin_data ){
        temp_ops.push(params);
        emitter.once('inited', function() {
          // do update patches here;
          done();
        });
      }
    },

    update_source : function( done ) {
      fsExtra.readJSON()
    }
  };
};