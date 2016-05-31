var path    = require('path');
var debug_name = path.basename(__filename,'.js');
if( debug_name == 'index'){
  debug_name = path.basename(__dirname);
}
(require.main === module) && (function(){
    process.env.DEBUG = '*';
})()
var debug = require('debug')(debug_name);


console.time('process_time');
var psd = require('psd');
var fs = require('fs');

var jade = require('jade');

var read_layer_style = require('./read_layer_style');

var open_psd = psd.fromFile('../resource/cardtemplate.psd')
open_psd.parse();

var root = open_psd.tree();

function walk_tree ( node, handle ) {
  node.children().forEach(function( node ) {
    handle(node);
    if( node.hasChildren() ){
      walk_tree(node, handle);
    }
  });
}

var nodes = [];
var font_family_map = {
  'CooperBlackStd' : 'Cooper Std Black'
};

walk_tree(root, function( node ) {
  var layer_name = node.get('name');
  var type = node.get('type');

  debug( 'node', type, layer_name );
  debug('bbox', node.get('top'), 
                node.get('bottom'), 
                node.get('left'), 
                node.get('right'),
                node.get('height'),
                node.get('width') );

  


  if( type == 'layer') {
    var node_info = node.export();
    


    if( node_info.text ){
      var text = node_info.text;
      var font = text.font;

      debug( 'text', 
        text.value, 
        font.name, 
        font.sizes, 
        font.colors,
        font.alignment );

      var color = font.colors[0].slice();
      color[3] = color[3]/255;

      debug('font', font);

      var layer_node = {
        type : 'text',
        text : text.value,
        style : {
          top : node_info.top,
          left : node_info.left,
          width : node_info.width,
          height : node_info.height,
          color: 'rgba(' + color.join(',') +')',
          font : font.sizes[0] + 'px "' + (font_family_map[font.name] ||  font.name  ) + '"' 
        },
        effect : {}
      };

    } else {
      var src = path.join(__dirname, layer_name + '.png')
      node.saveAsPng( src );

      var layer_node = {
        type : 'img',
        src : src.replace(/\\/g,'/'),
        style : {
          top : node_info.top,
          left : node_info.left,
          width : node_info.width,
          height : node_info.height
        },
        effect : {}
      };
    }

    var objectEffects= node.layer.adjustments.objectEffects;
    if( objectEffects ){
      read_layer_style( node_info, objectEffects, layer_node );
    }

    nodes.push( layer_node );

  } else {
    // debug( node );
  }

});

console.timeEnd('process_time');

var out_html = path.join( __dirname, 'test.html' );
var template_jade = path.join( __dirname, 'template.jade' );

var html = jade.renderFile( template_jade, { 
              nodes : nodes.reverse(),
              obj_to_style_str : function( obj ) {
                var ret = '';
                Object.keys(obj).forEach(function( k ) {
                  var v = obj[k] + '';
                  switch(k){
                    case 'top':
                    case 'left':
                    case 'right':
                    case 'bottom':
                    case 'height':
                    case 'width':
                      if( v.match(/[0-9]$/) ){
                        v += 'px';
                      }
                      ret += k + ':' + v + '; ';
                      return 
                    default : 
                      ret += k + ':' + v + '; '; 
                      return
                  }
                });
                return ret;
              }
            });

fs.createWriteStream( out_html ).write(html);

//
//  exports layers
//    name
//    transition
//    bitmap
//    effects
//  

