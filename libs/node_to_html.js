var path    = require('path');
var debug_name = path.basename(__filename,'.js');
if( debug_name == 'index'){
  debug_name = path.basename(__dirname);
}
(require.main === module) && (function(){
    process.env.DEBUG = '*';
})()
var debug = require('debug')(debug_name);

function get_indents( n ) {
  return Array(n+1).join('  ');
}

var html_generators = {
  'html' : function( node, indent, conf ) {
    indent = indent || 0;
    if( node.type == 'directory' ){
      var code = [
                    get_indents(indent) + '<div class="'+ node.class_name.slice(1) + '">', 
                    node.nodes.reverse()
                      .map(function( node ) {
                        return html_generators['html'](node, indent+1, conf);
                      }).join('\n'),
                    get_indents(indent) + '</div>'
                 ].join('\n');
      return code;
    } else {
      return get_indents(indent) + '<div class="' + node.class_name.slice(1) + '">' 
              + (node.text || '') + '</div>';
    }
  },
  'jade' : function( node, indent, conf ) {
    indent = indent || 0;

    if( node.type == 'directory' ){
      var code = [
                    get_indents(indent) + node.class_name,
                    node.nodes.reverse()
                      .map(function( node ) {
                        return html_generators['jade'](node, indent+1, conf);
                      }).join('\n'),
                 ].join('\n');
      return code;
    } else {
      return get_indents(indent) + node.class_name;
    }
  },
  'svg'  : function( node, indent, conf ) {
    indent = indent || 0;
    
    if( node.type == 'directory' ){
      var code = [
                    get_indents(indent) + '<g class="'+ node.class_name.slice(1) + '">', 
                    node.nodes.reverse()
                      .map(function( node ) {
                        return html_generators['svg'](node, indent+1, conf);
                      }).join('\n'),
                    get_indents(indent) + '</g>'
                 ].join('\n');
      return code;
    } else {
      var style = node.style;
      var subindent = get_indents(indent+1);
      indent = get_indents(indent);
      if( node.text ){
        var ext_style = node.ext_style;
        var left = conf.text_middle ? ( ext_style.left  + ext_style.width / 2 ) : ext_style.left;

        return indent + '<text class="' + node.class_name.slice(1) + '" \n'
                + subindent + 'x="' + left + '" y="' + ext_style.bottom + '" \n'
                + subindent + 'text-anchor="middle" '
                + subindent + 'width="' + ext_style.width + '" height="' + ext_style.height + '">\n'
                + subindent + '<tspan>' + node.text + '</tspan>\n'
                + indent + '</text>';
      } else {
        return indent + '<image class="' + node.class_name.slice(1) + '" \n'
                + subindent + 'x="' + style.left + '" y="' + style.top + '" \n'
                + subindent + 'width="' + style.width + '" height="' + style.height + '" \n'
                + subindent + 'xlink:href="' + node.relative_src + '" '
                + indent + '></image>';
      }
    }
  }
};

var root_map = {
  'html' : function( code ) {
    return [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '  <head>',
      '    <meta charset="UTF-8">',
      '    <title>Document</title>',
      '  </head>',
      '  <body>',
      code,
      '  </body>',
      '</html>',
    ].join('\n');        
  },
  'jade' : function( code ) {
    return [
      "<!DOCTYPE html>",
      "html(lang='en')",
      "  head",
      "    meta(charset='UTF-8')",
      "    title Document",
      "  body",
      code,
    ].join('\n');        
  },
  'svg'  : function( code ) {
    return [
      '<svg ',
      '  version="0.1" ',
      '  xmlns="http://www.w3.org/2000/svg" ',
      '  xmlns:xlink="http://www.w3.org/1999/xlink" >',
      code,
      '</svg>'
    ].join('\n');
  }
};

function create_html( node, conf ) {
  var type = conf.html_type;

  var indent = 0;
  var with_root = conf.with_root;
  if( with_root ){
    indent = 2;
  }

  var ret = html_generators[type](node, indent, conf);
  if( with_root ){
    ret = root_map[type](ret);
  }
  return ret;
}

module.exports = create_html;