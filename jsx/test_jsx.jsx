#include './utils.jsx';
#include './json.jsx';

$.level = 1;


var runButtonId = 1;
var cancelButtonID = 2;

function config_ui () {

  var exportsInfo = {};

  var dlgMain = new Window("dialog", 'psd 导出设置');

  // match our dialog background color to the host application
  var brush = dlgMain.graphics.newBrush (dlgMain.graphics.BrushType.THEME_COLOR, "appDialogBackground");
  dlgMain.graphics.backgroundColor = brush;
  dlgMain.graphics.disabledBackgroundColor = dlgMain.graphics.backgroundColor;

  dlgMain.orientation = 'column';
  dlgMain.alignChildren = 'left';
  
  // -- top of the dialog, first line
  dlgMain.add("statictext", undefined, '设置资源导出模式');

  // -- two groups, one for left and one for right ok, cancel
  var grpTop = dlgMain.add("group");
  grpTop.orientation = 'row';
  grpTop.alignChildren = 'top';
  grpTop.alignment = 'fill';

  // -- group top left 
  var grpTopLeft = grpTop.add("group");
  grpTopLeft.orientation = 'column';
  grpTopLeft.alignChildren = 'left';
  grpTopLeft.alignment = 'fill';
  
  var grpTopRight = grpTop.add("group");
  grpTopRight.orientation = 'column';
  grpTopRight.alignment = 'fill';

  // -- the second line in the dialog
  var grpSecondLine = grpTopLeft.add("group");
  grpSecondLine.orientation = 'row';
  grpSecondLine.alignChildren = 'center';

  var grpThirdLine = grpTopLeft.add("group");
  grpSecondLine.orientation = 'row';
  grpSecondLine.alignChildren = 'center';

  var etDestination = grpSecondLine.add("edittext", undefined, 'd:/temp');
  etDestination.preferredSize.width = 160;

  var chbAutoMerge = grpThirdLine.add('checkbox', undefined, '自动合并图层');
  chbAutoMerge.value = false;

  var btnBrowse = grpSecondLine.add("button", undefined, '浏览');
  var btnRun    = grpTopRight.add("button", undefined, '导出');
  var btnCancel = grpTopRight.add("button", undefined, '取消');

  btnBrowse.onClick = function() {
    var defaultFolder = etDestination.text;
    var testFolder = new Folder(etDestination.text);
    if (!testFolder.exists) {
      defaultFolder = "~";
    }
    var selFolder = Folder.selectDialog('选择导出目录', defaultFolder);
    if ( selFolder != null ) {
      etDestination.text = selFolder.fsName;
    }
  };

  btnRun.onClick = function() {
    dlgMain.close(runButtonId); 
  };

  btnCancel.onClick = function() {
    dlgMain.close(cancelButtonID); 
  };

  var result = dlgMain.show();

  function clearup () {
    dlgMain = null;
    grpTop = null;
    grpTopLeft = null;
    grpTopRight = null;
    grpThirdLine = null;
    grpSecondLine = null;
    etDestination = null;
    btnBrowse = null;
    btnRun = null;
    btnCancel = null;
  }

  if( result == cancelButtonID ){

    clearup();
    return cancelButtonID;

  } else {

    exportsInfo.destination = etDestination.text;
    exportsInfo.bauto_merge = chbAutoMerge.value;
    clearup();

    return exportsInfo;
  }

}



var start = new Date().getTime();
var ret = config_ui();
if( ret != cancelButtonID ){
  // do exports here
  // so how can we get a progress bar?
}

var end = new Date().getTime();

$.writeln( obj2str(ret) );
$.writeln('process : ' + (end - start) + ' ms');