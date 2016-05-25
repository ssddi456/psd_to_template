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
var router = express.Router();

var tree_with_patch = require('../libs/tree_with_patch');
var storage = require('../libs/storage');


/* GET home page. */
router.get('/', function(req, resp, next) {
  resp.render('index', { title: 'Express' });
});

function route_relative(_path) {
  return path.join(__dirname, '..', _path);
}

var view_root = route_relative('views');
var static_root = route_relative('public');

var fsExtra = require('fs-extra');
var async = require('async');


// var watch_pathes = [ route_relative('public'), route_relative('views') ];
var fisKernel = require('fis-kernel');

var watch_pathes = [ 
  'D:\\temp',
  'D:\\gitchunk\\psd_to_template\\views'
];

var dest_pathes = [ path.normalize(fisKernel.project.getTempPath('www')) ];

var visitable_map = [
  '.jpg',
  '.gif',
  '.png',
  '.svg',
  '.html',
  '.js',
  '.txt',
  '.json'
];

var href_map = {};

var psd_tree = tree_with_patch( path.join( watch_pathes[0], 'layer_name_map.json' ) );

router.get('/tree',function(req, resp, next) {
  var type = req.query.type;

  psd_tree.get_patched(function( err, tree ) {
    if( err ){
      return next(err);
    }

    resp.json({ 
      err : 0, 
      items : tree,
      roots: ['root']
    });

  });

});

var attributs_to_css = require('../libs/attributs_to_css');
router.get('/node_preview', function( req, resp, next ) {

  psd_tree.get_patched(function( err, items) {
    if( err ){
      return next(err);
    }

    var nodes= Object.keys(items)
                .map(function( node_name ) {
                  return items[node_name]
                }).sort(function(a, b) {
                  return b.index - a.index;
                });

    resp.render('psd_template', {
      obj_to_style_str: function( node ) {
        return attributs_to_css(node, {});
      },
      nodes : nodes
    });
  });

});

router.get('/node_source', function( req, resp, next ) {
  var node_path = req.query.node_path;

  var rExt = path.extname(node_path).slice(1);

  fsExtra.readFile( node_path, function(err, code) {
    if(err){
      return next(err);
    }

    resp.set('Content-Type', fisKernel.util.getMimeType( rExt ));

    resp.send(code);
    resp.end();
  });
});

router.get('/node_dest', function( req, resp, next ) {
  var node_path = req.query.node_path;
  var root = req.query.root;

  try{

    fisKernel.project.setProjectRoot(root);

    var fis_node = fis.file(node_path);
    var cache_root = fis.compile.setup();

    var cache_node = fis.cache(node_path, cache_root);
    cache_node.revert(fis_node);

  }catch(e){
    return next(e);
  }


  if( fis_node._isText ){
    resp.set('Content-Type', 'text/plain');
  } else {
    resp.set('Content-Type', fisKernel.util.getMimeType( fis_node.rExt ));
  }

  resp.send(fis_node.getContent());
  resp.end();
});

router.post('/change_node', function( req, resp, next ) {
  psd_tree.edit( req.body, function( err ) {
    if(err){
      next(err);
    } else {
      resp.json({
        err : 0
      });
    }
  })
});

router.get('/compile_node', function( req, resp, next ) {
  var node = req.query;
  storage.get_exports_config(function(err, conf) {
    if( err ){
      return next(new Error('render config load failed'));
    }
    conf = _.extend({ beautify : true }, conf);
    var css = attributs_to_css( node, conf);
    resp.json({
      err : 0,
      css : css
    })
  });

});

router.get('/recompile', function( req, resp, next ) {
  compile(function(e) {
    if(e){
      return next(e);
    } else {
      resp.json({
        err: 0
      });
    }
  })
});

var child_process = require('child_process');

function compile ( done ) {
  done && done();

  // async.each(watch_pathes,function( path, done ) {
  //   var cp = child_process.spawn('fis.cmd', ['release'], { cwd : path });
  //   cp.on('error',function( e ) {
  //     if(e){
  //       debug(e);
  //     }
  //   });

  //   cp.on('exit', function( code ) {
  //     done && done( code );
  //   });
  // }, done);
}

compile();

var watchr = require('watchr');
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
                reload( '/' + path.relative(static_root, filePath).replace(/\\/g, '/') );
              }
            }
          });
        }
    },
    next: function(err,watchers){
        if (err) {
            return debug("watching everything failed with error", err);
        } else {
            debug('watching everything completed');
        }

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

//
// if this is a project manager
//   should reload when :
//      source change or compiler change:
//        rebuild project
//      dest change
//        reload previewer
//
//

var LRServer = require('../libs/livereload_server_instance');
function reload( filepath ){
  debug('reload', filepath);

  LRServer.broadcast({
    command: 'reload',
    path: filepath,
    liveCSS: true
  });
}


module.exports = router;
