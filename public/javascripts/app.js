require([
  'knockout',
  './widgetConfig',
  './widgetTree',
  './widgetPreviewer'
],function(
  ko,
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