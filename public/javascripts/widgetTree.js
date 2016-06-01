define([
  './libs/util',
  './widgetConfig',
  './widgetPreviewer',
  'underscore',
  'knockout'
],function(
  util,
  widgetConfig,
  widgetPreviewer,
  __,
  ko
){


  var node_detail_url = '/node_source';

  var NodeModel = function(data) {

    var self = this;
    
    self.origin = data;

    self.isExpanded = ko.observable(true);
    self.description = ko.observable( data.description );
    self.name = ko.observable( data.name );


    self.type = data.type;
    self.root = data.root;
    self.href = data.href;

    self.style = data.style || {};
    self.ext_style = data.ext_style || {};
    self.effect = data.effect || {};

    self.text= data.text;
    self.class_name = data.class_name;
    self.src = data.src;


    self.toggleVisibility = function(vm, e) {
      e.stopPropagation();
      this.isExpanded(!this.isExpanded());
    };

    self.showContent = function(_vm, e) {
      e.stopPropagation();

      widgetConfig.node(_vm);
    };

    var nodes = [];
    data.nodes && data.nodes.forEach(function(node) {
      nodes.push(new NodeModel(node));
    });

    self.nodes = ko.observableArray(nodes);

    if( self.type == 'directory' ){
      self.bbox = util.compose_bbox( nodes );
    }
  };
  
  var tab = function( data ) {
    this.name = ko.observable(data.name);
    this.selected = ko.observable(!!data.selected);
  };

  var vm = {
    treeData : ko.observable(),
    node_detail_url : '/node_source',
    active_tab_name : 'source',
    tabs : ko.observableArray([new tab({ name : 'source', selected : true }), new tab({ name : 'dest'})]),
    select: function( _vm ) {
      if( _vm.selected() ){
        return;
      }

      sync_file_tree(_vm.name());

      vm.node_detail_url = '/node_' + _vm.name();
      vm.active_tab_name = _vm.name();

      vm.tabs().forEach(function( _vm ) {
        _vm.selected( false );
      });

      _vm.selected(true); 
    }
  };

  function file_arr_to_file_tree( nodes ) {
    var keys = Object.keys(nodes);
    keys.forEach(function( key ) {
      var node = nodes[key];
      var parent = nodes[node.parent];

      node.type = node.is_group ? 'directory' : 'file';
      node.description = key;
      node.name = node.class_name;

      if( parent ){
        (parent.nodes = parent.nodes || []).push(node);
      }
    });

    return nodes;
  }

  var sync_file_tree = _.debounce(function( type ) {
    $.getJSON('/tree?type=' + type, function( data ) {
      var node_map = file_arr_to_file_tree( data.items );

      vm.treeData(
        new NodeModel({ 
          nodes : data.roots.map( function( root ) {
                    return node_map[root];
                  }) 
          })
      );

      var root = node_map[data.roots[0]];

      widgetPreviewer.width( root.style.width );
      widgetPreviewer.height( root.style.height );

    });
  },300);

  sync_file_tree('source');

  return vm;
});