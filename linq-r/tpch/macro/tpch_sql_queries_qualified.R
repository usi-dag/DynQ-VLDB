
Q1 = "
select
	lineitem.l_returnflag,
	lineitem.l_linestatus,
	sum(lineitem.l_quantity) as sum_qty,
	sum(lineitem.l_extendedprice) as sum_base_price,
	sum(lineitem.l_extendedprice * (1 - lineitem.l_discount)) as sum_disc_price,
	sum(lineitem.l_extendedprice * (1 - lineitem.l_discount) * (1 + l_tax)) as sum_charge,
	avg(lineitem.l_quantity) as avg_qty,
	avg(lineitem.l_extendedprice) as avg_price,
	avg(lineitem.l_discount) as avg_disc,
	count(*) as count_order
from
	lineitem
where
	lineitem.l_shipdate <= date '1998-12-01' - interval '90' day
group by
	lineitem.l_returnflag,
	lineitem.l_linestatus
order by
	lineitem.l_returnflag,
	lineitem.l_linestatus
"




Q2 = "
select
	supplier.s_acctbal,
	supplier.s_name,
	nation.n_name,
	part.p_partkey,
	part.p_mfgr,
	supplier.s_address,
	supplier.s_phone,
	supplier.s_comment
from
	part,
	supplier,
	partsupp,
	nation,
	region
where
	part.p_partkey = partsupp.ps_partkey
	and supplier.s_suppkey = partsupp.ps_suppkey
	and part.p_size = 15
	and part.p_type like '%BRASS'
	and supplier.s_nationkey = nation.n_nationkey
	and nation.n_regionkey = region.r_regionkey
	and region.r_name = 'EUROPE'
	and partsupp.ps_supplycost = (
		select
			min(partsupp.ps_supplycost)
		from
			partsupp,
			supplier,
			nation,
			region
		where
			part.p_partkey = partsupp.ps_partkey
			and supplier.s_suppkey = partsupp.ps_suppkey
			and supplier.s_nationkey = nation.n_nationkey
			and nation.n_regionkey = region.r_regionkey
			and region.r_name = 'EUROPE'
	)
order by
	supplier.s_acctbal desc,
	nation.n_name,
	supplier.s_name,
	part.p_partkey
limit 100
"



Q3 = "
select
	lineitem.l_orderkey,
	sum(lineitem.l_extendedprice * (1 - lineitem.l_discount)) as revenue,
	orders.o_orderdate,
	orders.o_shippriority
from
	customer,
	orders,
	lineitem
where
	customer.c_mktsegment = 'BUILDING'
	and customer.c_custkey = orders.o_custkey
	and lineitem.l_orderkey = orders.o_orderkey
	and orders.o_orderdate < date '1995-03-15'
	and lineitem.l_shipdate > date '1995-03-15'
group by
	lineitem.l_orderkey,
	orders.o_orderdate,
	orders.o_shippriority
order by
	revenue desc,
	orders.o_orderdate
limit 10
"



Q4 = "
select
	orders.o_orderpriority,
	count(*) as order_count
from
	orders
where
	orders.o_orderdate >= date '1993-07-01'
	and orders.o_orderdate < date '1993-07-01' + interval '3' month
	and exists (
		select
			*
		from
			lineitem
		where
			lineitem.l_orderkey = orders.o_orderkey
			and lineitem.l_commitdate < lineitem.l_receiptdate
	)
group by
	orders.o_orderpriority
order by
	orders.o_orderpriority
"



Q5 = "
select
	nation.n_name,
	sum(lineitem.l_extendedprice * (1 - lineitem.l_discount)) as revenue
from
	customer,
	orders,
	lineitem,
	supplier,
	nation,
	region
where
	customer.c_custkey = orders.o_custkey
	and lineitem.l_orderkey = orders.o_orderkey
	and lineitem.l_suppkey = supplier.s_suppkey
	and customer.c_nationkey = supplier.s_nationkey
	and supplier.s_nationkey = nation.n_nationkey
	and nation.n_regionkey = region.r_regionkey
	and region.r_name = 'ASIA'
	and orders.o_orderdate >= date '1994-01-01'
	and orders.o_orderdate < date '1994-01-01' + interval '1' year
group by
	nation.n_name
order by
	revenue desc
"



Q6 = "
select
	sum(lineitem.l_extendedprice * lineitem.l_discount) as revenue
from
	lineitem
where
	lineitem.l_shipdate >= date '1994-01-01'
	and lineitem.l_shipdate < date '1994-01-01' + interval '1' year
	and lineitem.l_discount between .06 - 0.01 and .06 + 0.01
	and lineitem.l_quantity < 24
"



Q7 = "
select
	supp_nation,
	cust_nation,
	l_year,
	sum(volume) as revenue
