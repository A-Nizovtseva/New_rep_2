use vremenno;

select id, id1 from Table_1 union all
select id, id2 from Table_1 union all
select id, id3 from Table_1 union all
select id, id4 from Table_1 union all
select id, id5 from Table_1 union all
select id, id6 from Table_1
order by id;

