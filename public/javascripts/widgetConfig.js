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
                      node.nodes()
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
                      node.nodes()
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
                      node.nodes()
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
          return indent + '<text class="' + node.class_name.slice(1) + '" \n'
                  + subindent + 'x="' + style.left + '" y="' + style.top + '" \n'
                  + subindent + 'width="' + style.width + '" height="' + style.height + '">\n'
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


  function create_html( node ) {
    var type = vm.html_type();

    var ret = html_generators[type](node);

    vm.html(ret);
  }

  function create_css( node ) {
    $.getJSON('/compile_node', node, function(json) {
      vm.css(json.css);
    });
  }

  function create_exports ( node ) {
    create_html(node);

    var actual_node = get_actual_node_info(node);
    create_css(actual_node);
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
    vm.unit_type( config.unit_type );
    vm.rem_base( config.rem_base );

    vm.html_type.subscribe(update_config);
    vm.unit_type.subscribe(update_config);
    vm.rem_base.subscribe(update_config);
  });

  function update_config() {
    $.post('/config/update',{
      html_type : vm.html_type(),
      unit_type : vm.unit_type(),
      rem_base : vm.rem_base()
    },function() {
      create_exports( vm.node() );
    })
  }


  return vm;
});