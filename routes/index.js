var fs = require('fs');
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

var fisKernel = require('fis-kernel');

var psd_tree = require('../implements/psd_tree');

var attributs_to_css = require('../libs/attributs_to_css');
var node_to_html = require('../libs/node_to_html');

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


router.get('/tree',function(req, resp, next) {
  var type = req.query.type;

  psd_tree.get_patched(function( err, tree ) {
    if( err ){
      return next(err);
    }

    resp.json({ 
      err : 0, 
      items : tree,
      roots: ['root'],
      res_root: psd_tree.get_res_root()
    });

  });

});


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
        return attributs_to_css(node, { preview : true });
      },
      nodes : nodes
    });
  });
});

// fs proxy
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

// preview proxy
router.get(/^\/preview(\/*)?/, function( req, resp, next ) {
  var query = req.query;
  var pathname = req._parsedUrl.pathname;
  pathname = pathname.replace(/^\/preview/, '');

  if( pathname == '' || pathname == '/' ){

    node = psd_tree.get_node('root');
    storage.get_exports_config(function(err, conf) {
      if( err ){
        return next(new Error('render config load failed'));
      }

      conf = _.extend({ beautify : true }, conf);

      conf.with_root = true;
      conf.css_hook = true;

      if( query.html_type ){
        conf.html_type = query.html_type;
      }

      if( conf.html_type == 'jade' ){
        conf.html_type = 'html';
      }

      var css = attributs_to_css.create_css_frame( node, null, conf );
      var html = node_to_html(node, conf);

      html = html.replace('<!-- css_hook -->', css);
      resp.set('Content-Type', fisKernel.util.getMimeType( conf.html_type ));
      resp.end(html);
    });

  } else {
    console.log( path.join( psd_tree.get_res_root(), decodeURIComponent(pathname)) );

    resp.sendFile( path.join( psd_tree.get_res_root(), decodeURIComponent(pathname)));
  }
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
  node = psd_tree.get_node(node.pathname);

  async.parallel([
    function( done ) {
      if( node.src ){
        fs.stat( node.src, function(err, stat) {
            done(err, err || { b_size : stat.size });
        });
      } else {
        done(null, { b_size : 0 });
      }
    },
    function( done ) {
      storage.get_exports_config(function(err, conf) {
        if( err ){
          return done(new Error('render config load failed'));
        }

        conf = _.extend({ beautify : true }, conf);

        var css = attributs_to_css.create_css_frame( node, null, conf );
        var html = node_to_html(node, conf);

        done(null, {
          css  : css,
          html : html
        });
      });
        
    }], 
    function( err, res ) {
      if(err)    {
        return next(err);
      }

      resp.json({
        err : 0,
        css : res[1].css,
        html : res[1].html,
        preview_info : { b_size : res[0].b_size }
      });
    })

});


function compile( done ) {
  done && done();
}

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



router.post('/change_res_root', function( req, resp, next ) {
  // check if the new root is legal
  var root = req.body.root;
  try{
    var stat = fs.statSync(root);
    if( stat && stat.isDirectory() ){

    } else {
      throw new Error('given root is not a directory');
    }

    psd_tree.change_res_root( root );

  } catch(e){
    return next(e);
  }

  resp.json({
    err : 0
  });

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


module.exports = router;
