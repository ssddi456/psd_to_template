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
    if( node.is_group ){
      var code = [
                    get_indents(indent) + '<div class="'+ node.class_name.slice(1) + '">', 
                    node.nodes.slice().reverse()
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

    if( node.is_group ){
      var code = [
                    get_indents(indent) + node.class_name,
                    node.nodes.slice().reverse()
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
    
    if( node.is_group ){
      var code = [
                    get_indents(indent) + '<g class="'+ node.class_name.slice(1) + '">', 
                    node.nodes.slice().reverse()
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

      var relative_to_bbox = conf.relative_to_bbox;

      var ext_style = node.ext_style;
      var transform = ext_style.transform;

      if( node.text ){

        var left = conf.text_middle ? ( ext_style.left  + ext_style.width / 2 ) : ext_style.left;
        left -= relative_to_bbox.left;
        var top = ext_style.bottom - relative_to_bbox.top;
        // we should caculate here
        if( transform ){
          transform = {
            'xx' : transform['xx'], 
            'yx' : transform['yx'], 
            'xy' : transform['xy'], 
            'yy' : transform['yy'],

            'tx' : transform['tx'] + left, 
            'ty' : transform['ty'] + top - ext_style.height
          };
        }

        return indent + '<text class="' + node.class_name.slice(1) + '" \n'
                + subindent + 'text-anchor="middle"\n'
                + ( transform 
                    ? ( subindent + 'transform="matrix(' 
                                  + [ 'xx', 'yx', 'xy', 'yy','tx', 'ty' ]
                                      .map(function( k ) {
                                          return transform[k];
                                      }).join(',') 
                                  + ')"\n')
                    : subindent + 'x="' + left + '" y="' + top + '" \n')
                + subindent + 'width="' + ext_style.width + '" height="' + ext_style.height + '">\n'
                + subindent + '<tspan>' + node.text + '</tspan>\n'
                + indent + '</text>';
      } else {

        var left = style.left - relative_to_bbox.left;
        var top  = style.top  - relative_to_bbox.top;

        return indent + '<image class="' + node.class_name.slice(1) + '" \n'
                + subindent + 'x="' + left + '" y="' + top + '" \n'
                + ( transform ? ( subindent + 'transform="matrix(' 
                                  + [ 'xx', 'yx', 'xy', 'yy', 'tx', 'ty' ]
                                      .map(function( k ) {
                                          return transform[k];
                                      }).join(',') 
                                  + ')"\n')
                    : '')
                + subindent + 'width="' + style.width + '" height="' + style.height + '" \n'
                + subindent + 'xlink:href="' + node.relative_src + '" '
                + indent + '></image>';
      }
    }
  }
};

var root_map = {
  'html' : function( code, conf ) {
    return [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '  <head>',
      '    <meta charset="UTF-8">',
      '    <title>Document</title>' 
      + ( conf.css_hook ? '<style>\n<!-- css_hook -->\n</style>' : ''),
      '  </head>',
      '  <body>',
      code,
      '  </body>',
      '</html>',
    ].join('\n');        
  },
  'jade' : function( code, conf ) {
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
  'svg'  : function( code, conf ) {
    return [
      '<svg ',
      '  version="0.1" ',
      '  xmlns="http://www.w3.org/2000/svg" ',
      '  xmlns:xlink="http://www.w3.org/1999/xlink" >' 
      + ( conf.css_hook ? '<style>\n<!-- css_hook -->\n</style>' : ''),
      code,
      '</svg>'
    ].join('\n');
  }
};

function create_html( node, conf ) {
  var type = conf.html_type;

  var indent = 0;

  conf.text_middle = (conf.text_middle + '' == 'true');
  var with_root = (conf.with_root + '' == 'true');

  if( with_root ){
    indent = 2;
  }

  if( node.effect.child_pos_type == 'relative' ){
    var style = node.style;

    conf.relative_to_bbox = {
      left   : style.left,
      top    : style.top,
      right  : style.right,
      bottom : style.bottom,
    };
  } else {
    conf.relative_to_bbox = {
      left   : 0,
      top    : 0,
      right  : 0,
      bottom : 0,
    };
  }

  var ret = html_generators[type](node, indent, conf);
  if( with_root ){
    ret = root_map[type](ret, conf);
  }
  return ret;
}

module.exports = create_html;