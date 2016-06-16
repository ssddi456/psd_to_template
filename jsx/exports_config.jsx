#include './utils.jsx';
#include './json.jsx';

var runButtonId = 1;
var cancelButtonID = 2;

var option_storage_desc = 'exports_layer_info';
var config_key = str_to_type("exports_settings");


// "d69fc733-75b4-4d5c-ae8a-c6d6f9a8aa32"
// 'xxxxxxyx-xyxx-4xxx-yxxx-xxxxxxxxxxyy'.replace(/[xy]/g, function (c) {
//                 var r = Math.random() * 16 | 0;
//                 var v = c === 'x' ? r : (r & 0x3 | 0x8);
//                 return v.toString(16);
//             });

function config_ui () {

  var exportsInfo = {};


  try {
    var d = app.getCustomOptions(config_key);
    descriptorToObject(exportsInfo, d, option_storage_desc);
    d = null;
  }
  catch(e) {
    // it's ok if we don't have any options, continue with defaults
  }


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
  grpThirdLine.orientation = 'row';
  grpThirdLine.alignChildren = 'left';

  var grpFourthLine = grpTopLeft.add("group");
  grpFourthLine.orientation = 'row';
  grpFourthLine.alignChildren = 'center';

  var etDestination = grpSecondLine.add("edittext", undefined, exportsInfo.destination || 'd:/temp');
  etDestination.preferredSize.width = 160;

  var grp_3_1 = grpThirdLine.add('group');
  grp_3_1.orientation = 'row';
  grp_3_1.alignChildren = 'center';

  var grp_3_2 = grpThirdLine.add('group');
  grp_3_2.orientation = 'row';
  grp_3_2.alignChildren = 'left';
  grp_3_2.visible = exportsInfo.auto_merge || false;

  var chbAutoMerge = grp_3_1.add('checkbox', undefined, '自动合并图层');
  chbAutoMerge.value = exportsInfo.auto_merge || false;

  grp_3_2.add('statictext', undefined, '保留图层层级');
  var etLayerDeep = grp_3_2.add('edittext', undefined, (exportsInfo.layer_deep || 0) + '');

  var chbExportImage = grpFourthLine.add('checkbox', undefined, '导出图片资源');
  chbExportImage.value = exportsInfo.if_exports_image || true;

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

  chbAutoMerge.onClick = function() {
    grp_3_2.visible = chbAutoMerge.value;
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
    
    grpSecondLine = null;
    grpThirdLine = null;
    chbAutoMerge = null;

    etDestination = null;
    btnBrowse = null;
    btnRun = null;
    btnCancel = null;

    grpFourthLine = null;
    chbExportImage = null;

    grp_3_1 = null;
    grp_3_2 = null;
    etLayerDeep = null;
  }

  if( result == cancelButtonID ){

    clearup();
    return cancelButtonID;

  } else {

    exportsInfo.destination = etDestination.text;
    exportsInfo.auto_merge = chbAutoMerge.value;
    exportsInfo.layer_deep = Math.max(0, etLayerDeep.text*1);
    exportsInfo.if_exports_image = chbExportImage.value;
    
    var d = objectToDescriptor(exportsInfo, option_storage_desc);
    app.putCustomOptions(config_key, d);
    d = null;

    clearup();

    return exportsInfo;
  }

}
