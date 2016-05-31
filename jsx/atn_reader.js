
var path    = require('path');
var debug_name = path.basename(__filename,'.js');
if( debug_name == 'index'){
  debug_name = path.basename(__dirname);
}
(require.main === module) && (function(){
    process.env.DEBUG = '*';
})()
var debug = require('debug')(debug_name);
var assert = require('assert');

var fs = require('fs');


function readUnicodeString( buffer, offset ) {
  var name_length = buffer.readInt32BE( offset );
  offset += 4;
  var name = '';
  for(var i =0; i< name_length;i ++){
    name += String.fromCharCode( buffer.readInt16BE(offset));
    offset+=2;
  }

  return {
    name : name,
    offset : offset
  }
}

function readString( buffer, offset) {
  var str = '';

  var name_length = buffer.readInt32BE( offset );
  offset += 4;

  str = buffer.slice(offset, offset+name_length).toString();
  offset += name_length;

  return {
    str : str,
    offset : offset
  }
}

function readId ( buffer, offset ) {
  var len = buffer.readInt32BE(offset);
  offset += 4;
  var id;
  if( len ){
    id = buffer.slice(offset, offset + len).toString();
    offset += len;
  } else {
    id = buffer.readInt32BE(offset);
    offset += 4;
  }

  return {
    id : id,
    offset : offset
  };
}

function readHead( buffer ) {
  var offset = 0;

  var version = buffer.readInt32BE( offset );

  offset += 4 ;

  var read_name = readUnicodeString( buffer, offset);
  var name = read_name.name;
  offset = read_name.offset;

  var if_expand = buffer.readInt8(offset);
  offset += 1;

  var actions_count = buffer.readInt32BE(offset);
  offset += 4;

  var actions = [];
  var action;

  var head = {
    version : version,
    action_set_name : name,
    if_expand : if_expand,
    actions_count : actions_count,
    actions : actions
  }
  debug('head meta', head);

  for(var i = 0; i < actions_count; i ++ ){

    var read_action = readAction( buffer, offset);
    actions.push(read_action.action);
    offset = read_action.offset;
  }

  return head;
}


function readAction(buffer, offset) {

  var action = {};

  action.index = buffer.readInt16BE(offset);
  offset += 2;

  action.if_shift_for_short_cut = buffer.readInt8(offset);
  offset += 1;

  action.if_ctrl_for_short_cur = buffer.readInt8(offset);
  offset += 1;

  action.color_index = buffer.readInt16BE(offset);
  offset += 2;

  var read_name = readUnicodeString(buffer, offset);
  action.name = read_name.name;
  offset = read_name.offset;

  action.if_expand = buffer.readInt8(offset);
  offset += 1;

  var items_count = action.items_count = buffer.readInt32BE(offset);
  offset += 4;

  debug('action meta', action);

  var items = [];
  var item;
  for(var i = 0; i < items_count; i ++ ){

    var read_item = readItem(buffer, offset);

    item = read_item.item;
    offset = read_item.offset;

    items.push( item );
  }

  action.items = items;

  return {
    action : action,
    offset : offset
  };
}

function readItem ( buffer, offset ) {
  assert( !isNaN(offset), 'offset must be a number');

  var item = {};
  item.if_expand = buffer.readInt8(offset);
  offset += 1;

  item.if_enable = buffer.readInt8(offset);
  offset += 1;

  item.if_dialog_display = buffer.readInt8(offset);
  offset += 1;

  item.dialog_option = buffer.readInt8(offset);
  offset += 1;

  var identifier = item.identifier = buffer.slice(offset, offset + 4).toString();
  offset += 4;

  if( identifier == 'TEXT' ){
    var read_str = readString(buffer, offset);
    item.event = read_str.str;
    offset = read_str.offset;

  } else if( identifier == 'long'){
    item.event = buffer.readInt32BE(offset);
    offset += 4;
  }

  var read_str = readString(buffer, offset);
  item.dictionary_name = read_str.str;
  offset = read_str.offset;
 
  var if_has_descripter = item.if_has_descripter = buffer.readInt32BE(offset);
  offset += 4;

  debug('item meta', item);
  if( if_has_descripter == -1 ){
    var read_descripter = readDescripter( buffer, offset);
    item.descripter = read_descripter.descripter;
    offset = read_descripter.offset;
    
    assert( offset, 'offset must be a number');
  }

  return {
    item : item,
    offset : offset
  }
}

