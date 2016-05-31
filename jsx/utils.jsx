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

function get_layer_e() {
    
}

Array.prototype.forEach = function( handle ) {
  var len = this.length;
  for(var i = 0; i< len; i++){
    handle.call(this[i], this[i], i, this);
  }
}