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

var position_keys = [
  'top', 'bottom',
  'left', 'right'
];

var size_keys = [
  'width', 'height', 'font-size'
];
// 
// var name_type_map = {
//   'child_pos_type' : {
//     'enum' : [ 'relative', 'absolute' ]
//   },
//   'align-horizontal' : {
//     'enum' : [ 'left', 'center', 'right' ]
//   },
//   'align-vertical' : {
//     'enum' : [ 'top', 'center', 'bottom' ]
//   }
// };

function normalize_value( string, options ) {
  if(typeof string == 'string' && !string.match(/[0-9]$/)){
    return string;
  }
  string = 1 * string;
  if( options.unit_type == 'rem' ){
    return string / (options.rem_base *1) + 'rem';
  } else {
    return string +  options.unit_type;
  }
}

var attributs_to_css = module.exports = function( layer_node, options ) {


  var style = layer_node.style;

  if( !style ){
    return '';
  }

  var rets  = [];
  options = _.extend({
    unit_type : 'px'
  }, options);

  var origin_style_keys = Object.keys(style);
  var plain_styles = _.difference(origin_style_keys, position_keys.concat(size_keys));

  plain_styles.forEach(function( key ) {
    rets.push( key + ':' + style[key] );
  });

  size_keys.forEach(function( key ) {
    if( key in style ){
      rets.push( key + ':' + normalize_value( style[key], options) );
    }
  });

  var effects = _.extend({
    'align-horizontal' : 'left',
    'align-vertical' : 'top'
  }, layer_node.effect);

  var pos_style = layer_node.relative_style || style;

  switch( effects['align-horizontal'] ){
    case 'left' :
      rets.push( 'left: ' + normalize_value(pos_style['left'], options) );
      break;
    case 'right' :
      rets.push( 'right: ' + normalize_value(pos_style['right'], options) );
      break;
    case 'center' :
      rets.push( 'margin-left:0');
      rets.push( 'margin-right:0');
      rets.push( 'left: 0');
      rets.push( 'right: 0');
      break;
  }

  switch( effects['align-vertical'] ){
    case 'top' :
      rets.push( 'top: ' + normalize_value(pos_style['top'], options) );
      break;
    case 'bottom' :
      rets.push( 'bottom: ' + normalize_value(pos_style['bottom'], options) );
      break;
    case 'center' :
      rets.push( 'margin-top:0');
      rets.push( 'margin-bottom:0');
      rets.push( 'top: 0');
      rets.push( 'bottom: 0');
      break;
  }

  var delimiter = ';';
  if( options.beautify ){
    delimiter = ';\n';
  }

  var ret = rets.join(delimiter);
  return ret;
}