from
	(
		select
			n1.n_name as supp_nation,
			n2.n_name as cust_nation,
			year(lineitem.l_shipdate) as l_year,
			lineitem.l_extendedprice * (1 - lineitem.l_discount) as volume
		from
			supplier,
			lineitem,
			orders,
			customer,
			nation n1,
			nation n2
		where
			supplier.s_suppkey = lineitem.l_suppkey
			and orders.o_orderkey = lineitem.l_orderkey
			and customer.c_custkey = orders.o_custkey
			and supplier.s_nationkey = n1.n_nationkey
			and customer.c_nationkey = n2.n_nationkey
			-- note: Calcite does not push n_name in (FRANCE, GERMANY), do it manually
			and n1.n_name in ('FRANCE', 'GERMANY')
			and n2.n_name in ('FRANCE', 'GERMANY')
			and (
				(n1.n_name = 'FRANCE' and n2.n_name = 'GERMANY')
				or (n1.n_name = 'GERMANY' and n2.n_name = 'FRANCE')
			)
			and lineitem.l_shipdate between date '1995-01-01' and date '1996-12-31'
	) as shipping
group by
	supp_nation,
	cust_nation,
	l_year
order by
	supp_nation,
	cust_nation,
	l_year
"



Q8 = "
select
	o_year,
	sum(case
		when nation = 'BRAZIL' then volume
		else 0
	end) / sum(volume) as mkt_share
from
	(
		select
			year(orders.o_orderdate) as o_year,
			lineitem.l_extendedprice * (1 - lineitem.l_discount) as volume,
			n2.n_name as nation
		from
			part,
			supplier,
			lineitem,
			orders,
			customer,
			nation n1,
			nation n2,
			region
		where
			part.p_partkey = lineitem.l_partkey
			and supplier.s_suppkey = lineitem.l_suppkey
			and lineitem.l_orderkey = orders.o_orderkey
			and orders.o_custkey = customer.c_custkey
			and customer.c_nationkey = n1.n_nationkey
			and n1.n_regionkey = region.r_regionkey
			and region.r_name = 'AMERICA'
			and supplier.s_nationkey = n2.n_nationkey
			and orders.o_orderdate between date '1995-01-01' and date '1996-12-31'
			and part.p_type = 'ECONOMY ANODIZED STEEL'
	) as all_nations
group by
	o_year
order by
	o_year
"



Q9 = "
select
	nation,
	o_year,
	sum(amount) as sum_profit
from
	(
		select
			nation.n_name as nation,
			year(orders.o_orderdate) as o_year,
			lineitem.l_extendedprice * (1 - lineitem.l_discount) - partsupp.ps_supplycost * lineitem.l_quantity as amount
		from
			part,
			supplier,
			lineitem,
			partsupp,
			orders,
			nation
		where
			supplier.s_suppkey = lineitem.l_suppkey
			and partsupp.ps_suppkey = lineitem.l_suppkey
			and partsupp.ps_partkey = lineitem.l_partkey
			and part.p_partkey = lineitem.l_partkey
			and orders.o_orderkey = lineitem.l_orderkey
			and supplier.s_nationkey = nation.n_nationkey
			and part.p_name like '%green%'
	) as profit
group by
	nation,
	o_year
order by
	nation,
	o_year desc
"



Q10 = "
select
	customer.c_custkey,
	customer.c_name,
	sum(lineitem.l_extendedprice * (1 - lineitem.l_discount)) as revenue,
	customer.c_acctbal,
	nation.n_name,
	customer.c_address,
	customer.c_phone,
	customer.c_comment
from
	customer,
	orders,
	lineitem,
	nation
where
	customer.c_custkey = orders.o_custkey
	and lineitem.l_orderkey = orders.o_orderkey
	and orders.o_orderdate >= date '1993-10-01'
	and orders.o_orderdate < date '1993-10-01' + interval '3' month
	and lineitem.l_returnflag = 'R'
	and customer.c_nationkey = nation.n_nationkey
group by
	customer.c_custkey,
	customer.c_name,
	customer.c_acctbal,
	customer.c_phone,
	nation.n_name,
	customer.c_address,
	customer.c_comment
order by
	revenue desc
limit 20
"



Q11 = "
select
	partsupp.ps_partkey,
	sum(partsupp.ps_supplycost * partsupp.ps_availqty) as value1
from
	partsupp,
	supplier,
	nation
where
	partsupp.ps_suppkey = supplier.s_suppkey
	and supplier.s_nationkey = nation.n_nationkey
	and nation.n_name = 'GERMANY'
group by
	partsupp.ps_partkey having
		sum(partsupp.ps_supplycost * partsupp.ps_availqty) > (
			select
				sum(partsupp.ps_supplycost * partsupp.ps_availqty) * 0.0001000000
			from
				partsupp,
				supplier,
				nation
			where
				partsupp.ps_suppkey = supplier.s_suppkey
				and supplier.s_nationkey = nation.n_nationkey
				and nation.n_name = 'GERMANY'
		)
