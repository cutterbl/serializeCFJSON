/**
 * TEMPLATE
 * serializeCFJSON.js
 * 
 * PURPOSE
 * A jQuery function that will parse the JSON returned from an ajax call to a remote
 * ColdFusion method and recursively convert any ColdFusion query object into a 
 * standard JSON recordset, as recognized by a great number of plugins and libraries.
 * 
 * Standard native ColdFusion query object, as rendered by it's 'json' returnFormat:
<pre><code>
{
	"COLUMNS":["ID","NAME","EMAIL"],
	"DATA":[
		[1,"Ed Spencer","ed@sencha.com"],
		[2,"Abe Elias","abe@sencha.com"],
		[3,"Cutter","no@address.giv"]
	]
}
</code></pre>
 * 
 * converted by the method
<pre><code>
{
	"COLUMNS":["ID","NAME","EMAIL"],
	"DATA":[
		[1,"Ed Spencer","ed@sencha.com"],
		[2,"Abe Elias","abe@sencha.com"],
		[3,"Cutter","no@address.giv"]
	]
}
[
	{"id":1,"name":"Ed Spencer","email":"ed@sencha.com"},
	{"id":2,"name":"Abe Elias","email":"abe@sencha.com"},
	{"id":3,"name":"Cutter","email":"no@address.giv"}
]
</code></pre>
 * USAGE
 * var populateGrid = function (postdata) {
 *		$.ajax({
 *			url: '/com/cc/Blog/Entries.cfc',
 *			data: {
 *				method: 'GetEntries',
 *				returnFormat: 'json'
 *			},
 *			method:'POST',
 *			dataType:"json",
 *			success: function(d,r,o){
 *				d = $.serializeCFJSON(d);
 *				if(d.success){
 *					// do something with the data
 *				} else {
 *					console.log(d.message);
 *				}
 *			}
 *		});
 *	};
 */
(function( $ ){
	$.serializeCFJSON=function(obj) {
		var json = {};
		$.each(obj,function(ind, el){
			switch(typeof el){
				case 'object':
					if(el.DATA !== undefined && el.COLUMNS !== undefined){
						var recArr = [];
						$.each(el.DATA,function(ind,ele){
							var rec = new Object();
							$.each(el.COLUMNS,function(pos,nm){
								rec[nm.toLowerCase()] = ele[pos];
							});
							recArr.push(rec);
						});
						json[ind] = recArr;
					} else {
						json[ind] = $.serializeCFJSON(el);
					}
					break;
				default:
					json[ind] = el;
					break;
			}
		});
		return json;
	};
})( jQuery );