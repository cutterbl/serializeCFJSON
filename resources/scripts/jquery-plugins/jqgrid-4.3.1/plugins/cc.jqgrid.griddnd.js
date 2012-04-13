;(function($){
	$.jgrid.extend({
		gridDnD : function(opts) {
			return this.each(function(){
			var $t = this;
			if(!$t.grid) { return; }
			// Currently we disable a treeGrid drag and drop
			if($t.p.treeGrid) { return; }
			if(!$.fn.draggable || !$.fn.droppable) { return; }
			function updateDnD ()
			{
				var datadnd = $.data($t,"dnd");
			    $("tr.jqgrow:not(.ui-draggable)",$t).draggable($.isFunction(datadnd.drag) ? datadnd.drag.call($($t),datadnd) : datadnd.drag);
			}
			var appender = "<table id='jqgrid_dnd' class='ui-jqgrid-dnd'></table>";
			if($("#jqgrid_dnd").html() === null) {
				$('body').append(appender);
			}
			
			if(typeof opts == 'string' && opts == 'updateDnD' && $t.p.jqgdnd===true) {
				updateDnD();
				return;
			}
			opts = $.extend({
				"drag" : function (opts) {
					return $.extend({
						start : function (ev, ui) {
							// if we are in subgrid mode try to collapse the node
							if($t.p.subGrid) {
								var subgid = $(ui.helper).attr("id");
								try {
									$($t).jqGrid('collapseSubGridRow',subgid);
								} catch (e) {}
							}
							// hack
							// drag and drop does not insert tr in table, when the table has no rows
							// we try to insert new empty row on the target(s)
							for (var i=0;i<$.data($t,"dnd").connectWith.length;i++){
								if($($.data($t,"dnd").connectWith[i]).jqGrid('getGridParam','reccount') == "0" ){
									$($.data($t,"dnd").connectWith[i]).jqGrid('addRowData','jqg_empty_row',{});
								}
							}
							ui.helper.addClass("ui-state-highlight");
							$("td",ui.helper).each(function(i) {
								this.style.width = $t.grid.headers[i].width+"px";
							});
							if(opts.onstart && $.isFunction(opts.onstart) ) { opts.onstart.call($($t),ev,ui); }
						},
						stop :function(ev,ui) {
							if(ui.helper.dropped) {
								var ids = $(ui.helper).attr("id");
								/* Cutter edits */
								// In the event of a custom 'helper', the developer must attach data (JQ: see .data())
								// to the helper object, and include and 'origRowId' key, containing the original
								// row id, so that the row can be removed when it is time.
								if(!ids.length){
									ids =$(ui.helper).data("origRowId");
								}
								/* End Cutter Edits */
								$($t).jqGrid('delRowData',ids );
							}
							// if we have a empty row inserted from start event try to delete it
							for (var i=0;i<$.data($t,"dnd").connectWith.length;i++){
								$($.data($t,"dnd").connectWith[i]).jqGrid('delRowData','jqg_empty_row');
							}
							if(opts.onstop && $.isFunction(opts.onstop) ) { opts.onstop.call($($t),ev,ui); }
						}
					},opts.drag_opts || {});
				},
				"drop" : function (opts) {
					return $.extend({
						accept: function(d) {
							if (!$(d).hasClass('jqgrow')) { return d;}
							var tid = $(d).closest("table.ui-jqgrid-btable");
							if(tid.length > 0 && $.data(tid[0],"dnd") !== undefined) {
							    var cn = $.data(tid[0],"dnd").connectWith;
								/* Cutter Edits */
								if($.inArray('#'+this.id,cn) === -1){return false;}
							}
							if(d && (opts.onaccept && $.isFunction(opts.onaccept))){
								if(!opts.onaccept.call(this,d)){return false};
								/* End Cutter Edits */
							}
							return d;
						},
						drop: function(ev, ui) {
							/* Cutter Edits */
							/** Get the position of an element by going up the DOM tree and adding up all the offsets */
						    var getPosition = function(e){
						        var left = 0;
						        var top  = 0;
								
						        /** Safari fix -- thanks to Luis Chato for this! */
						        if (e.offsetHeight == 0) {
						            /** Safari 2 doesn't correctly grab the offsetTop of a table row
						            this is detailed here:
						            http://jacob.peargrove.com/blog/2006/technical/table-row-offsettop-bug-in-safari/
						            the solution is likewise noted there, grab the offset of a table cell in the row - the firstChild.
						            note that firefox will return a text node as a first child, so designing a more thorough
						            solution may need to take that into account, for now this seems to work in firefox, safari, ie */
						            e = e.firstChild; // a table cell
						        }
								if (e) {
									while (e.offsetParent) {
										left += e.offsetLeft;
										top += e.offsetTop;
										e = e.offsetParent;
									}
									
									left += e.offsetLeft;
									top += e.offsetTop;
								}
						        return {x:left, y:top};
						    };
							/** We're only worried about the y position really, because we can only move rows up and down */
						    var findDropTargetRow = function(srcTbl,tgtTbl,draggedRow, y) {
						        var rows = $(tgtTbl).children().children();
						        for (var i=0; i<rows.length; i++) {
						            var row = rows[i];
						            var rowY    = getPosition(row).y;
						            var rowHeight = parseInt(row.offsetHeight)/2;
						            if (row.offsetHeight == 0) {
						                rowY = getPosition(row.firstChild).y;
						                rowHeight = parseInt(row.firstChild.offsetHeight)/2;
						            }
									// Because we always have to insert before, we need to offset the height a bit
						            if ((y > rowY - rowHeight) && (y < (rowY + rowHeight))) {
						                // that's the row we're over
										// If it's the same as the current row, ignore it
										if (srcTbl === tgtTbl && row === draggedRow) {return null;}
						                return row;
						            }
						        }
						        return null;
						    };
							/* End Cutter Edits */
							if (!$(ui.draggable).hasClass('jqgrow')) { return; }
							/* Cutter Edits */
							var srcRow = $(ui.draggable);
							var accept = srcRow.attr("id");
							var srcTbl = srcRow.parent().parent();
							// This is the previous row index, from the table the row was pulled from
							var oldRowIndex = $.inArray(accept,srcTbl.jqGrid('getDataIDs'));
							var getdata = srcTbl.jqGrid('getRowData',accept);
							var targetRow = findDropTargetRow(srcTbl,this,srcRow,parseInt(ui.position.top));
							var targetIndex = $(targetRow).attr("id");
							var newRowIndex = (targetIndex === 'jqg_empty_row')?0:$(this).jqGrid("getInd",targetIndex);
							/* End Cutter Edits */
							if(!opts.dropbyname) {
								var j =0, tmpdata = {}, dropname;
								var dropmodel = $("#"+this.id).jqGrid('getGridParam','colModel');
								try {
									for (var key in getdata) {
										if(getdata.hasOwnProperty(key) && dropmodel[j]) {
											dropname = dropmodel[j].name;
											tmpdata[dropname] = getdata[key];
										}
										j++;
									}
									getdata = tmpdata;
								} catch (e) {}
							}
							//ui.helper.dropped = true; /* Intentionally Removed */
							if(opts.beforedrop && $.isFunction(opts.beforedrop) ) {
								//parameters to this callback - event, element, data to be inserted, sender, reciever
								// should return object which will be inserted into the reciever
								var datatoinsert = opts.beforedrop.call(this,ev,ui,getdata,$('#'+$t.id),$(this));
								if (typeof datatoinsert != "undefined" && datatoinsert !== null && typeof datatoinsert == "object") { getdata = datatoinsert; }
							}
							/* Cutter Edits */
							var grid;
							if(opts.autoid) {
								if($.isFunction(opts.autoid)) {
									grid = opts.autoid.call(this,getdata);
								} else {
									grid = Math.ceil(Math.random()*1000);
									grid = opts.autoidprefix+grid;
								}
							}
							// NULL is interpreted as undefined while null as object
							
							switch(opts.droppos){
								case "before":
									newRowIndex = newRowIndex-1;
									ui.helper.dropped = $("#"+this.id).jqGrid('addRowData',grid,getdata,opts.droppos,targetIndex);
									break;
								case "after":
									ui.helper.dropped = $("#"+this.id).jqGrid('addRowData',grid,getdata,opts.droppos,targetIndex);
									break;
								default:
									ui.helper.dropped = $("#"+this.id).jqGrid('addRowData',grid,getdata,opts.droppos);
									break;
							}
							if(opts.ondrop && $.isFunction(opts.ondrop) ) { opts.ondrop.call(this,ev,ui,$.extend({},getdata,{oldRowIndex:oldRowIndex,newRowIndex:newRowIndex})); }
							/* End Cutter Edits */
						}}, opts.drop_opts || {});
				},
				"onaccept" : null, // Add support for other DnD method override ** Cutter Edit
				"onstart" : null,
				"onstop" : null,
				"beforedrop": null,
				"ondrop" : null,
				"drop_opts" : {
					"activeClass": "ui-state-active",
					"hoverClass": "ui-state-hover"
				},
				"drag_opts" : {
					"revert": "invalid",
					"helper": "clone",
					"cursor": "move",
					"appendTo" : "#jqgrid_dnd",
					"zIndex": 5000
				},
				"dropbyname" : false,
				"droppos" : "first",
				"autoid" : true,
				"autoidprefix" : "dnd_"
			}, opts || {});
			
			if(!opts.connectWith) { return; }
			opts.connectWith = opts.connectWith.split(",");
			opts.connectWith = $.map(opts.connectWith,function(n){return $.trim(n);});
			$.data($t,"dnd",opts);
			
			if($t.p.reccount != "0" && !$t.p.jqgdnd) {
				updateDnD();
			}
			$t.p.jqgdnd = true;
			for (var i=0;i<opts.connectWith.length;i++){
				var cn =opts.connectWith[i];
				$(cn).droppable($.isFunction(opts.drop) ? opts.drop.call($($t),opts) : opts.drop);
			}
			});
		}
	});
})(jQuery);