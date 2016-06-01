// Copyright 2002-2007.  Adobe Systems, Incorporated.  All rights reserved.
// Create a new art layer and convert it to a text layer.
// Set its contents, size and color.

// enable double clicking from the Macintosh Finder or the Windows Explorer
// in case we double clicked the file
#target photoshop

#include './json.jsx'
#include './text_font.jsx'
#include './utils.jsx'

// debug level: 0-2 (0:disable, 1:break on error, 2:break at beginning)
$.level = 1;
// debugger; // launch debugger on next line

var docRef = app.activeDocument;

// configs 
var exportInfo = { destination : 'D:/temp' };
var if_exports_image = true;


function walk_layers ( root, handle, root_path ) {
  if( root_path !== undefined ){
    root_path += '_' + root.name;
  } else {
    root_path = 'root';
    handle( root, true, true, '');
  }


  var layer_count = root.layers.length;
  var artLayer_count = root.artLayers.length;
  var layerSet_count = root.layerSets.length;

  if( (artLayer_count + layerSet_count) != layer_count ){
    //  $.writeln(root_path);
  }

  for( var i = 0; i< layer_count; i++ ){
    var child = root.layers[i];
    var typename = child.typename;
    if( typename == 'ArtLayer' ){
      handle(child, false, false, root_path);
    } else if( typename == 'LayerSet' ){
      var ret = handle(child, true, false,root_path);
      if( ret !== false ){
        walk_layers(child, handle, root_path);
      }
    }
  }
}


var actual_doc = docRef.duplicate();
app.activeDocument = actual_doc;

var start = new Date().getTime();

var layers = [];
var layer_name_map = {};

var layer_index = 0;
walk_layers(actual_doc, function( layer, is_group, is_root, root_path ) {
  if( !is_root ){
    var item_path = root_path + '_' + layer.name;
  } else {
    item_path = 'root';
  }

  if( layer_name_map[ item_path ] ){
    // 这里应该有个同名冲突的解决机制
  }

  // 
  // 在这里构建元素树结构
  //
  var layer_node = layer_name_map[ item_path ] = {
    style : {},
    ext_style : {},
    effect : {
      'align-horizontal' : 'left',
      'align-vertical'   : 'top'
    },
    children : [],
    parent : root_path,
    is_group : is_group,
    class_name : layer_name_to_class_name(layer.name),
    index  : layer_index
  };
  layer_index ++;

  // documents width and height
  if( is_root ){
    layer_node.style.height = unit_as_px(layer.height);
    layer_node.style.width = unit_as_px(layer.width);
  }

  layer_name_map[ root_path ] && layer_name_map[ root_path ].children.push( item_path );

  if( is_group ){
    if( !layer.visible ){
      return false;
    }

    layer_node.effect.child_pos_type = 'absolute';

  } else {
    if( layer.visible ){
      layer.visible = false; 
      if( if_exports_image ){
        layer_node.layer = layer;
      }
      layers.push( layer_node );

      layer_node.src = exportInfo.destination + '/' + item_path  + '.png';
      layer_node.src = layer_node.src.replace(/ /g,'-');
      layer_attr_to_style( layer, layer_node, item_path );
    }
  }

});



function layer_name_to_class_name( str ){
  return str.replace(/ /g, '-')
          .replace(/(^[0-9])/, '__$1')
          .replace(/^([^#.])/, '.$1');
}


function layer_attr_to_style ( layer, layer_node, item_path ) {
  /*
    fillOpacity -> opacity
  */
  var css_style = layer_node.style;

  if( layer.fillOpacity != 100 ){
    css_style.opacity = layer.fillOpacity / 100;
  }

  var bounds = layer.bounds;

  bounds_to_bbox(bounds, css_style);

  // 
  // need create file_path here
  // 
  if( layer.kind == 'LayerKind.TEXT' ){
    var textitem = layer.textItem;
    layer_node.text = textitem.contents;

    get_text_style( layer, layer_node);
  }
  
}


function saveFile(  fileNameBody, exportInfo ) {
  var id6 = c2t( "Expr" );
    var desc3 = new ActionDescriptor();
    var id7 = c2t( "Usng" );
      var desc4 = new ActionDescriptor();
      var id8 = c2t( "Op  " );
      var id9 = c2t( "SWOp" );
      var id10 = c2t( "OpSa" );
          desc4.putEnumerated( id8, id9, id10 );
      var id11 = c2t( "Fmt " );
      var id12 = c2t( "IRFm" );
      var id13 = c2t( "PN24" );
      desc4.putEnumerated( id11, id12, id13 );
      var id14 = c2t( "Intr" );
      desc4.putBoolean( id14, false );
      var id15 = c2t( "Trns" );
      desc4.putBoolean( id15, true );
      var id16 = c2t( "Mtt " );
      desc4.putBoolean( id16, true );
      var id17 = c2t( "MttR" );
      desc4.putInteger( id17, 255 );
      var id18 = c2t( "MttG" );
      desc4.putInteger( id18, 255 );
      var id19 = c2t( "MttB" );
      desc4.putInteger( id19, 255 );
      var id20 = c2t( "SHTM" );
      desc4.putBoolean( id20, false );
      var id21 = c2t( "SImg" );
      desc4.putBoolean( id21, true );
      var id22 = c2t( "SSSO" );
      desc4.putBoolean( id22, false );
      var id23 = c2t( "SSLt" );
        var list1 = new ActionList();
      desc4.putList( id23, list1 );
      var id24 = c2t( "DIDr" );
      desc4.putBoolean( id24, false );
      var id25 = c2t( "In  " );
      desc4.putPath( id25, new File( fileNameBody ) );
    var id26 = s2t( "SaveForWeb" );
    desc3.putObject( id7, id26, desc4 );
  executeAction( id6, desc3, DialogModes.NO );
}


function do_exports () {
  var layer;
  var copyed_doc;
  var n = layers.length;

  app.activeDocument = actual_doc;

  for(var i = 0; i < n; i++){
    layer = layers[i];
    // 
    // here do exports
    // 
    layer.layer.visible = true;

    if( if_exports_image ){
      copyed_doc= actual_doc.duplicate();
      copyed_doc.trim(TrimType.TRANSPARENT);

      app.activeDocument = copyed_doc;

      saveFile( layer.src, exportInfo);

      copyed_doc.close( SaveOptions.DONOTSAVECHANGES );
      copyed_doc = null;

      app.activeDocument = actual_doc;
    }

    actual_doc.activeLayer = layer.layer;
    if( get_layer_effect_visible() ){
      hide_layer_effects();

      bounds_to_bbox( layer.layer.bounds, layer.ext_style );
    }

    // do save
    layer.layer.visible = false;
    layer.layer = null;
  }

}

do_exports();

// free the reference
layers.length = 0;

app.activeDocument = docRef;
actual_doc.close( SaveOptions.DONOTSAVECHANGES );
actual_doc = null

save_json( exportInfo.destination + '/layer_name_map.json', layer_name_map);

var end = new Date().getTime();

$.writeln( 'process end with ' + ( end - start ) + 'ms');