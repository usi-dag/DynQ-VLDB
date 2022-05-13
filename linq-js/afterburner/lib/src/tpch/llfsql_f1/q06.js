//////////////////////////////////////////////////////////////////////////////
var inNode=(typeof window == 'undefined' );
if(typeof module == 'undefined'){
  module={};
} else { 
}
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function query6(){
  return  abdb.select()
    .from("lineitem")
    .field(_as(_sum(_mul("l_extendedprice","l_discount")),"revenue"))
    .where(_gte("l_shipdate",_date('1996-01-01')),
      _lt("l_shipdate",_date('1997-01-01')),
      _between("l_discount",0.08,0.1),
      _lt("l_quantity",24))
}
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
if(inNode){
  module.exports=query6;
} else delete module;
//////////////////////////////////////////////////////////////////////////////
