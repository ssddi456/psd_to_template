define([
  'knockout'
],function(
  ko
){

  var vm = {
    attributes : ko.observableArray(),
    node : ko.observable(),

    html_type : ko.observable('html'),
    html_types : ['html', 'jade', 'svg'],
    text_middle : ko.observable(false),

    with_root : ko.observable(false),
    unit_type : ko.observable('px'),
    unit_types : ['px', 'rem'],

    rem_base : ko.observable(16),

    html : ko.observable(''),
    css : ko.observable('')
  };

  var visible_keys = [
    "origin",
    "hash",
    "query",
    "ext",
    "useCompile",
    "useDomain",
    "useCache",
    "useHash",
    "useMap",
    "_isImage",
    "_isText",
    "isMod",
    "requires",
    "extras",
    "_likes",
    "charset",
    "release",
    "url",
    "id"
  ];

  function get_indents( n ) {
    return Array(n+1).join('  ');
  }

  // 这里需要实现一个编辑器
  // 
  // 单节点
  //   属性编辑
  //     发送整个node， 生成patcher， 可以只扫描单个节点
  //   
  //   生成 css
  //   
  // group
  //   节点编辑，子节点为relative or absolute
  //   生成 html or jade
  //   生辰 css
  // 

  var html_generators = {
    'html' : function( node, indent ) {
      indent = indent || 0;
      if( node.type == 'directory' ){
        var code = [
                      get_indents(indent) + '<div class="'+ node.class_name.slice(1) + '">', 
                      node.nodes().reverse()
                        .map(function( node ) {
                          return html_generators['html'](node, indent+1);
                        }).join('\n'),
                      get_indents(indent) + '</div>'
                   ].join('\n');
        return code;
      } else {
        return get_indents(indent) + '<div class="' + node.class_name.slice(1) + '">' 
                + (node.text || '') + '</div>';
      }
    },
    'jade' : function( node, indent ) {
      indent = indent || 0;

      if( node.type == 'directory' ){
        var code = [
                      get_indents(indent) + node.class_name,
                      node.nodes().reverse()
                        .map(function( node ) {
                          return html_generators['jade'](node, indent+1);
                        }).join('\n'),
                   ].join('\n');
        return code;
      } else {
        return get_indents(indent) + node.class_name;
      }
    },
    'svg'  : function( node, indent ) {
      indent = indent || 0;
      
      if( node.type == 'directory' ){
        var code = [
                      get_indents(indent) + '<g class="'+ node.class_name.slice(1) + '">', 
                      node.nodes().reverse()
                        .map(function( node ) {
                          return html_generators['svg'](node, indent+1);
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
          var left = vm.text_middle() ? ( ext_style.left  + ext_style.width / 2 ) : ext_style.left;

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
                  + subindent + 'xlink:href="' + node.src + '" '
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
        "",
        "    link(rel='stylesheet', type='text/css', href='//cdn.staticfile.org/twitter-bootstrap/3.3.1/css/bootstrap.min.css')",
        "    link(rel='stylesheet', href='/stylesheets/main.css')",
        "    link(rel='stylesheet', href='/stylesheets/jstree.css')",
        "",
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

  function create_html( node ) {
    var type = vm.html_type();

    var indent = 0;
    var with_root = vm.with_root();
    if( with_root ){
      indent = 2;
    }

    var ret = html_generators[type](node, indent);
    if( with_root ){
      ret = root_map[type](ret);
    }
    vm.html(ret);
  }

  function create_css_frame( node, upper_lv ) {
    upper_lv = upper_lv  || '';
    if( upper_lv ){
      upper_lv += ' ';
    }

    var rets = [];
    var cur_name = upper_lv + node.class_name;

    rets.push( cur_name );
    rets.push( '{' );
    rets.push( '}' );

    node.nodes().reverse().forEach(function( node ) {
      rets.push( create_css_frame( node, cur_name ) );
    });

    return rets.join('\n');
  }

  function create_css( node ) {
    if( node.type == 'directory') {
      vm.css(create_css_frame(node));
      return;
    }

    var actual_node = get_actual_node_info(node);

    $.getJSON('/compile_node', actual_node, function(json) {
      vm.css(json.css);
    });
  }

  function create_exports ( node ) {
    create_html(node);
    create_css(node);
  }

  var name_type_map = {
    'child_pos_type' : {
      'enum' : [ 'relative', 'absolute' ]
    },
    'align-horizontal' : {
      'enum' : [ 'left', 'center', 'right' ]
    },
    'align-vertical' : {
      'enum' : [ 'top', 'center', 'bottom' ]
    }
  };

  function get_actual_node_info ( node ) {
    return {
      style :      node.style,
      effect :     node.effect,

      children :   node.origin.children,
      parent :     node.origin.parent,
      is_group :   node.origin.is_group,
      class_name : node.origin.class_name,
      index :      node.origin.index,
    };  
  }
  function change_node_attribute ( node ) {
    var actual_node = get_actual_node_info(node);

    $.post('/change_node', {
      node_name : node.description,
      attributes: actual_node
    }, function( json ) {

      create_exports(node);
    });
  }

  function editable_property ( node, attr_name ) {
    var data = node[attr_name];

    return Object.keys(data)
            .map(function( key ) {
              var value = ko.observable( data[key] );
              
              value.subscribe(function( value ) {
                data[key] = value;

                change_node_attribute( node );
              });

              var ret = {
                key : key,
                value : value
              };

              if( key in name_type_map ){
                ret.type_info = name_type_map[key];
              }

              return ret;
            });
  }

  vm.node.subscribe(function(node, prev ) {
    var data = node.style;

    var attributes = editable_property(node, 'style')
                      .concat(editable_property(node, 'effect'));

    vm.attributes(attributes);

    create_exports( node );
  });

  $.getJSON('/config', function( json ) {
    var config = json.config;

    vm.html_type( config.html_type );
    vm.with_root( !!config.with_root );
    vm.text_middle( !!config.text_middle );

    vm.unit_type( config.unit_type );
    vm.rem_base( config.rem_base );

    vm.html_type.subscribe(update_config);
    vm.with_root.subscribe(update_config);
    vm.text_middle.subscribe(update_config);

    vm.unit_type.subscribe(update_config);
    vm.rem_base.subscribe(update_config);
  });

  function update_config() {
    $.post('/config/update',{
      html_type : vm.html_type(),
      with_root : vm.with_root(),
      text_middle : vm.text_middle(),

      unit_type : vm.unit_type(),
      rem_base : vm.rem_base()
    },function() {
      create_exports( vm.node() );
    })
  }


  return vm;
});