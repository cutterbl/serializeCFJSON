/**
 * TEMPLATE
 * jqGridDemo.js
 * 
 * VERSION
 * 0.1 (12.19.2011)
 * 0.2 (12.20.2011) - Fill in the populateGrid method
 * 0.3 (12.27.2011) - Add in changes to the Column Model, and cell formatter
 * 0.4 (01.04.2012) - Add event handlers for selection model, multiselect controls
 * 
 * AUTHOR
 * Steve 'Cutter' Blades, webDOTadminATcutterscrossing.com
 * 
 * LICENSE
 * This document is licensed as free software under the terms of the
 * MIT License: http://www.opensource.org/licenses/mit-license.php
 * 
 * PURPOSE
 * This is the sample script for the first entry in the Cutter's Crossing
 * "Intro to jqGrid" posts, creating a small demo of using jqGrid
 */

var gridMultiSelect = 1,
	selArr = [];

//JQuery Plugin that will take a form, serialize it's field values, then create a JSON object of the array
(function( $ ){
	$.fn.serializeJSON=function() {
		var json = {};
		jQuery.map($(this).serializeArray(), function(n, i){
			(json[n['name']] === undefined) ? json[n['name']] = n['value'] : json[n['name']] += ',' + n['value'];
		});
		return json;
	};
})( jQuery );

/**
 * Action Column Formatter
 */
$.extend($.fn.fmatter, {
	actionFormatter: function(cellvalue, options, rowObject) {
		var retVal = "<a href=\'javascript:void(0)\' onclick=\'editEntry(\"" + cellvalue + "\")\'><span class=\'icon-trigger action-trigger pencil\' rel=\'" + cellvalue + "\' \/></a>";
		retVal += "<span class=\'icon-trigger action-trigger delete\' rel=\'" + cellvalue + "\' \/>";
		console.log(rowObject);
		return retVal;
	}
});

/**
 * FUNCTION editEntry
 * This method will open an editor dialog box, which normally
 * would contain a form to edit the entry of the ID passed in.
 * We define this outside of $(document).ready(), so the method
 * is available from the JS global scope
 */
var editEntry = function (recId) {
	$('<div id="recordEdit">').dialog({
		title: 'Entry Editor',
		modal:true,
		width: $(window).width()*.6,
		height: $(window).height()*.6,
		create: function(){
			$('span.ui-icon-closethick').html("");
		},
		open: function(){
			var dlg = $(this);
			// Get the summary for the selected lesson
			$.ajax({
				url: '/edit.cfm',
				type: 'POST',
				data:{
					recId: recId
				},
				dataType:'script',
				success: function(d, r, o){
					dlg.html(d);
				}
			});
		},
		close:function(){
			$(this).html('').dialog('destroy');
			setTimeout('$("#recordEdit").remove();',100);
		},
		buttons:[{
			text:'Close',
			click:function(){
				$(this).dialog('close');
			}
		}]
	});
};

