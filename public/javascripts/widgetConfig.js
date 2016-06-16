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
    css : ko.observable(''),

    preview_info : ko.observable()
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

  function create_exports ( node ) {
    var actual_node = get_actual_node_info(node);

    $.getJSON('/compile_node', actual_node, function(json) {

      vm.html(json.html);
      vm.css(json.css);

      json.preview_info = json.preview_info || {};

      var style = node.style;
      json.preview_info.wh_size = style.width + ' x ' + style.height;

      vm.preview_info(json.preview_info);
    });
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
      pathname : node.pathname
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