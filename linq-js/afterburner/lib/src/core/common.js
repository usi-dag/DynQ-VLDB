///////////////////////////////////////////////////////////////////////////////
var inNode=(typeof window == 'undefined' );
if(typeof module == 'undefined'){
  var module={};
} else { 
}
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
function mystrcmp(str1, str2){
  str1=str1|0;
  str2=str2|0;
  var i=i|0;
  while (
        ( (mem8[(str1+i)|0]==mem8[(str2+i)|0]) && mem8[(str1+i)|0 ] && mem8[(str2+i)|0])
        ) i=((i+1)|0);
  return (mem8[(str1+i)|0 ]-mem8[(str2+i)|0 ]);
}
function strdate_to_int(strdate){
  var dateA=strdate.split('-');
  return (new Date(Date.UTC(dateA[0],dateA[1]-1,dateA[2]))).getTime()/(1000*60*60*24)|0;
}
function int_to_strdate(days){
  var dte;
  (dte=new Date(0)).setUTCMilliseconds((days*24*60*60*1000))
  var strdate=dte.getUTCFullYear() +"-";
  var month=dte.getUTCMonth()+1;
  strdate= (month>9)? (strdate+month+"-"): (strdate+"0"+month+"-");
  var dayof=dte.getUTCDate();
  return (dayof>9)? (strdate+dayof): (strdate+"0"+dayof);
}
function strchar_to_int(strchar){
    return strchar.charCodeAt(0);
}
function int_to_strchar(charcode){
    return String.fromCharCode(charcode);
}
function printSchema(){
  if(inNode){
    console.log(daSchema.toString());
  } else {
    var scons=document.getElementById("sconsole");
    clearElement(scons);
    scons.appendChild(daSchema.toHTMLTable());
    $('.panel-collapse.in').collapse('hide');
  }
}
function get_time_ms(){
    if (inNode)
      return process.hrtime();
    else
      return window.performance.now();
}
function time_diff(t0,t1){
    if (inNode)
      return ((((t1[0]-t0[0])*(1000)) + ((t1[1]-t0[1])/(1000*1000))));
    else 
      return (t1-t0);
}

function strToString(str){
  str=str|0;
  ret="";
  var i = i|0;
  while (mem8[(str+i)|0]){
    ret+=String.fromCharCode(mem8[(str+i)|0]|0);
    i=(i+1)|0;
  }
  return ret;
}
function dateToYearLUTab(){
  var ptr=malloc(1000);
  for (var i=0;i<1000;i++){
    var year= (1970+i)+"";
    mem32[(ptr + (i<<2))>>2]= strdate_to_int(year+"-01-01");
  }
  return ptr;
}
function badFSQL (where,what){
//  console.log("Bad Fluent SQL at: "+where+ ": " + what);
}
function DEBUG (where,what){
//  console.log(where+ ": " + what);
}
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
if(inNode){
  module.exports.printSchema=printSchema;
  module.exports.mystrcmp=mystrcmp;
  global.strdate_to_int=strdate_to_int;
  global.int_to_strdate=int_to_strdate;
  global.strchar_to_int=strchar_to_int;
  global.int_to_strchar=int_to_strchar;
  global.strToString=strToString;
  global.DEBUG=DEBUG;
  global.badFSQL=badFSQL;
  global.dateToYearLUTab=dateToYearLUTab;
}else delete module;
///////////////////////////////////////////////////////////////////////////////