function readDescripter ( buffer, offset ) {
  var descripter = {};
  var read_name = readUnicodeString(buffer, offset);
  descripter.name = read_name.name;
  offset = read_name.offset;

  var read_id = readId(buffer, offset);
  descripter.classId = read_id.id;
  offset =read_id.offset;

  var items_count = descripter.items_count = buffer.readInt32BE(offset);
  offset += 4;

  var items = [];
  var item;

  debug('descripter meta', descripter);

  for(var i = 0; i < items_count; i ++ ){
    debug('read descripter item', i, offset);
    var read_item = readDescripterItem(buffer, offset);

    item = read_item.item;
    offset = read_item.offset;

    assert( offset, 'offset must be a number');

    items.push( item );
  }

  descripter.items = items;

  return { 
    descripter : descripter,
    offset : offset
  };
}

function readDescripterItem ( buffer, offset) {
  assert( offset, 'offset must be a number');
  
  var item = {};

  var read_id = readId(buffer, offset);
  item.classId = read_id.id;
  offset =read_id.offset;

  var ostype = buffer.slice(offset, offset + 4).toString();
  item.ostype = ostype;
  offset += 4;

  debug('ostype', '\'' + ostype + '\'', ostype.length);

  var data = ostype_item_reader[ostype]( buffer, offset);
  item.data= data.data;
  offset = data.offset;

  return {
    item : item,
    offset : offset
  }
}

