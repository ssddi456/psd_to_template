#include './utils.jsx';

var font_family_map = {
  'CooperBlackStd' : 'Cooper Std Black'
};


function get_text_style( layer, layer_node ) {
  var css_style = layer_node.style;
  var ext_style = layer_node.ext_style;
  
  var textitem = layer.textItem;

  css_style['font-family'] = font_family_map[textitem.font] || textitem.font;// notice this is the postscript name
  css_style['font-size'] = unit_as_px(textitem.size);

  css_style['color'] = ('#' + textitem.color.rgb.hexValue + '').toLowerCase();

  var position = textitem.position;

  ext_style.text_x  = unit_as_px(position[0]);
  ext_style.text_y  = unit_as_px(position[1]);
  // font size font family and color 
}