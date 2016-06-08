var chr_to_type_map = {};
var str_to_type_map = {};

var type_to_str_map = {};

function chr_to_type ( str ) {
  return chr_to_type_map[str] 
          ? chr_to_type_map[str] 
          : (chr_to_type_map[str] = charIDToTypeID(str));
}

function str_to_type( str ) {
  return str_to_type_map[str] 
          ? str_to_type_map[str] 
          : (str_to_type_map[str] = stringIDToTypeID(str));
}


function type_to_str ( id ) {
  return type_to_str_map[id] 
          ? type_to_str_map[id] 
          : (type_to_str_map[id] = typeIDToStringID(id));
    
}


var c2t = chr_to_type;
var s2t = str_to_type;
var t2s = type_to_str;

function get_active_layer_attr( psKey, type ) {
  var ref;
  ref = new ActionReference();
  ref.putProperty( c2t( 'Prpr' ), psKey );
  ref.putEnumerated( c2t('Lyr '), c2t('Ordn'), c2t('Trgt') );     
  var res = executeActionGet( ref );
  try {
      return res['get' + (type || 'ObjectValue')]( psKey );
  } catch (err) {
      //alert("Background layer has no FX.");
      return false;
  }
}


function get_layer_effect_visible () {
  return get_active_layer_attr( s2t('layerFXVisible'), 'Boolean' );
}

Array.prototype.forEach = function( handle ) {
  var len = this.length;
  for(var i = 0; i< len; i++){
    handle.call(this[i], this[i], i, this);
  }
}

var _set_effects_viz = function(id) {
  var desc = new ActionDescriptor();
  var list = new ActionList();
  var ref = new ActionReference();
  ref.putClass(c2t('Lefx'));
  ref.putEnumerated(c2t("Lyr "), c2t("Ordn"), c2t("Trgt"));
  list.putReference(ref);
  desc.putList(c2t('null'), list);
  executeAction(c2t(id), desc, DialogModes.NO);
};

var hide_layer_effects = function() {
  _set_effects_viz('Hd  ');
};

var show_layer_effects = function() {
  _set_effects_viz('Shw ');
};


function unit_as_px( unit_value ) {
  var ret = '';
  unit_value.convert("px");
  return unit_value.value;
}

function bounds_to_bbox( bounds, exports ) {
  exports = exports || {};

  exports.left = unit_as_px(bounds[0]);
  exports.top = unit_as_px(bounds[1]);
  exports.right = unit_as_px(bounds[2]);
  exports.bottom = unit_as_px(bounds[3]);


  exports.width = exports.right - exports.left;
  exports.height = exports.bottom - exports.top;

  return exports;
}


function walk_though_layers ( root, handle, root_path ) {
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
        walk_though_layers(child, handle, root_path);
      }
    }
  }
}