var ostype_item_reader = {
  'obj ' : function( buffer, offset ) {//  Reference

    var data = {};
    var len = data.items_count = buffer.readInt32BE(offset);
    offset += 4;

    var items = [];
    var item;
    var ostype;
    

    debug('obj . meta ', data);

    for(var i = 0; i< len; i++){
      item = {};
      ostype = item.ostype = buffer.slice(offset, offset + 4).toString();
      offset += 4;

      var ostype_item = ostype_item_reader[ostype](buffer, offset);
      item.data = ostype_item.data;
      offset = ostype_item.offset;

      items.push(item);
    }

    data.items =  items;

    return {
      data : data,
      offset : offset
    };
  },
  'Objc' : function( buffer, offset ) {//  Descriptor
    var data = {};

    var descripter = readDescripter(buffer, offset);
    data.descripter = descripter.descripter;
    offset = descripter.offset;

    return {
      data : data,
      offset : offset
    };
  },
  'VlLs' : function( buffer, offset ) {//  List
    var data = {};
    var len = data.items_count = buffer.readInt32BE(offset);
    offset += 4;

    var items = [];
    var item;
    var ostype;
    for(var i = 0; i< len; i++){
      item = {};
      ostype = item.ostype = buffer.slice(offset, offset + 4).toString();
      offset += 4;

      var ostype_item = ostype_item_reader[ostype](buffer, offset);
      item.data = ostype_item.data;
      offset = ostype_item.offset;

      items.push(item);
    }

    data.items =  items;

    return {
      data : data,
      offset : offset
    };
  },
  'doub' : function( buffer, offset ) {//  Double
    var data = {};

    data.value = buffer.readDoubleBE(offset);
    offset+=8;

    return {
      data : data,
      offset : offset
    };
  },
  'UntF' : function( buffer, offset ) {//  Unit float
    var data = {};

    data.format = buffer.slice(offset, offset + 4);
    offset += 4;

    data.vlaue = buffer.readDoubleBE(offset);
    offset += 8;

    return {
      data : data,
      offset : offset
    };
  },
  'TEXT' : function( buffer, offset ) {//  String
    var data = {};

    var read_name = readUnicodeString(buffer, offset);
    data.text =  read_name.name;
    offset = read_name.offset;

    return {
      data : data,
      offset : offset
    };
  },
  'enum' : function( buffer, offset ) {//  Enumerated
    var data = {};

    var read_id = readId( buffer, offset);
    data.type = read_id.id;
    offset = read_id.offset;

    var read_id = readId( buffer, offset);
    data.enum = read_id.id;
    offset = read_id.offset;

    return {
      data : data,
      offset : offset
    };
  },
  'long' : function( buffer, offset ) {//  Integer
    var data = {};

    data.value = buffer.readInt32BE(offset);
    offset += 4;

    return {
      data : data,
      offset : offset
    };
  },
  'bool' : function( buffer, offset ) {//  Boolean
    var data = {};

    data.value = buffer.readInt8(offset);
    offset += 1;

    return {
      data : data,
      offset : offset
    };
  },
  'type' : function( buffer, offset ) {//  Class
    var data = {};

    var read_name = readUnicodeString(buffer,  offset);
    data.name = read_name.name;
    offset = read_name.offset;

    var read_id = readId(buffer, offset);
    data.classId = read_id.id;
    offset = read_id.offset;

    return {
      data : data,
      offset : offset
    };
  },
  'alis' : function( buffer, offset ) {//  Alias
    var data = {};

    data.length = buffer.readInt32BE(offset);
    offset += 4;

    data.value = buffer.slice(offset, offset+ data.length).toString();
    offset += data.length;

    return {
      data : data,
      offset : offset
    };
  },
  'tdta' : function( buffer, offset ) {//  Raw Data
    var data = {};

    throw new Error('identifier not found');

    return {
      data : data,
      offset : offset
    };
  },
  'prop' : function( buffer, offset ) {// Property
    var data = {};

    var read_name = readUnicodeString(buffer, offset);
    data.name = read_name.name;
    offset = offset;

    var read_id = readId(buffer,offset);
    data.classId = read_id.id;
    offset = read_id.of;

    read_id = readId(buffer, offset);
    data.KeyID = read_id.id;
    offset = read_id.offset;

    return {
      data : data,
      offset : offset
    };
  },
  
  'Enmr' : function( buffer, offset ) {// Enumerated Reference
    var data = {};

    var read_name = readUnicodeString(buffer, offset);
    data.name = read_name.name;
    offset = read_name.offset;


    var read_id = readId( buffer, offset);
    data.classId = read_id.id;
    offset = read_id.offset;

    var read_id = readId( buffer, offset);
    data.typeId = read_id.id;
    offset = read_id.offset;

    var read_id = readId( buffer, offset);
    data.enum = read_id.id;
    offset = read_id.offset;


    return {
      data : data,
      offset : offset
    };
  },
  'rele' : function( buffer, offset ) {// Offset
    var data = {};

    var read_name = readUnicodeString(buffer, offset);
    data.name = read_name.name;
    offset = read_name.offset;

    var read_id = readId( buffer, offset);
    data.classId = read_id.id;
    offset = read_id.offset;

    data.value = buffer.readInt32BE(offset);
    offset += 4;

    return {
      data : data,
      offset : offset
    };
  },
  'Idnt' : function( buffer, offset ) {// Identifier
    var data = {};

    throw new Error('identifier not found');

    return {
      data : data,
      offset : offset
    };
  },
  'indx' : function( buffer, offset ) {// Index
    var data = {};

    throw new Error('identifier not found');

    return {
      data : data,
      offset : offset
    };
  },
  'name' : function( buffer, offset ) {// Name
    var data = {};
    // 没有文档 没写完
    debug( offset, offset.toString(16) );
    debug( buffer.slice(offset, offset + 20 ).toString());

    var read_name = readUnicodeString(buffer, offset);
    data.misc = read_name.name;
    offset = read_name.offset

    var read_id = readId(buffer, offset);
    data.type = read_name.id;
    offset = read_id.offset

    var read_name = readUnicodeString(buffer, offset);
    data.name = read_name.name;
    offset = read_name.offset

    throw new Error('identifier not found');

    return {
      data : data,
      offset : offset
    };
  },
  'Pth ' : function( buffer, offset ) { // path
    var data = {};

    var read_str = readString(buffer, offset);
    var value = read_str.str;
    offset = read_str.offset;

    value = Buffer(value);

    var identifier = value.slice(0, 4).toString();
    data.identifier = identifier;

    if( identifier == 'txtu' ){
      var len = value.slice(4).length;
      var ret = '';
      for(var i = 5; i < len; i += 2 ){
        ret += String.fromCharCode(value.readInt16BE(i));
      }

      data.value = ret
    }
    // throw new Error('identifier not found');

    return {
      data : data,
      offset : offset
    };  
  }
};

ostype_item_reader['GlbC'] = ostype_item_reader['Clss'] = ostype_item_reader['type'];
ostype_item_reader['GlbO'] = ostype_item_reader['Objc'];


var read_atn = module.exports = function( file) {
  var buffer = fs.readFileSync(file);
  return readHead( buffer );
}

read_atn.readUnicodeString = readUnicodeString;
read_atn.readString = readString;
read_atn.readId = readId;
read_atn.readDescripter = readDescripter;

