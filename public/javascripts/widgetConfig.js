define([
  'knockout'
],function(
  ko
){
  var vm = {
    attributes : ko.observableArray(),
    node : ko.observable().extend({ rateLimit : 1000 })
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

  vm.node.subscribe(function(node, prev ) {
    var data = node.style;

    var attributes = Object.keys(data)
                      .map(function( key ) {
                        return {
                          key : key,
                          value: ko.observable( data[key] )
                        };
                      });

    vm.attributes(attributes);
  });

  return vm;
});