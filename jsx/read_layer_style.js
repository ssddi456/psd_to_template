var path    = require('path');
var debug_name = path.basename(__filename,'.js');
if( debug_name == 'index'){
  debug_name = path.basename(__dirname);
}
(require.main === module) && (function(){
    process.env.DEBUG = '*';
})()
var debug = require('debug')(debug_name);


var layer_styles = ['ebbl','FrFX','IrSh','IrGl','ChFX','SoFi','GrFl','patternFill','OrGl','DrSh'];

function color_to_rgb ( color ) {
  return [color['Rd  '], color['Grn '], color['Bl  '] ]
            .map(function( color ) {
              return Math.floor(color);
            })
            .join(',');
}

module.exports = function( layer, objectEffects, layer_node ) {
  objectEffects.parse();
  //
  // @desc 此方法将图层混合模式转换成合适的css style
  // 
  // so class & enable will be the keywords
  //
  //
  // 混合选项 global( just out over then)
  // 斜面和浮雕 ebbl
  //    等高线
  //    纹理
  // 描边       FrFX
  // 内阴影     IrSh
  // 内发光     IrGl
  // 光泽       ChFX
  // 颜色叠加   SoFi
  // 渐变叠加   GrFl
  // 图案叠加   patternFill
  // 外发光     OrGl
  // 投影       DrSh
  // 
  var data = objectEffects.obj.data;


  if( !data.masterFXSwitch ){
    return;
  }

  layer_styles.forEach(function( key ) {

    if( !data[key]){
      return;
    }
    if( !data[key].enab ){
      return;
    }


    layer_styles_parser_map[key]( layer, data[key], layer_node.style, layer_node.effect );
  });


}


// 
// psd 的特效在css中实现的主要困难是
// 
// 1 ps 有丰富的图层的混合效果
// 2 ps 的图层边界是透明像素 而不是盒子模型
// 
// 所以正确的做法是写个脚本将图形栅格化然后再导出
// 然后需要保证输出的修改都是能够自动处理的
// 

var layer_styles_parser_map = {
  ebbl : function( layer, layer_style, css_style, effect) {
  },
  FrFX : function( layer, layer_style, css_style, effect) {
      // 
      // 当描边模式为色彩时使用
      // 
      var color = layer_style['Clr '];
      //
      // 描边有多宽
      //
      var size  = layer_style['Sz  '].value;
      //
      // 透明度
      //
      var opacity = layer_style['Opct'].value;
      //
      // 图层混合仍然是一个图层
      // 因此有独立的颜色混合方式
      //
      var blend_mod = layer_style['Md  '];

      //
      // 描边有三种位置
      // 不过我们只支持画在外面
      //
      var style = layer_style['Styl'];

      // 
      // 虽然有三种模式
      // 不过我们只用到颜色
      // 
      var pattern = layer_style['PntT'];

      if( layer.text ){
        var text_shadow_string = '0 0 ' + (size * 2) + 'px rgba(' + color_to_rgb(color) + ',' + (opacity/100) + ')'
        css_style['text-shadow'] = text_shadow_string + ',' + text_shadow_string + ',' + text_shadow_string;
      }
      
  },
  IrSh : function( layer, layer_style, css_style, effect) {
      // 
      // 实现不了
      // 
  },
  IrGl : function( layer, layer_style, css_style, effect) {
      // 
      // 渐变就好 但是不规则的仍然实现不了
      // 
  },
  ChFX : function( layer, layer_style, css_style, effect) {
    // 比较难...
    // canvas倒是有一点可能可以做
  },
  SoFi : function( layer, layer_style, css_style, effect) {
    // 这个可以实现
    var color = layer_style['Clr '];
    var opacity = layer_style['Opct'].value;
    var mode = layer_style['Md  '];

    if( mode.value == 'Ovrl'){
      opacity *= 0.6;
    }

    debug( layer_style );

    effect.color_overlay = {
      color : 'rgba(' + color_to_rgb(color) + ',' + (opacity/100) + ')'
    };
  },
  GrFl : function( layer, layer_style, css_style, effect) {
    // 这个可以实现
  },
  patternFill : function( layer, layer_style, css_style, effect) {
    // 这个可以实现
      
  },
  OrGl : function( layer, layer_style, css_style, effect) {
    // 由于css只有box shadow所以实际上这个仍然是做不到的... 
    // shit
    var graduate = layer_style['Grad'];
    // 这里写渐变色彩的生成代码
  
    // 
    // 这里需要写一个生成渐变的代码
    // 
    if( layer.text ){
      // var text_shadow_string = '0 0 ' + (size * 2) + 'px rgba(' + color_to_rgb(color) + ',' + (opacity/100) + ')'
      // css_style['text-shadow'] = text_shadow_string + ',' + text_shadow_string + ',' + text_shadow_string;
    }
  },
  DrSh : function( layer, layer_style, css_style, effect) {
      
  },
}
