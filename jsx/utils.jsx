var chr_to_type_map = {};
var str_to_type_map = {};

var type_to_str_map = {};

function chr_to_type ( str ) {
  return chr_to_type_map[str] 
          ? chr_to_type_map[str] 
          : (chr_to_type_map[str] =  charIDToTypeID(str));
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


function walk_though_layers ( root, handle, root_path, depth ) {
  if( root_path !== undefined ){
    root_path += '_' + root.name;
  } else {
    root_path = 'root';
    depth = 0;
    handle( root, true, true, '', depth);
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
      handle(child, false, false, root_path, depth + 1);
    } else if( typename == 'LayerSet' ){
      var ret = handle(child, true, false, root_path, depth + 1);
      if( ret !== false ){
        walk_though_layers(child, handle, root_path, depth + 1);
      }
    }
  }
}



///////////////////////////////////////////////////////////////////////////////
// Function: objectToDescriptor
// Usage: create an ActionDescriptor from a JavaScript Object
// Input: JavaScript Object (o)
//        object unique string (s)
//        Pre process converter (f)
// Return: ActionDescriptor
// NOTE: Only boolean, string, number and UnitValue are supported, use a pre processor
//       to convert (f) other types to one of these forms.
// REUSE: This routine is used in other scripts. Please update those if you 
//        modify. I am not using include or eval statements as I want these 
//        scripts self contained.
///////////////////////////////////////////////////////////////////////////////
function objectToDescriptor (o, s, f) {
  if (undefined != f) {
    o = f(o);
  }
  var d = new ActionDescriptor;
  var l = o.reflect.properties.length;
  d.putString( chr_to_type( 'Msge' ), s );
  for (var i = 0; i < l; i++ ) {
    var k = o.reflect.properties[i].toString();
    if (k == "__proto__" || k == "__count__" || k == "__class__" || k == "reflect")
      continue;
    var v = o[ k ];
    k = str_to_type(k);
    switch ( typeof(v) ) {
      case "boolean":
        d.putBoolean(k, v);
        break;
      case "string":
        d.putString(k, v);
        break;
      case "number":
        d.putDouble(k, v);
        break;
      default:
      {
        if ( v instanceof UnitValue ) {
          var uc = new Object;
          uc["px"] =  chr_to_type("#Rlt"); // unitDistance
          uc["%"] =  chr_to_type("#Prc"); // unitPercent
          d.putUnitDouble(k, uc[v.type], v.value);
        } else {
          throw( new Error("Unsupported type in objectToDescriptor " + typeof(v) ) );
        }
      }
    }
  }
    return d;
}


///////////////////////////////////////////////////////////////////////////////
// Function: descriptorToObject
// Usage: update a JavaScript Object from an ActionDescriptor
// Input: JavaScript Object (o), current object to update (output)
//        Photoshop ActionDescriptor (d), descriptor to pull new params for object from
//        object unique string (s)
//        JavaScript Function (f), post process converter utility to convert
// Return: Nothing, update is applied to passed in JavaScript Object (o)
// NOTE: Only boolean, string, number and UnitValue are supported, use a post processor
//       to convert (f) other types to one of these forms.
// REUSE: This routine is used in other scripts. Please update those if you 
//        modify. I am not using include or eval statements as I want these 
//        scripts self contained.
///////////////////////////////////////////////////////////////////////////////
function descriptorToObject (o, d, s, f) {
  var l = d.count;
  if (l) {
      var keyMessage = chr_to_type( 'Msge' );
        if ( d.hasKey(keyMessage) && ( s != d.getString(keyMessage) )) return;
  }
  for (var i = 0; i < l; i++ ) {
    var k = d.getKey(i); // i + 1 ?
    var t = d.getType(k);
    strk = type_to_str(k);
    switch (t) {
      case DescValueType.BOOLEANTYPE:
        o[strk] = d.getBoolean(k);
        break;
      case DescValueType.STRINGTYPE:
        o[strk] = d.getString(k);
        break;
      case DescValueType.DOUBLETYPE:
        o[strk] = d.getDouble(k);
        break;
      case DescValueType.UNITDOUBLE:
        {
        var uc = new Object;
        uc[ chr_to_type("#Rlt")] = "px"; // unitDistance
        uc[ chr_to_type("#Prc")] = "%"; // unitPercent
        uc[ chr_to_type("#Pxl")] = "px"; // unitPixels
        var ut = d.getUnitDoubleType(k);
        var uv = d.getUnitDoubleValue(k);
        o[strk] = new UnitValue( uv, uc[ut] );
        }
        break;
      case DescValueType.INTEGERTYPE:
      case DescValueType.ALIASTYPE:
      case DescValueType.CLASSTYPE:
      case DescValueType.ENUMERATEDTYPE:
      case DescValueType.LISTTYPE:
      case DescValueType.OBJECTTYPE:
      case DescValueType.RAWTYPE:
      case DescValueType.REFERENCETYPE:
      default:
        throw( new Error("Unsupported type in descriptorToObject " + t ) );
    }
  }
  if (undefined != f) {
    o = f(o);
  }
}
