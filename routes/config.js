var path    = require('path');
var debug_name = path.basename(__filename,'.js');
if( debug_name == 'index'){
  debug_name = path.basename(__dirname);
}
(require.main === module) && (function(){
    process.env.DEBUG = '*';
})()
var debug = require('debug')(debug_name);

var _ = require('underscore');

var express = require('express');
var router = module.exports = express.Router();

var storage = require('../libs/storage');

router.get('/', function( req, resp, next ) {
  storage.get_exports_config(function( err, config ) {
    if( err ){
      next(err);
    } else {
      resp.json({ 
        err : 0,
        config : config
      });
    } 
  });    
});

/* GET home page. */
router.post('/update', function(req, resp, next) {
  var body = req.body;

  storage.update_exports_config( body, function( err ) {
    if( err ){
      next(err);
    } else {
      resp.json({ err : 0 });
    }
  });
});


