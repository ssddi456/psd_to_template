// Copyright 2002-2007.  Adobe Systems, Incorporated.  All rights reserved.
// Create a new art layer and convert it to a text layer.
// Set its contents, size and color.

// enable double clicking from the Macintosh Finder or the Windows Explorer
// in case we double clicked the file
#target photoshop

#include './json.jsx'
#include './text_font.jsx'
#include './utils.jsx'
#include './exports_config.jsx'
#include './ui_util.js'

// debug level: 0-2 (0:disable, 1:break on error, 2:break at beginning)
// $.level = 1;
// launch debugger on next line
// debugger; 

var docRef = app.activeDocument;

// configs 
var exportInfo = { destination : 'D:/temp' };

// 
// 制造一个副本 省去管理历史状态的麻烦，
// 并且可以提升执行速度
// 
var actual_doc;

var layers = [];
var layer_name_map = {};


function get_layer_styles ( progress ) {
  var layer_index = 0;
  walk_though_layers(actual_doc, function( layer, is_group, is_root, root_path ) {
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

    progress.increase();

    if( is_group ){
      if( !layer.visible ){
        return false;
      }

      layer_node.effect.child_pos_type = 'absolute';

    } else {
      if( layer.visible ){
        layer.visible = false; 
        layer_node.layer = layer;

        layers.push( layer_node );

        layer_node.relative_src = ('./sources/' + item_path  + '.png')
                                    .replace(/ /g,'-');

        layer_node.src = (exportInfo.destination + '/sources/' + item_path  + '.png')
                            .replace(/ /g,'-');

        layer_attr_to_style( layer, layer_node, item_path );
      }
    }
  });
}

function count_layers () {
    var count = 0;
    walk_though_layers(actual_doc, function( layer, is_group, is_root, root_path ) {
        count ++;
    });
    return count;
}

function auto_merge_layers( max_depth ) {
  walk_though_layers(actual_doc, function( layer, is_group, is_root, root_path, depth ) {
    if( is_root ){
      return;
    }

    if ( layer.typename == 'LayerSet' && layer.visible && depth > max_depth ){
      if( layer.layers.length ){
        // 空的layerset无法merge
        layer.merge();
      }
      return false;
    }
  });
}

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

  var progress = ui_progress( 2 );

  if( exportInfo.auto_merge ){
    progress.stat('合并图层');
    auto_merge_layers( exportInfo.layer_deep );
    progress.increase();
  }

  progress.stat('准备开始...');
  progress.update(2);

  var layer_count = count_layers();
  progress.finish();

  var steps = layer_count + 1;
  if( exportInfo.if_exports_image ){
    steps += layer_count;
  }

  var progress = ui_progress( layer_count );

  progress.stat('收集样式 - 阶段1/3');
  get_layer_styles( progress );
  progress.finish();
  

  app.activeDocument = actual_doc;

  var n = layers.length;

  var progress = ui_progress( n + 1 );
  progress.stat('收集样式 - 阶段2/3');

  for(var i = 0; i < n; i++){
    layer = layers[i];
    // 
    // here do exports
    // 
    layer.layer.visible = true;

    if( exportInfo.if_exports_image ){
      // 如果这里使用复制单一图层到新建的文档 也许会快一点？
      copyed_doc= actual_doc.duplicate();
      copyed_doc.trim(TrimType.TRANSPARENT);

      app.activeDocument = copyed_doc;

      saveFile( layer.src, exportInfo);

      copyed_doc.close( SaveOptions.DONOTSAVECHANGES );
      copyed_doc = null;

      app.activeDocument = actual_doc;
    }

    actual_doc.activeLayer = layer.layer;
    if( layer.text ){
      if(  get_layer_effect_visible() ){
        hide_layer_effects();

        bounds_to_bbox( layer.layer.bounds, layer.ext_style );
      }
    }

    // do save
    layer.layer.visible = false;
    layer.layer = null;
    progress.increase();
  }

  layers.length = 0;

  app.activeDocument = docRef;

  progress.stat('存储资源表 - 阶段3/3');

  save_json( exportInfo.destination + '/layer_name_map.json', layer_name_map);

  progress.finish();
}

var result = config_ui();
if( result != cancelButtonID ){
  var start = new Date().getTime();
  exportInfo = result;

  var actual_doc = docRef.duplicate();
  app.activeDocument = actual_doc;

  var folder = new Folder(exportInfo.destination );
  if (!folder.exists) {
    folder.create();
  }

  var folder = new Folder(exportInfo.destination + '/sources');
  if (!folder.exists) {
    folder.create();
  }

  do_exports();

  actual_doc.close( SaveOptions.DONOTSAVECHANGES );
  actual_doc = null

  var end = new Date().getTime();
  ui_info('导出完成', '消耗 ' + ( end - start ) + 'ms');
}

