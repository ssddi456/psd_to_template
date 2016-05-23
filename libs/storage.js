var fs = require('fs');
var path = require('path');
var nedb = require('nedb');

var storage = new nedb({ 
                  filename : path.join(__dirname, '../data/storage.db'),
                  autoload : true
                });

storage.persistence.setAutocompactionInterval(3*60*1e3);

var _ = require('underscore');

var exports_config_selector = { exports_config : true };
var default_config = {
  html_type : 'html',
  unit_type : 'px',
  rem_base  : 16
};

var _storage = module.exports = {

  get_exports_config : function( done ) {
    storage.findOne(exports_config_selector)
      .exec(function( err, config) {
        if( err ){ return done(err); }
        if( !config  ){
          _storage.update_exports_config( default_config, function( err ) {
            done(err, default_config);
          });
        } else {
          done(err, config);
        }
      });
  },

  update_exports_config : function( data, done ){
    var updates ={};
    if( typeof data == 'object' ){

      for(var k in data){
        if( typeof data[k] != 'object' ){
          updates[k] = data[k];
        } else {
          for(var m in data[k] ){
            updates[k + '.' + m ] = data[k][m];
          }
        }
      }
    } else {
      done(new Error('illegal data type'));
      return;
    }

    updates.timestamp = '' + Date.now();
    storage.update(exports_config_selector, { $set : updates }, done);
  }
};
