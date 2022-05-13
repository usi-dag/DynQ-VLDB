//////////////////////////////////////////////////////////////////////////////
var inNode=(typeof window == 'undefined' );
if(typeof module == 'undefined'){
  module={};
} else { 
}
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function query13(noasm){
  c_orders=abdb.select()
    .from("customer").ljoin("orders").on("c_custkey","o_custkey")
    .field("c_custkey",_as(_count("o_orderkey"),"c_count"))
    .where(_not(_like("o_comment",'%unusual%packages%')))
    .group("c_custkey")
    .materialize(noasm);

  return abdb.select()
   .from(c_orders)
   .field("c_count",_as(_count("*"),"custdist"))
   .group("c_count")
   .order("-custdist","-c_count")
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
if(inNode){
  module.exports=query13;
} else delete module;
//////////////////////////////////////////////////////////////////////////////