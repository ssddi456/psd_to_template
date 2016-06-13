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
    self.pathname = data.pathname;

    self.type = data.type;
    self.root = data.root;
    self.href = data.href;

    self.style = data.style || {};
    self.ext_style = data.ext_style || {};
    self.effect = data.effect || {};

    self.text= data.text;
    self.class_name = data.class_name;
    self.src = data.src;
    self.relative_src = data.relative_src;

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
  


  var vm = {
    treeData : ko.observable(),
    node_detail_url : '/node_source',
    active_tab_name : 'source',

    res_root : ko.observable(''),
    temp_res_root : ko.observable(''),
    save_res_root_failed : ko.observable(''),
    change_res_root: function( vm, e ) {
      e.stopPropagation();
      $('#change_res_root_modal').modal();
    },
    save_res_root: function( vm, e ) {
      $.post('/change_res_root', {
        root : vm.temp_res_root()
      }, function( res ) {
        if( !res.err ){
          setTimeout(function() {
            location.reload();
          }, 1e3);
        } else {
          save_res_root_failed(data.message);
        }
      });
    },
  };

  function file_arr_to_file_tree( nodes ) {
    var keys = Object.keys(nodes);
    keys.forEach(function( key ) {
      var node = nodes[key];
      var parent = nodes[node.parent];

      node.type = node.is_group ? 'directory' : 'file';
      node.description = key;
      node.name = node.class_name;
      node.pathname = key;

      if( parent ){
        (parent.nodes = parent.nodes || []).push(node);
      }
    });

    return nodes;
  }

  var sync_file_tree = _.debounce(function( type ) {
    $.getJSON('/tree?type=' + type, function( data ) {
      var node_map = file_arr_to_file_tree( data.items );

      vm.res_root(data.res_root);
      vm.temp_res_root(data.res_root);

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