$(document).ready(function(){
	var grid = $('#gridTest'); // JQuery object reference of table used for our grid display
	
	// Error dialog box config
	$('div#grid-dialog-error').dialog({
		width:400,
		autoOpen: false,
		modal: true,
		create: function(){
			$('span.ui-icon-closethick').html("");
		},
		buttons:{
			"OK": function(){
				$(this).dialog("close");
			}
		}
	});
	
	/*
	 * Initialize the datepickers
	 */
	$('input.addDatePicker').datepicker({
		showOn: 'button',
		//buttonImage: '/resources/images/icons/calendar.png',
		//buttonImageOnly: true,
		dateFormat: 'mm/dd/yy'
	});
	
	/*
	 * Search Form Submit Handler
	 */
	$('form#searchForm').submit(function(ev){
		ev.preventDefault();
		grid.trigger('reloadGrid');
		return false;
	});
	
	/*
	 * Search Form 'Reset' Handler
	 */
	$('form#searchForm').bind('reset',function(ev){
		setTimeout("$('#gridTest').trigger('reloadGrid');",1);
	});
	
	/*
	 * FUNCTION scrubSearch
	 * Used to serialize the form inputs, then pull out any items
	 * that are empty or 0 (remember to param form fields in your processor)
	 */
	var scrubSearch = function(){
		var frm = $('form#searchForm').serializeJSON();
		for(var i in frm){
			var val = frm[i];
			// if value has no length, remove the key
			if(val.length === 0){
				delete frm[i];
			}
			if(!isNaN(val-0) && parseInt(val) === 0){
				delete frm[i];
			}
		}
		return frm;
	};
	
	/*
	 * FUNCTION populateGrid
	 * Used as the 'datatype' attribute of the jqGrid config object, this method
	 * is used to handle the ajax calls and data manipulation needed to populate
	 * data within our jqGrid instance.
	 * @postdata (object) - this is the object passed as the 'postData' attribute
	 * 						of our jqGrid instance. 
	 */
	var populateGrid = function (postdata) {
		$.ajax({
			url: 'com/cc/Blog/Entries.cfc',
			data: $.extend(true, {}, postdata, {search: $.toJSON(scrubSearch())}),
			method:'POST',
			dataType:"json",
			success: function(d,r,o){
				if(d.success){
					gridUnloader();
					grid[0].addJSONData($.serializeCFJSON(d));
				} else {
					console.log(d.message);
				}
			}
		});
	};
	
	/*
	 * FUNCTION deleteItem
	 * This method is for deleting records and removing the
	 * corresponding grid entry. We can define this in the
	 * $(document).ready(), because we 'bind' the handler
	 * from within.
	 * @rowId (int) - ID of the row to be removed from the grid
	 * @recId (string) - The UUID of the blog entry to be removed
	 * @dlg (object) - JQuery element of the JQUI dialog
	 */
	var deleteItem = function (rowId, recId, dlg) {
		$.ajax({
			url: '/com/cc/Blog/Entries.cfc',
			data: {
				method: 'deleteEntry',
				recId:recId,
				returnFormat: 'json'
			},
			dataType: 'json',
			success: function(d, r, o){
				if (d.success) {
					grid.jqGrid('delRowData',rowId);
					dlg.dialog('close');
				}
				else {
					console.log(d.message);
					$('span#grid-dialog-error-message').html(d.message);
					$('div#grid-dialog-error').dialog('open');
				}
			}
		});
	};
	
	/*
	 * FUNCTION bindActionHandlers
	 * This methed is called within the gridLoadInit() method, and is used to
	 * bind event handlers to the action icons of new records
	 */
	var bindActionHandlers = function () {
		// Delete icon binding
		$('span.delete[class*="action-trigger"]', grid).bind("click", function(e){
			e.preventDefault();
			var row = $(this).parent().parent(),
				rowId = row.attr("id"), 
				recId = $(this).attr('rel'),
				title =	grid.jqGrid('getCell',rowId,'Title');
			// Create a dynamic dialog, that is destroyed when closed
			$('<div>').dialog({
				title:'Delete Confirmation',
				width:425,
				height:200,
				modal:true,
				create: function(){
					$('span.ui-icon-closethick').html("");
				},
				close:function(){
					$(this).dialog('destroy');
				},
				buttons:[
				    {text:'OK',
				    click:function(){
				    	deleteItem(rowId,recId,$(this));
				    }},
				    {text:'Cancel',
				    click:function(){
				    	$(this).dialog('close');
				    }}
				]
			}).html("Are you sure you want to delete the following?:<br />"+title);
			return false;
		});
	};
	
	/*
	 * FUNCTION gridLoadInit
	 * This method is tied to grid loads, through the gridComplete attribute
	 * Any time the data is refreshed in the grid (page load, paging, manual reset, etc)
	 * then this method is run to set event bindings on any created DOM. We also
	 * use this method to re-'check' any records previously selected.
	 */
	var gridLoadInit = function () {
		// if the 'selected' array has length
		// then loop current records, and 'check'
		// those that should be selected
		if(selArr.length > 0){
			var tmp = grid.jqGrid('getDataIDs');
			$.each(selArr, function(ind, val){
				var pos = $.inArray(val, tmp);
				if(pos > -1){
					grid.jqGrid('setSelection',val);
				}
			});
		}
		
		$('table#gridTest tr:even td').addClass('evenRow');
		bindActionHandlers();
		grid.jqGrid('groupingToggle','gridTestghead_0');
		grid.jqGrid('setGridWidth',810);
	};
	
	/*
	 * FUNCTION gridUnloader
	 * Called from within the populateGrid method, this method is to unbind
	 * any event handlers created during grid load, by the gridLoadInit method.
	 */
	var gridUnloader = function () {
		$('span.delete:not("disabled-trigger")', grid).unbind('click');
	};
	
	/*
	 * FUNCTION selectionManager
	 * Used to handle selections across paging requests
	 */
	var selectionManager = function (id, status) {
		// was it checked (true) or unchecked (false)
		if(status){
			// if it's just one id (not array)
			if(!$.isArray(id)){
				// if it's not already in the array, then add it
				if($.inArray(id,selArr) < 0){selArr.push(id)}
			} else {
				// which id's aren't already in the 'selected' array
				var tmp = $.grep(id,function(item,ind){
					return $.inArray(item,selArr) < 0;
				});
				// add only those unique id's to the 'selected' array
				$.merge(selArr,tmp);
			}
		} else {
			// if it's just one id (not array)
			if(!$.isArray(id)){
				// remove that one id
				selArr.splice($.inArray(id,selArr),1);
			} else {
				// give me an array without the 'id's passed
				// (resetting the 'selected' array)
				selArr = $.grep(selArr,function(item,ind){
					return $.inArray(item,id) > -1;
				},true);
			}
		}
		$('#t_gridTest button#exportButton').button((selArr.length > 0)?'enable':'disable');
	};
	
	/*
	 * FUNCTION rowSelectionHandler
	 * Used to handle row selections
	 */
	var rowSelectionHandler = function (id, status) {
		selectionManager(id, status);
	};
	
	/*
	 * FUNCTION selectAllHandler
	 * Used to handle selection of all records displayed
	 */
	var selectAllHandler = function (idArr, status) {
		selectionManager(idArr, status);
	};
	
	/**
	 * FUNCTION emptyMethod
	 * returns nothing
	 */
	var emptyMethod = function(){
		return;
	};
	
	/*
	 * jqGrid Demo configuration
	 */
	grid.jqGrid({
		//width:800,
		height: 350,
		loadui: 'block',
		deepempty: true,
		
		pager:'#pager',
		toppager: true,
		pagerpos:'left',
		
		toolbar:[true,"top"],
		
		multiselect: gridMultiSelect > 0,
		multiselectWidth: 25,
		
		rowNum:50,
		rowList:[10,20,30,40,50],
		viewrecords: true,
		
		sortname: 'Posted',
		sortorder: 'asc',
		colModel: [
			{name: 'id', index: 'id', label: 'Action', width: 60, fixed: true, sortable: false, resizable: false, align: 'center', formatter: 'actionFormatter', key: true},
			{name: 'title', index: 'title'},
			{name: 'posted', index: 'posted', label: 'Release Date', summaryType: emptyMethod, summaryTpl: '<div class=\"dateSummaryFooter\">Total Views: <\/div>'},
			{name: 'views', index: 'views', align: 'right', width: 60, fixed: true, summaryType: 'sum'},
			{name: 'categoryname', index: 'categoryname'}
		],
		
		prmNames:{page:"pageIndex",sort:"sortCol",order:"sortDir",rows:"pageSize"},
		postData:{method:"GetGroupedEntries",returnFormat:"JSON"},
		datatype: populateGrid,
		jsonReader: {
			id: "id", // function(obj){return $.inArray("ID",obj.data.COLUMNS);}, *not yet, but I'm working on it*
			root: "data",
			page: "pageIndex",
			total: "pageCount",
			records: "recordCount",
			repeatitems: false
		},
		grouping: true,
		groupingView: {
			groupField: ['categoryname'],
			groupDataSorted: true,
			groupColumnShow: false,
			groupCollapse: true,
			plusicon: 'bullet_toggle_plus',
			minusicon: 'bullet_toggle_minus',
			groupSummary: [true]
			//groupText: ['{0} ({1})'],
			
		},
		onSelectRow: rowSelectionHandler,
		onSelectAll: selectAllHandler,
		gridComplete: gridLoadInit
	});
	
	// Build out grid toolbar content
	$('#t_gridTest').append('<button id=\"addButton\">Add</button><button id=\"exportButton\">Export</button>').addClass('customToolbar');
	
	// click handler of the 'Add' button
	$('button#addButton').button({icons: {primary: 'add'}}).click(function(ev){
		ev.preventDefault();
		
		return false;
	});
	
	// click handler of the 'Export' button
	$('button#exportButton').button({icons: {primary: 'page_white_go'}, disabled: true}).click(function(ev){
		ev.preventDefault();
		console.log(selArr);
		return false;
	});
	
	prettyPrint();
});