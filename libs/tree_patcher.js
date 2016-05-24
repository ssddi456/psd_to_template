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

var get_patcher = module.exports = function( tree_old, tree_new ) {
  
  var tree_info_old = get_tree_info(tree_old);
  var tree_info_new = get_tree_info(tree_new);

  var node_names_old = tree_info_old.node_names;
  var node_names_new = tree_info_new.node_names;

  var names_diff = arr_diff( node_names_old, node_names_new );

  var patches = [];

  debug( node_names_old );
  debug( node_names_new );

  debug( names_diff );

  names_diff.deleted.forEach(function( name ) {
    patches.push(patch_op(name,'deleted', { parent : '' }));
  });

  names_diff.same.forEach(function( name ) {
    try{
      var attr_patch = get_attr_patch( tree_old[name], tree_new[name]);
    } catch(e){
      debug(name);
      throw e;
    }
    if( attr_patch ){
      patches.push(patch_op(name, 'modified', attr_patch));
    }
  });

  names_diff.created.forEach(function( name ) {
    var node = tree_new[name];
    patches.push(patch_op(name, 'created', node));
  });

  return patches;
};


function patch_op ( name, op, params ) {
  return {
    node_name : name,
    op        : op,
    params    : params
  };
}

function apply_patch( node_map, patch_ops ) {
  patch_ops.forEach(function( patch_op ) {
    var node = node_map[patch_op.node_name];
    var params = patch_op.params;

    if( !node ){
      patch_ops.to_delete = true;
      return;
    }

    switch( patch_op.op ){
      case 'deleted' : 
        delete node_map[patch_op.node_name];
        var parent = node_map[ params.parent ];
        parent.children.splice( parent.children.indexOf(patch_op.node_name) );
        break;

      case 'created' : 
        var parent = node_map[params.parent];
        node_map[patch_op.node_name] = params;
        parent.children.push(patch_op.node_name);
        break;

      case 'modified' : 
        if( params.style ){
          _.extend(node.style, params.style);
        }
        if( params.effect ){
          _.extend(node.effect, params.effect);
        }
        break;
    }
  });

  patch_ops = patch_ops.filter(function( patch_op ) {
    return !patch_op.to_delete;
  });

  return patch_ops;
}

function merge_patch ( old_patches, new_patches ) {
  var old_names = old_patches.map(function( node ) {
    return node.node_name;
  });
  var new_names = new_patches.map(function( node ) {
    return node.node_name;
  });

  var names_diff = arr_diff( old_names, new_names );

  old_patches = old_patches.filter(function( patch) {
    return names_diff.deleted.indexOf(patch.node_name) == -1;
  });

  names_diff.same.forEach(function( name ) {
    var old_patch = _.find(old_patches, function( patch ) {
                      return patch.node_name == name;
                    });
    if( old_patch.op == 'deleted' ){
      return;
    }

    var new_patch = _.find(new_patches, function( patch ) {
                      return patch.node_name == name;
                    });

    if( new_patch.op == 'deleted' ){
      old_patch.op = 'deleted';
      old_patch.params.parent = new_patch.parent;
    } else {
      // 属性修改的patch
      ['style', 'effect'].forEach(function( name ) {
        var old_params = old_patch.params[name];
        var new_params = new_patch.params[name];
        if( old_params ){
          if( new_params ){
            var attr_patch = get_plain_object_patch(old_params, new_params);
            if( attr_patch ){
              _.extend(old_params, attr_patch);
            }
          } else {
            // skip;
          }
        } else if( new_params ){
          old_patch.params[name] = new_params;
        }
      })
    }
  });

  // 
  // todos 
  // finish this
  // 
  ;
}

function arr_diff( old, _new ) {
  var ret = {
    deleted : [],
    created : [],
    same    : []
  };

  var old_length = old.length;
  var new_length = _new.length;

  var i = 0;
  var j = 0;
  var cur_old;
  var cur_new;

  for(; i < old_length && (cur_new = _new[j]); ){
    cur_old = old[i];

    if( cur_old == cur_new ){
      //  attr modified
      ret.same.push(cur_old);
      j++;
    } else {
      var move_index = _new.indexOf( cur_old, j);
      // debug('move_index', move_index, i, j);
      if( move_index == -1 ){
        // this node is deleted
        ret.deleted.push(cur_old);
      } else {
        for(; j < move_index; j ++ ){
          ret.created.push( _new[j]);
        }
        i --;
      }
    }
    i++;
    // debug('i s', i);
  }

  // debug('i b', i);
  i++;
  // debug('i a', i);

  for(;i < old_length; i ++ ){
    // debug('add last ');
    ret.deleted.push( old[i] );
  }

  for(;j < new_length; j ++ ){
    ret.created.push( _new[j] );
  }

  return ret;
}

//
// override  now overrid only
// delta
//

var get_attr_patch = function( node_old, node_new ) {
  var ret = {};
  var diff = false;
  var style = get_plain_object_patch( node_old.style, node_new.style );
  if( style ){
    ret['style'] = style;
    diff =true;
  }
  var effect = get_plain_object_patch( node_old.effect, node_new.effect )
  if( effect ){
    ret['effect'] = effect;
    diff =true;
  }

  if( diff ){
    return ret;
  }
};

var get_plain_object_patch = function( old_style, new_style ){

  if( !old_style ){
    if( new_style ){
      return _.extend({}, new_style);
    } else {
      return;
    }
  } else {
    if( !new_style ){
      return;
    } else {
      // pass
    }
  }
  var ret = {};


  var names_diff = arr_diff( Object.keys(old_style), Object.keys(new_style) );

  var has_diff = false;
  names_diff.created.forEach(function( name ) {
    ret[name] = new_style[name];
    has_diff = true;
  });

  names_diff.deleted.forEach(function( name ) {
    ret[name] = null;
    has_diff = true;
  });

  names_diff.same.forEach(function( name ) {
    if( old_style[name] !== new_style[name]){
      ret[name] = new_style[name];
      has_diff = true;
    }
  });

  if( has_diff ){
    return ret;
  }
}

var get_tree_info = function( tree ) {
    var node_names = Object.keys(tree).sort();
    var root = tree['root'];

    // 似乎不用
    // build_tree(root);

    return {
      origin: tree,
      root : root,
      node_names : node_names
    }
}

var build_tree = function( root, tree ) {
  root.children = root.children.map(function( node_name ) {
    var child = tree[node_name];
    if( child.children.length ){
      build_tree( child, tree );
    }
    return child;
  });
}

module.exports.apply_patch = apply_patch;
module.exports.merge_patch = merge_patch;

;(require.main === module) && (function(){
  var old = [1,2,3,4];
  var _new = [1,2,3,4];

  [
    { old : [1,2,3,4], 
      _new : [1,2,3,4] 
    }
    ,{ old : [1,2,3,4], 
      _new : [1,2,2,3,4] 
    }
    ,{ old : [1,2,3,4,5,6,7], 
      _new : [1,2,3,4,9] 
    }
    ,{ old : [-1, 0, 1,2,3,4,5,6,7], 
      _new : [1,2,3,4,9] 
    }
    ,{ old : [1,2,3,4,9],
      _new : [-1, 0, 1,2,3,4,5,6,7]
    }
  ].forEach(function( data ) {
    var names_diff = arr_diff(data.old, data._new);
    debug( names_diff );
  });


  var fsExtra = require('fs-extra');
  var json_new = fsExtra.readJSONSync('d:/temp/layer_name_map.json');
  var json_old = fsExtra.readJSONSync('d:/temp/layer_name_map_old.json');

  var patcher = get_patcher( json_old, json_new);
  debug( patcher );
})();

