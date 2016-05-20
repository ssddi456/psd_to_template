define([
  'knockout'
],function(
  ko
){

  var vm = {
    attributes : ko.observableArray(),
    node : ko.observable().extend({ rateLimit : 1000 }),

    html_type : ko.observable('html'),
    html_types : ['html', 'jade'],

    unit_type : ko.observable('px'),
    unit_types : ['px', 'em'],

    em_base : ko.observable(16),

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

  function create_html( node ) {
    var ret = '';
    var type = vm.html_type();



    vm.html(ret);
  }

  function create_css( node ) {
    var ret = '';



    vm.css(ret);
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

  function editable_property ( node, attr_name ) {
    var data = node[attr_name];

    return Object.keys(data)
            .map(function( key ) {
              var value = ko.observable( data[key] );
              
              value.subscribe(function( value ) {
                data[key] = value;

                create_exports( node );
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


  return vm;
});