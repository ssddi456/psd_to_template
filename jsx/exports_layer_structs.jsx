// Copyright 2002-2007.  Adobe Systems, Incorporated.  All rights reserved.
// Create a new art layer and convert it to a text layer.
// Set its contents, size and color.

// enable double clicking from the Macintosh Finder or the Windows Explorer
#target photoshop

// in case we double clicked the file

// debug level: 0-2 (0:disable, 1:break on error, 2:break at beginning)
$.level = 1;
// debugger; // launch debugger on next line

var docRef = app.activeDocument;

var eventWait = charIDToTypeID("Wait")
var enumRedrawComplete = charIDToTypeID("RdCm")
var typeState = charIDToTypeID("Stte")

var keyState = charIDToTypeID("Stte")
var desc = new ActionDescriptor()
desc.putEnumerated(keyState, typeState, enumRedrawComplete)
executeAction(eventWait, desc);


var str = [];
function readLayers ( node, handle ){
  var i = 0, n = node.layers.length;
  var layers = node.layers;
  var layer;
  for(;i<n;i++){
    layer = layers[i];

    if ( !layer.kind && layer.layers && layer.layers.length ){
      readLayers( layer, handle );
    } else {
      handle( layer );
    }
  }
}

readLayers( docRef, function( layer ) {
  $.writeln( 'bounds', layer.bounds );

  if( layer.kind == 'LayerKind.TEXT' ){
    var item = layer.textItem; 
    try{
      str.push(item.color.rgb.hexValue + ' ');
    } catch(e){}
    str.push(item.contents + '\n');

    $.writeln( item );

    $.writeln( item.font );
  }
});

$.write( str );

str

// if( str != '' ){
//   var file = new File( docRef.fullName + '_test.txt' );
//   file.encoding = 'UTF8';
//   file.open('w');
//   file.write( str.join('') );
//   file.close();
// }

// docRef.close(SaveOptions.DONOTSAVECHANGES);
