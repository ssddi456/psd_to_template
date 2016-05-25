require([
  'knockout',
  './custom_bindings',
  './widgetConfig',
  './widgetTree',
  './widgetPreviewer'
],function(
  ko,
  custom_bindings,
  widgetConfig,
  widgetTree,
  widgetPreviewer
){


  var vm = {
    widgetPreviewer : widgetPreviewer,
    widgetTree : widgetTree,
    widgetConfig : widgetConfig
  };


  ko.applyBindings(vm);
});