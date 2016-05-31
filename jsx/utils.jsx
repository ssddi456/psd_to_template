var chr_to_type_map = {};
var str_to_type_map = {};

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

var CTT = chr_to_type;
var STT = str_to_type;


function get_layer_attr() {
    
}

function get_layer_e() {
    
}