order by
	value1 desc
"



Q12 = "
select
	lineitem.l_shipmode,
	sum(case
		when orders.o_orderpriority = '1-URGENT'
			or orders.o_orderpriority = '2-HIGH'
			then 1
		else 0
	end) as high_line_count,
	sum(case
		when orders.o_orderpriority <> '1-URGENT'
			and orders.o_orderpriority <> '2-HIGH'
			then 1
		else 0
	end) as low_line_count
from
	orders,
	lineitem
where
	orders.o_orderkey = lineitem.l_orderkey
	and lineitem.l_shipmode in ('MAIL', 'SHIP')
	and lineitem.l_commitdate < lineitem.l_receiptdate
	and lineitem.l_shipdate < lineitem.l_commitdate
	and lineitem.l_receiptdate >= date '1994-01-01'
	and lineitem.l_receiptdate < date '1994-01-01' + interval '1' year
group by
	lineitem.l_shipmode
order by
	lineitem.l_shipmode
"



Q13 = "
select
	c_count,
	count(*) as custdist
from
	(
		select
			customer.c_custkey,
			count(orders.o_orderkey) as c_count
		from
			customer left outer join orders on
				customer.c_custkey = orders.o_custkey
				and orders.o_comment not like '%special%requests%'
		group by
			customer.c_custkey
	) as c_orders
group by
	c_count
order by
	custdist desc,
	c_count desc
"



Q14 = "
select
	100.00 * sum(case
		when part.p_type like 'PROMO%'
			then lineitem.l_extendedprice * (1 - lineitem.l_discount)
		else 0
	end) / sum(lineitem.l_extendedprice * (1 - lineitem.l_discount)) as promo_revenue
from
	lineitem,
	part
where
	lineitem.l_partkey = part.p_partkey
	and lineitem.l_shipdate >= date '1995-09-01'
	and lineitem.l_shipdate < date '1995-09-01' + interval '1' month
"



Q15 = "
with revenue0 as
	(select
		lineitem.l_suppkey as supplier_no,
		sum(lineitem.l_extendedprice * (1 - lineitem.l_discount)) as total_revenue
	from
		lineitem
	where
		lineitem.l_shipdate >= date '1996-01-01'
		and lineitem.l_shipdate < date '1996-01-01' + interval '3' month
	group by
		lineitem.l_suppkey)


select
	supplier.s_suppkey,
	supplier.s_name,
	supplier.s_address,
	supplier.s_phone,
	revenue0.total_revenue
from
	supplier,
	revenue0
where
	supplier.s_suppkey = revenue0.supplier_no
	and revenue0.total_revenue = (
		select
			max(revenue0.total_revenue)
		from
			revenue0
	)
order by
	supplier.s_suppkey
"



Q16 = "
select
	part.p_brand,
	part.p_type,
	part.p_size,
	count(distinct partsupp.ps_suppkey) as supplier_cnt
from
	partsupp,
	part
where
	part.p_partkey = partsupp.ps_partkey
	and part.p_brand <> 'Brand#45'
	and part.p_type not like 'MEDIUM POLISHED%'
	and part.p_size in (49, 14, 23, 45, 19, 3, 36, 9)
	-- note: Calcite does not trigger AntiJoinRule for 'not in'
	and not exists (
		select
			supplier.s_suppkey
		from
			supplier
		where
			supplier.s_comment like '%Customer%Complaints%'
			and partsupp.ps_suppkey = supplier.s_suppkey
	)
group by
	part.p_brand,
	part.p_type,
	part.p_size
order by
	supplier_cnt desc,
	part.p_brand,
	part.p_type,
	part.p_size
"



Q17 = "
select
	sum(lineitem.l_extendedprice) / 7.0 as avg_yearly
from
	lineitem,
	part
where
	part.p_partkey = lineitem.l_partkey
	and part.p_brand = 'Brand#23'
	and part.p_container = 'MED BOX'
	and lineitem.l_quantity < (
		select
			0.2 * avg(lineitem.l_quantity)
		from
			lineitem
		where
			lineitem.l_partkey = part.p_partkey
	)
"



Q18 = "
select
	customer.c_name,
	customer.c_custkey,
	orders.o_orderkey,
	orders.o_orderdate,
	orders.o_totalprice,
	sum(lineitem.l_quantity) as sum_qty
from
	customer,
	orders,
	lineitem
where
	orders.o_orderkey in (
		select
			lineitem.l_orderkey
		from
			lineitem
		group by
			lineitem.l_orderkey having
				sum(lineitem.l_quantity) > 300
	)
	and customer.c_custkey = orders.o_custkey
	and orders.o_orderkey = lineitem.l_orderkey
