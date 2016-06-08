
function ui_progress( max ) {
  var win = new Window("window{\
    text:'Progress',\
    bar:Progressbar{\
      bounds:[20,20,280,31],\
      value:0,\
      maxvalue:100\
    }\
  };");
  win.show();

  var cur = 0;
  var stat = 'Progress';
  win.bar.value = 0;
  win.bar.maxvalue = max;

  var ret = {
    stat : function( str ) {
        stat = str;
        ret.update(cur);
    },
    update : function( progress, force_update ) {
      cur = progress;
      win.bar.value = progress;
      win.text = stat + ' ' + progress + '/' + max;
      if( force_update !== false ){
        win.update();
      }
    },
    increase : function( force_update ) {
      cur += 1;
      ret.update( cur, force_update );
    },
    finish : function() {
      win.close();
      win = null;
    }
  };

  ret.update(0);
  return ret;
}


function ui_info ( title, text ) {
  var win = new Window("dialog", title);
  win.add('statictext', undefined, text);

  win.onClose = function() {};

  win.show();
}