define([
  'knockout'
],function(
  ko
){

  function set_auto_scale_height ( element, text ) {
    var $el = $(element); 
    var lh = parseInt($el.css('line-height'));

    var borders = parseInt($el.css('border-bottom-width')) + 
                  parseInt($el.css('border-top-width')) +
                  parseInt($el.css('padding-bottom')) + 
                  parseInt($el.css('padding-top'));

    var lines = text.split('\n').length;
    $el.css('height', lines*lh + borders);
  }

  ko.bindingHandlers.autoscale = {
    'init': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
      ko.bindingHandlers['value'].init(element, valueAccessor, allBindings, viewModel, bindingContext);
      set_auto_scale_height( element, ko.utils.unwrapObservable(valueAccessor()));

      $(element)
        .on('click',function() {
          this.select();
        })
        .attr('title','click to select');

    },
    'update': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
      set_auto_scale_height( element, ko.utils.unwrapObservable(valueAccessor()));  
    }
  };

  return {};
});