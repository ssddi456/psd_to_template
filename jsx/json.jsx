
function obj2str (obj) {
  var str = [];
  switch (true) {
      case obj === null :
          str = 'null';
          break;
      case typeof obj === 'undefined':
          str = '';
          break;
      case typeof obj === 'string':
          str = '\"' + obj.replace(/([\"\\])/g, '\\$1').replace(/(\n)/g, '\\n').replace(/(\r)/g, '\\r').replace(/(\t)/g, '\\t') + '\"';
          break;
      case typeof obj === 'object':
          if (Object.prototype.toString.call(obj) !== '[object Array]') {
              for (var i in obj) {
                  if( obj.hasOwnProperty(i) ){
                      str.push('\"' + i + '\":' + obj2str(obj[i]));
                  }
              }
              str = '{' + str.join() + '}';
          } else {
              for (var j = 0; j < obj.length; j++) {
                  str.push(obj2str(obj[j]));
              }
              str = '[' + str.join() + ']';
          }
          break;
      default:
          str = obj.toString().replace(/\"\:/g, '":""');
          break;
  }
  return str;
}


function save_json( path, obj ) {
  var file = new File( path );
  file.encoding = 'UTF8';
  file.open('w');
  file.write( obj2str(obj) );
  file.close();
}