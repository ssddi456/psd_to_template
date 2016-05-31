#include './utils.jsx';
#include './json.jsx';

$.level = 1;

[
  'Prpr',
  'Lyr ',
  'Ordn',
  'Trgt',
  'show',
].forEach(function( clz) {
  $.writeln(clz, ' - ', c2t( clz ));
});

$.writeln('---------');

[
  'show',
  'layerEffects',
  'layerFXVisible'
].forEach(function( clz) {
  $.writeln(clz, ' - ', s2t( clz ));
});

$.writeln('---------');

[
  1399355168,
  1853189228,
  1281713784,
].forEach(function( id ) {
  $.writeln(t2s(id), ' - ', id);
})

$.writeln('---------');

var docRef = app.activeDocument;

if( !docRef ){

} else {
  var layer = docRef.activeLayer;
  if( layer ){
    var res = get_active_layer_attr( s2t('layerEffects') );
    $.writeln( obj2str(res) );

    var res = get_active_layer_attr( s2t('layerFXVisible'), 'Boolean' );
    $.writeln( obj2str(res) );
  };

  var desc = new ActionDescriptor();
  var ref = new ActionReference();

  ref.putClass( s2t('layerEffects') );
  ref.putEnumerated( c2t('Lyr '), c2t('Ordn'), c2t('Trgt') );     
  desc.putReference(c2t('null'), ref);

  executeAction(s2t('show'), desc, DialogModes.NO);
}