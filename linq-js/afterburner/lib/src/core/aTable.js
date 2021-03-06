///////////////////////////////////////////////////////////////////////////
var inNode=(typeof window == 'undefined' );
if(typeof module == 'undefined'){
  var module={};
} else { 
}
if (inNode){
}
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
function aTable(dSrc) {
    this.name = "";
    this.src=dSrc;
    this.numrows = -1;
    this.sparerows=100;
    this.numcols = 0;
    this.sparecols = 50;
    this.colnames = [];
    this.colptrs=0;
    this.cols = [];
    this.coltypes = [];
    this.loc = 'inmem';
    this.isMAV = false;
    this.MAVdef=null;
//CREATE
    this.parseTable = function (){
      if (inNode){
        require('./store.js');
        if (typeof daSchema== 'undefined')
          daSchema=require('myJS.js').daSchema
      }
        if(typeof malloc=='undefined'){
          malloc=require('./store.js').malloc;
          malloctmpstr=require('./store.js').malloctmpstr;
          tmpstrcpy=require('./store.js').tmpstrcpy;
          tmpstrlen=require('./store.js').tmpstrlen;
          tmptoStoreStrcpy=require('./store.js').tmptoStoreStrcpy;
//          mem32=require('./store.js').mem32;
//          memF32=require('./store.js').memF32;
        }
//
        var colptrs = malloc((this.numcols+this.sparecols)<<2);
        var coltypes=this.coltypes;
        this.colptrs=colptrs;
        var fp=this.src.parser;
        var nr=this.numrows;
        for (var i=0;i<this.numcols;i++){
          mem32[(this.colptrs+(i<<2))>>2]= malloc((nr+this.sparerows+1)<<2);
          this.cols[i]=mem32[(this.colptrs+(i<<2))>>2];
        } 
        var strbuff=malloctmpstr(100*1024);
        for (var ii=0;ii<nr;ii++)	{
          for (var i=0;i<this.numcols;i++){
            if(coltypes[i]==0){
              mem32 [(mem32[(colptrs+(i<<2))>>2]+(ii<<2))>>2]=fp.nextint();
            } else if(coltypes[i]==1){
              memF32[(mem32[(colptrs+(i<<2))>>2]+(ii<<2))>>2]=fp.nextfloat();
            } else if(coltypes[i]==2){
              len=fp.nextcstr(strbuff);
              newstrptr=malloctmpstr(len);
              tmpstrcpy(strbuff,newstrptr);
              mem32[(mem32[(colptrs+(i<<2))>>2]+(ii<<2))>>2]=newstrptr;
            } else if(coltypes[i]==3){
              tmps=fp.nextstr();
              tmp=strdate_to_int(tmps);
              mem32[(mem32[(colptrs+(i<<2))>>2]+(ii<<2))>>2]=tmp;
            } else if(coltypes[i]==4){
              tmps=fp.nextstr();
              tmp=strchar_to_int(tmps);
              mem32[(mem32[(colptrs+(i<<2))>>2]+(ii<<2))>>2]=tmp;
            } else{
              alert('cannot handle data type:' + coltypes[i])
            }
          }
	}
        for (var i=0;i<this.numcols;i++){
          if(coltypes[i]==2){
            for (var ii=0;ii<nr;ii++)	{
              var tmpP=mem32[(mem32[(colptrs+(i<<2))>>2]+(ii<<2))>>2];
              len=tmpstrlen(tmpP);
              newstrptr=malloc(len);
              tmptoStoreStrcpy(tmpP,newstrptr);
              mem32[(mem32[(colptrs+(i<<2))>>2]+(ii<<2))>>2]=newstrptr;
            }
          }
	}
        daSchema.addTable(this);
        deletetmpstr();
        fp.cleanUp();
        delete fp;
    };
    this.setsize = function(size){
      this.numrows=size;
    };
    this.setMAVdef = function(MAVdef){
      this.isMAV=true;
      this.MAVdef=MAVdef;
    }
//FUNC
  this.getColNames = function(){
    var ret=this.name+",";
    for (var i=0;i<this.numcols;i++)
      ret=ret+this.colnames[i] + ",";
    return ret.replace(/,$/, '');
  }
  this.getColNamesA = function(){
    return this.colnames.slice();
  }

  this.getColTypeByName = function(colname){
    if (typeof colname == 'string') colname=colname.toLowerCase();
    for (var i=0;i<this.numcols;i++)
      if (this.colnames[i].toLowerCase()==colname)
        return this.coltypes[i];
    return -1;
  }
  this.getColPByName = function(colname){
    if (typeof colname == 'string') colname=colname.toLowerCase();
    for (var i=0;i<this.numcols;i++)
      if (this.colnames[i].toLowerCase()==colname)
        return mem32[(this.colptrs+(i<<2))>>2];
    return -1;
  }
//ALTER
    this.addColIfNotExists= function(colname,coltype){
      var colptr=this.getColPByName(colname);
      if(colptr>-1) 
        return colptr;
      if(this.sparecols>0){
        this.sparecols--;
        this.numcols++;
        this.colnames.push(colname);
        this.coltypes.push(coltype);
        colptr=mem32[(this.colptrs+((this.numcols-1)<<2))>>2]= malloc((this.numrows+this.sparerows+1)<<2);
        this.cols.push(colptr);
        return colptr;
      }
      console.log('out of spare cols.. cant alter table');
      return -1;
    }
//INSERT
    this.insertValues=function(rowA){
      var coltypes=this.coltypes;
      if(this.sparerows>0){
        this.sparerows--;
        for (var i=0;i<this.numcols;i++){
          memF32[(mem32[(this.colptrs+(i<<2))>>2] + (this.numrows<<2) )>>2]=rowA[i] || _null();
          if(coltypes[i]==0){
            mem32 [(mem32[(this.colptrs+(i<<2))>>2] + (this.numrows<<2) )>>2]=rowA[i] || _null();
          } else if(coltypes[i]==1){
            memF32[(mem32[(this.colptrs+(i<<2))>>2] + (this.numrows<<2) )>>2]=rowA[i] || _null();
          } else if(coltypes[i]==2){
            mem32 [(mem32[(this.colptrs+(i<<2))>>2] + (this.numrows<<2) )>>2]=rowA[i] || _null();
          } else if(coltypes[i]==3){
            mem32 [(mem32[(this.colptrs+(i<<2))>>2] + (this.numrows<<2) )>>2]=rowA[i] || _null();
          } else if(coltypes[i]==4){
            mem32 [(mem32[(this.colptrs+(i<<2))>>2] + (this.numrows<<2) )>>2]=rowA[i] || _null();
          } else{
            alert('cannot handle data type:' + coltypes[i])
          }
        }
        return ++this.numrows;
      }
      console.log('out of spare cols.. cant alter table');
      return -1;
    }
//UTIL
    this.toHTMLTableN = function(num) {
      var table=document.createElement('table');
      table.setAttribute('class',"table table-bordered table-condensed table-nonfluid table-striped table-hover");

      var thead = table.createTHead();
      thead.setAttribute('class',"thead-default");
      var tr = thead.insertRow(0);

      for (var i=0;i<this.numcols;i++){
          var th = document.createElement('th');
          th.appendChild(document.createTextNode(this.colnames[i]));
          tr.appendChild(th);
      }
      thead.appendChild(tr);
      var tbody= table.createTBody();
      for (var i=0;(i<this.numrows && i<num);i++){
        tr = document.createElement('tr');
        for (var ii=0;ii<this.numcols;ii++){
          var td = document.createElement('td');
          if (this.coltypes[ii]==0){
            td.appendChild(document.createTextNode(""+mem32[(this.cols[ii] + (i<<2))>>2]));
            td.align="right";
          } else if (this.coltypes[ii]==1){
            td.appendChild(document.createTextNode(""+memF32[(this.cols[ii] + (i<<2))>>2].toFixed(2)));
            td.align="right";
          } else if (this.coltypes[ii]==2){
            td.appendChild(document.createTextNode(strToString(mem32[(this.cols[ii] + (i<<2))>>2])));
          } else if (this.coltypes[ii]==3){
            td.appendChild(document.createTextNode(""+int_to_strdate(mem32[(this.cols[ii] + (i<<2))>>2])));
          } else if (this.coltypes[ii]==4){
            td.appendChild(document.createTextNode(""+int_to_strchar(mem32[(this.cols[ii] + (i<<2))>>2])));
            td.align="right";
          } else{
            alert("unknown type");
          }
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      return table;
    };
    this.toHTMLTable = function() {
      return this.toHTMLTableN(1/0);
    };

    this.toStringN = function(num) {
      var ret="";
      for (var i=0;i<this.numcols;i++){
          ret=ret+this.colnames[i] + "\t|\t"
      }
      for (var i=0;(i<this.numrows && i<num);i++){
        ret=ret+"\n"
        for (var ii=0;ii<this.numcols;ii++){
          if (this.coltypes[ii]==0){
            ret=ret+mem32[(this.cols[ii]+(i<<2))>>2]+ "\t|\t";
          } else if (this.coltypes[ii]==1){
            ret=ret+memF32[(this.cols[ii] +(i<<2))>>2]+ "\t|\t";
          } else if (this.coltypes[ii]==2){
            ret=ret+strToString(mem32[this.cols[ii]+(i<<2)])+ "\t|\t";
          } else if (this.coltypes[ii]==3){
            ret=ret+int_to_strdate(mem32[(this.cols[ii] + (i<<2))>>2])+ "\t|\t";
          } else if (this.coltypes[ii]==4){
            ret=ret+int_to_strchar(mem32[(this.cols[ii] + (i<<2))>>2])+ "\t|\t";
          } else{
            alert("unknown type");
          }
        }
      }
      return ret;
    };

    this.toString= function() {
      return this.toStringN(1/0);
    };
   this.toArray= function() {
      if (inNode){
        require('common.js');
      }
      var ret=[];
      for (var i=0;(i<this.numrows);i++){
          if (this.coltypes[0]==0){
            ret.push(mem32[(this.cols[0]+(i<<2))>>2]);
          } else if (this.coltypes[0]==1){
            ret.push(memF32[(this.cols[0]+(i<<2))>>2]);
          } else if (this.coltypes[0]==2){
            ret.push(strToString(mem32[(this.cols[0]+(i<<2))>>2]));
          } else if (this.coltypes[0]==3){
            ret.push(int_to_strdate(mem32[(this.cols[0]+(i<<2))>>2]));
          } else if (this.coltypes[0]==4){
            ret.push(int_to_strchar(mem32[(this.cols[0]+(i<<2))>>2]));
          } else{
            alert("unkown type");
          }
      }
      return ret;
   };
   this.toArray2= function(){
      if (inNode){
        require('common.js');
      }
      var ret=[];
      for (var i=0;i<this.numrows;i++){
        for (var ii=0;ii<this.numcols;ii++){
          if (this.coltypes[ii]==0){
            ret.push(mem32[(this.cols[ii]+(i<<2))>>2]);
          } else if (this.coltypes[ii]==1){
            ret.push(memF32[(this.cols[ii] +(i<<2))>>2]);
          } else if (this.coltypes[ii]==2){
            ret.push(strToString(mem32[(this.cols[ii] +(i<<2))>>2]));
          } else if (this.coltypes[ii]==3){
            ret.push(int_to_strdate(mem32[(this.cols[ii] + (i<<2))>>2]));
          } else if (this.coltypes[ii]==4){
            ret.push(int_to_strchar(mem32[(this.cols[ii] + (i<<2))>>2]));
          } else{
            alert("unkown type");
          }
        }
      }
      return ret;
    };
//constructor
  if (dSrc!=null){
    
    this.name=dSrc.name;
    this.fname=dSrc.fname;
    this.numrows=dSrc.numrows;
    this.numcols=dSrc.numcols;
    this.colnames=dSrc.colnames;
    this.coltypes=dSrc.coltypes;

    if (this.src.type=='schema'){
      this.colptrs=malloc((this.numcols+this.sparecols)<<2);
      return;
    }

    if (this.src.parser !== null){
      DEBUG('new table from a parser')
      this.parseTable();
    } else if (this.src.type='query') {
      DEBUG('new table from query')
      this.colptrs=dSrc.colptrs;
      for (var i=0;i<this.numcols;i++){
        this.cols[i]=mem32[(this.colptrs+(i<<2))>>2];
      } 
    } else if (this.src.type='monetjsn') {
      DEBUG('new table from a monetjsn, **not implemented**')
    } else { 
      DEBUG("invalid data source type");
    }
  }else{
    this.loc='backend';
  }
}

function broswerFileParse(file) {
    this.file=file;
    this.fr = new FileReader();
    this.delim='|';
    this.eol='\n';
    this.delimCode=this.delim.charCodeAt(0);
    this.eolCode=this.eol.charCodeAt(0);
    this.CHUNK_SIZE = 1024*1024 *1024;
    this.actualcs=0;
    this.sought=0;
    this.readReady=false;
    this.buffer;
    this.bptr=0;
    this.noMoreChunks=false;
    _self=this;

    this.fr.onload = function() {
        _self.buffer = new Uint8Array(_self.fr.result);
        _self.bptr=0;
        _self.readReady=true;
        _self.actualcs=_self.fr.result.byteLength;
        _self.noMoreChunks=(_self.actualcs <_self.CHUNK_SIZE);
	}

    this.fr.onerror = function() {
        alert('file reading error');
    };

    this.nextChunk =function() {
        if (this.noMoreChunks) {
            return false;
        }
        this.readReady = false;
        this.sought+=this.bptr;
        this.fr.readAsArrayBuffer(this.file.slice(this.sought, this.sought + this.CHUNK_SIZE));
        this.waitForRead();
        return true;
    };
    this.waitForRead = function(){
      while(!this.readReady){
        alert("this.readReady"+this.readReady);
      }
    }

    this.nextcstr =function(resPtr){
      strSize=0;
      do{
         if(this.bptr+strSize >= this.actualcs){
           if (!this.noMoreChunks&& this.nextChunk()){
             this.waitForRead();
             return this.nexcstr(resPtr);
           }
           else {
             return -1;
           }
         }
         else if(this.buffer[this.bptr+strSize] == this.delimCode ){// || this.buffer[this.bptr+strSize] == this.eolCode ){
           tmpstrStore8[resPtr+strSize]=0;
           this.bptr=this.bptr+strSize+1;
           return strSize+1;
         }
         else{
           tmpstrStore8[resPtr+strSize]=this.buffer[this.bptr+strSize];
           strSize++;
         }
      }while(true);
    };

    this.nextstr =function(){
      str="";
      do{
         if(this.bptr+str.length >= this.actualcs){
           if (!this.noMoreChunks&& this.nextChunk()){
             this.waitForRead();
             return this.nexstr();
           }
           else {
             return "";
           }
         }
         else if(this.buffer[this.bptr+str.length] == this.delimCode ){// || this.buffer[this.bptr+str.length] == this.eolCode ){
           this.bptr+=str.length+1;
           return str;
         }
         else{
           str+=String.fromCharCode(this.buffer[this.bptr+str.length]);
         }
      }while(true);
    };

    this.nextint = function() {
      str = this.nextstr();
      return parseInt(str);
    };
    this.nextfloat =function() {
      str = this.nextstr();
      return parseFloat(str);
    };
    this.getFileName =function(){
      return file.name;
    }
    this.nextChunk();
}

//function nodeFileParse(fname) {
//  this.fname=fname; 
//  this.delim='|';
//  this.eol='\n';
//  this.delimCode=this.delim.charCodeAt(0);
//  this.eolCode=this.eol.charCodeAt(0);
//  this.actualcs=0;
//  this.buffer;
//  this.bptr=0;
//  this.noMoreChunks=false;
//
//  this.nextcstr =function(resPtr){
//    tmpstrStore8=require('./store.js').tmpstrStore8;
//    strSize=0;
//    do{
//      if(this.buffer[this.bptr+strSize] == this.delimCode ){// || this.buffer[this.bptr+strSize] == this.eolCode ){
//        tmpstrStore8[resPtr+strSize]=0;
//        this.bptr=this.bptr+strSize+1;
//        return strSize+1;
//      }else{
//        tmpstrStore8[resPtr+strSize]=this.buffer[this.bptr+strSize];
//        strSize++;
//      }
//    }while(true);
//  };
//
//  this.nextstr =function(){
//    str="";
//    do{
//      if(this.buffer[this.bptr+str.length] == this.delimCode ){// || this.buffer[this.bptr+str.length] == this.eolCode ){
//        this.bptr+=str.length+1;
//        return str;
//      }else{
//        str+=String.fromCharCode(this.buffer[this.bptr+str.length]);
//      }
//    }while(true);
//  };
//
//  this.nextint = function(){
//    str = this.nextstr();
//    return parseInt(str);
//  };
//  this.nextfloat =function(){
//    str = this.nextstr();
//    return parseFloat(str);
//  };
//  this.getFileName =function(){
//    return this.fname;
//  }
//  //Constructor:
//  fs=require('fs');
//  console.log('this.fname='+this.fname);
//  var stats = fs.statSync(this.fname);
//  this.actualcs= stats["size"];
//  console.log('this.actualcs='+this.actualcs);
//  this.buffer=fs.readFileSync(this.fname);
//}
//////////////////////Convenience:
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
if(inNode){
  module.exports=aTable;
}else delete module;
//////////////////////////////////////////////////////////////////////////////
