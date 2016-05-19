define([

],function(

){

  var slice  = Function.prototype.call.bind(Array.prototype.slice)

  function max ( arr ) {
    Math.max.apply(null, arr);
  }

  function min ( arr ) {
    Math.min.apply(null, arr);
  }

  function compose_bbox( nodes ) {

    var lefts = [];
    var rights = [];
    var tops = [];
    var bottoms = [];

    nodes.forEach(function( node ) {
      var data = node.bbox || node.style;

      lefts.push( data.lefts );
      rights.push( data.rights );
      tops.push( data.tops );
      bottoms.push( data.bottoms );

    });

    var ret = {
      left : min(lefts) || 0,
      right : max(rights) || 0,
      tops : min(tops) || 0,
      bottoms : max(bottoms) || 0
    };

    return ret;
  }

  return {
    max : max,
    min : min,
    slice : slice,
    compose_bbox : compose_bbox
  }
});