group by
	customer.c_name,
	customer.c_custkey,
	orders.o_orderkey,
	orders.o_orderdate,
	orders.o_totalprice
order by
	orders.o_totalprice desc,
	orders.o_orderdate
limit 100
"



Q19 = "
select
	sum(lineitem.l_extendedprice* (1 - lineitem.l_discount)) as revenue
from
	lineitem,
	part
where
	part.p_partkey = lineitem.l_partkey
    -- note: Calcite currently does not split OR condition, do it manually
    and lineitem.l_shipmode in ('AIR', 'AIR REG')
	and lineitem.l_shipinstruct = 'DELIVER IN PERSON'
	and
	(
        (
            part.p_brand = 'Brand#12'
            and part.p_container in ('SM CASE', 'SM BOX', 'SM PACK', 'SM PKG')
            and lineitem.l_quantity >= 1 and lineitem.l_quantity <= 1 + 10
            and part.p_size between 1 and 5
        )
        or
        (
            part.p_brand = 'Brand#23'
            and part.p_container in ('MED BAG', 'MED BOX', 'MED PKG', 'MED PACK')
            and lineitem.l_quantity >= 10 and lineitem.l_quantity <= 10 + 10
            and part.p_size between 1 and 10
        )
        or
        (
            part.p_brand = 'Brand#34'
            and part.p_container in ('LG CASE', 'LG BOX', 'LG PACK', 'LG PKG')
            and lineitem.l_quantity >= 20 and lineitem.l_quantity <= 20 + 10
            and part.p_size between 1 and 15
        )
    )
"



Q20 = "
select
	supplier.s_name,
	supplier.s_address
from
	supplier,
	nation
where
	supplier.s_suppkey in (
		select
			partsupp.ps_suppkey
		from
			partsupp
		where
			partsupp.ps_partkey in (
				select
					part.p_partkey
				from
					part
				where
					part.p_name like 'forest%'
			)
			and partsupp.ps_availqty > (
				select
					0.5 * sum(lineitem.l_quantity)
				from
					lineitem
				where
					lineitem.l_partkey = partsupp.ps_partkey
					and lineitem.l_suppkey = partsupp.ps_suppkey
					and lineitem.l_shipdate >= date '1994-01-01'
					and lineitem.l_shipdate < date '1994-01-01' + interval '1' year
			)
	)
	and supplier.s_nationkey = nation.n_nationkey
	and nation.n_name = 'CANADA'
order by
	supplier.s_name
"

Q21 = "
select
	supplier.s_name,
	count(*) as numwait
from
	supplier,
	lineitem l1,
	orders,
	nation
where
	supplier.s_suppkey = l1.l_suppkey
	and orders.o_orderkey = l1.l_orderkey
	and orders.o_orderstatus = 'F'
	and l1.l_receiptdate > l1.l_commitdate
	and exists (
		select
			*
		from
			lineitem l2
		where
			l2.l_orderkey = l1.l_orderkey
			and l2.l_suppkey <> l1.l_suppkey
	)
	and not exists (
		select
			*
		from
			lineitem l3
		where
			l3.l_orderkey = l1.l_orderkey
			and l3.l_suppkey <> l1.l_suppkey
			and l3.l_receiptdate > l3.l_commitdate
	)
	and supplier.s_nationkey = nation.n_nationkey
	and nation.n_name = 'SAUDI ARABIA'
group by
	supplier.s_name
order by
	numwait desc,
	supplier.s_name
limit 100
"



Q22 = "
select
	cntrycode,
	count(*) as numcust,
	sum(custsale.c_acctbal) as totacctbal
from
	(
		select
			substring(customer.c_phone, 1, 2) as cntrycode,
			customer.c_acctbal as c_acctbal
		from
			customer
		where
			substring(customer.c_phone, 1, 2) in
				('13', '31', '23', '29', '30', '18', '17')
			and customer.c_acctbal > (
				select
					avg(customer.c_acctbal)
				from
					customer
				where
					customer.c_acctbal > 0.00
					and substring(customer.c_phone, 1, 2) in
						('13', '31', '23', '29', '30', '18', '17')
			)
			and not exists (
				select
					*
				from
					orders
				where
					orders.o_custkey = customer.c_custkey
			)
	) as custsale
group by
	cntrycode
order by
	cntrycode
"


sql_queries = c(
    NULL,
    Q1,
    Q2,
    Q3,
    Q4,
    Q5,
    Q6,
    Q7,
    Q8,
    Q9,
    Q10,
    Q11,
    Q12,
    Q13,
    Q14,
    Q15,
    Q16,
    Q17,
    Q18,
    Q19,
    Q20,
    Q21,
    Q22
)

