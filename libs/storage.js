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
var res_root_selector = { res_root : true };

var default_config = {
  html_type : 'html',
  unit_type : 'px',
  rem_base  : 16,
  exports_config : true
};

var default_root_config = {
  root : 'd:/temp',
  res_root : true
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
    storage.update(exports_config_selector, { $set : updates }, { upsert : true },done);
  },
  set_res_root : function( root, done ) {
    storage.update(res_root_selector, { $set : { root : root }}, { upsert : true },done);
  },
  get_res_root : function( done ) {
    storage.findOne(res_root_selector)
      .exec(function( err, config) {
        if( err ){ return done(err); }
        if( !config  ){
          _storage.update_exports_config( default_root_config, function( err ) {
            done(err, default_root_config);
          });
        } else {
          done(err, config);
        }
      });  
  }
};


function data_type_with_default ( name, selector, default_config ) {
    var default_root_config = {};

    for(var key in selector){
      if( selector.hasOwnProperty(key) ){
        if( key in default_config ){
          throw new Error( 'selector key should not as a part or default_config');
        }
        default_root_config[key] = selector[key];
      }
    }
    for(var key in default_config){
      if( default_config.hasOwnProperty(key) ){
        default_root_config[key] = default_config[key];
      }
    }


    storage['get_' + name ] = function( done ) {
      storage.findOne(selector)
        .exec(function( err, config) {

          if( err ){ return done(err); }
          if( !config  ){
            _storage.update_exports_config( default_root_config, function( err ) {
              done(err, default_root_config);
            });
          } else {
            done(err, config);
          }
        });  
    };

    storage['set_' + name] = function( data, done ) {

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

      storage.update(selector, { $set : updates }, { upsert : true },done);
    };
}