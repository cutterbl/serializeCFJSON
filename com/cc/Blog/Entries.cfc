/**
 *    ===================================================================
 *    COMPONENT/CLASS
 *    com.cc.Blog.Entries
 *
 *    PURPOSE
 *    A component for getting/setting information on blog entries
 *
 *    AUTHOR
 *    Steve 'Cutter' Blades [C], webDOTadminATcutterscrossingDOTcom
 *
 *    REVISIONS
 *    ===================================================================
 *    [C 01.29.11]
 *    Initial creation
 *    ===================================================================
 *
 *    @name Entries
 *    @displayName Blog Entries
 *    @output false
 */
component {

	/*
	 *	Creating some constants, for validity checking
	 */
	VARIABLES._COLUMNARRAY = ["id","title","posted","views"];
	VARIABLES._DIRARRAY = ["asc","desc"];

	/**
	 *	FUNCTION GetEntries
	 *	A function to get paging query of blog entries for layout in jqGrid
	 *
	 *	@access remote
	 *	@returnType struct
	 *	@output false
	 */
	function GetEntries(numeric pageIndex = 1, numeric pageSize = 50, string sortCol = "ID", string sortDir = "desc", string search = "") {
		LOCAL.retVal = {"success" = true, "pageIndex" = ARGUMENTS.pageIndex, "pageCount" = 0, "recordCount" = 0, "message" = "", "data" = ""};

		// Verify that your sort column and direction are valid. If not, then return an error.
		if(ArrayFindNoCase(VARIABLES._COLUMNARRAY, ARGUMENTS.sortCol) AND ArrayFindNoCase(VARIABLES._DIRARRAY, ARGUMENTS.sortDir)){
			LOCAL.orderby = ARGUMENTS.sortCol & " " & ARGUMENTS.sortDir;
		} else {
			StructAppend(LOCAL.retVal,{"success" = false, "message" = "Your sort criteria is not valid."},true);
			return LOCAL.retVal;
		}

		if(Len(ARGUMENTS.search) AND IsJSON(ARGUMENTS.search)){
			ARGUMENTS.search = DeserializeJSON(ARGUMENTS.search);
		} else {
			ARGUMENTS.search = {};
		}

		param name="ARGUMENTS.search.title" default="";
		param name="ARGUMENTS.search.from" default="";
		param name="ARGUMENTS.search.to" default="";
		LOCAL.hasFrom = Len(ARGUMENTS.search.from) AND IsDate(ARGUMENTS.search.from);
		LOCAL.hasTo = Len(ARGUMENTS.search.to) AND IsDate(ARGUMENTS.search.to);

		// Main data query
		LOCAL.sql = "SELECT	SQL_CALC_FOUND_ROWS id,
						title,
						posted,
						views
					FROM	tblblogentries
					WHERE 0 = 0
					 ";
		if(Len(ARGUMENTS.search.title)){
			LOCAL.sql &= " AND title LIKE :title
			 ";
		}
		if(LOCAL.hasTo){
			LOCAL.sql &= "AND posted BETWEEN :from
			 AND :to
			 ";
		}
		LOCAL.sql &= "ORDER BY #LOCAL.orderby#
					 LIMIT	:start,:numRec";
		LOCAL.q = new Query(sql = LOCAL.sql);
		LOCAL.q.addParam(name = "start", value = (ARGUMENTS.pageIndex-1) * ARGUMENTS.pageSize, cfsqltype = "cf_sql_integer");
		LOCAL.q.addParam(name = "numRec", value = ARGUMENTS.pageSize, cfsqltype = "cf_sql_integer");
		if(Len(ARGUMENTS.search.title)){
			LOCAL.q.addParam(name = "title", value = "%#ARGUMENTS.search.title#%", cfsqltype = "cf_sql_varchar");
		}
		if(LOCAL.hasFrom AND LOCAL.hasTo){
			LOCAL.q.addParam(name = "from", value = CreateODBCDateTime(ARGUMENTS.search.from), cfsqltype = "cf_sql_timestamp");
			LOCAL.q.addParam(name = "to", value = CreateODBCDateTime(ARGUMENTS.search.to & " 23:59:59"), cfsqltype = "cf_sql_timestamp");
		} else if (!LOCAL.hasFrom AND LOCAL.hasTo){
			LOCAL.q.addParam(name = "from", value = CreateODBCDateTime(ARGUMENTS.search.to), cfsqltype = "cf_sql_timestamp");
			LOCAL.q.addParam(name = "to", value = CreateODBCDateTime(ARGUMENTS.search.to & " 23:59:59"), cfsqltype = "cf_sql_timestamp");
		}

		try {
			LOCAL.retVal.data = LOCAL.q.execute().getResult();
			if(LOCAL.retVal.data.recordCount){
				/*
				 * The next statement is used to provide a TotalCount of all matched records.
				 */
				LOCAL.q.setSql("SELECT FOUND_ROWS() as totalCount");
				LOCAL.totResult = LOCAL.q.execute().getResult();
				if(LOCAL.totResult.recordCount){
					LOCAL.retVal.recordCount = LOCAL.totResult.totalCount; // total number of records
					LOCAL.retVal.pageCount = Ceiling(LOCAL.totResult.TotalCount / ARGUMENTS.pageSize); // total number of pages by pageSize
				}
			}
		} catch (any excpt) {
			LOCAL.retVal.success = false;
			LOCAL.retVal.message = excpt.message;
		}
		return LOCAL.retVal;
	}

	/**
	 *	FUNCTION GetGroupedEntries
	 *	A function to get paging query of blog entries for layout in jqGrid
	 *
	 *	@access remote
	 *	@returnType struct
	 *	@output false
	 */
	function GetGroupedEntries(numeric pageIndex = 1, numeric pageSize = 50, string sortCol = "ID", string sortDir = "desc", string search = "") {
		LOCAL.retVal = {"success" = true, "pageIndex" = ARGUMENTS.pageIndex, "pageCount" = 0, "recordCount" = 0, "message" = "", "data" = ""};
		LOCAL.scArr = ListToArray(ARGUMENTS.sortCol);
		LOCAL.sortCol = (ArrayLen(LOCAL.scArr) eq 2) ? LOCAL.scArr[2] : ARGUMENTS.sortCol;
		// Verify that your sort column and direction are valid. If not, then return an error.
		if(ArrayFindNoCase(VARIABLES._COLUMNARRAY, Trim(LOCAL.sortCol)) AND ArrayFindNoCase(VARIABLES._DIRARRAY, ARGUMENTS.sortDir)){
			LOCAL.orderby = ARGUMENTS.sortCol & " " & ARGUMENTS.sortDir;
		} else {
			StructAppend(LOCAL.retVal,{"success" = false, "message" = "Your sort criteria is not valid."},true);
			return LOCAL.retVal;
		}

		if(Len(ARGUMENTS.search) AND IsJSON(ARGUMENTS.search)){
			ARGUMENTS.search = DeserializeJSON(ARGUMENTS.search);
		} else {
			ARGUMENTS.search = {};
		}

		param name="ARGUMENTS.search.title" default="";
		param name="ARGUMENTS.search.from" default="";
		param name="ARGUMENTS.search.to" default="";
		LOCAL.hasFrom = Len(ARGUMENTS.search.from) AND IsDate(ARGUMENTS.search.from);
		LOCAL.hasTo = Len(ARGUMENTS.search.to) AND IsDate(ARGUMENTS.search.to);

		// Main data query
		LOCAL.sql = "SELECT	SQL_CALC_FOUND_ROWS b.id,
						b.title,
						c.categoryname,
						b.posted,
						b.views
					FROM	tblblogentries b
					INNER JOIN tblblogentriescategories bec ON bec.entryidfk = b.id
					INNER JOIN tblblogcategories c ON c.categoryid = bec.categoryidfk
					WHERE 0 = 0
					 ";
		if(Len(ARGUMENTS.search.title)){
			LOCAL.sql &= " AND title LIKE :title
			 ";
		}
		if(LOCAL.hasTo){
			LOCAL.sql &= "AND posted BETWEEN :from
			 AND :to
			 ";
		}
		LOCAL.sql &= "ORDER BY #LOCAL.orderby#
					 LIMIT	:start,:numRec";
		LOCAL.q = new Query(sql = LOCAL.sql);
		LOCAL.q.addParam(name = "start", value = (ARGUMENTS.pageIndex-1) * ARGUMENTS.pageSize, cfsqltype = "cf_sql_integer");
		LOCAL.q.addParam(name = "numRec", value = ARGUMENTS.pageSize, cfsqltype = "cf_sql_integer");
		if(Len(ARGUMENTS.search.title)){
			LOCAL.q.addParam(name = "title", value = "%#ARGUMENTS.search.title#%", cfsqltype = "cf_sql_varchar");
		}
		if(LOCAL.hasFrom AND LOCAL.hasTo){
			LOCAL.q.addParam(name = "from", value = CreateODBCDateTime(ARGUMENTS.search.from), cfsqltype = "cf_sql_timestamp");
			LOCAL.q.addParam(name = "to", value = CreateODBCDateTime(ARGUMENTS.search.to & " 23:59:59"), cfsqltype = "cf_sql_timestamp");
		} else if (!LOCAL.hasFrom AND LOCAL.hasTo){
			LOCAL.q.addParam(name = "from", value = CreateODBCDateTime(ARGUMENTS.search.to), cfsqltype = "cf_sql_timestamp");
			LOCAL.q.addParam(name = "to", value = CreateODBCDateTime(ARGUMENTS.search.to & " 23:59:59"), cfsqltype = "cf_sql_timestamp");
		}

		try {
			LOCAL.retVal.data = LOCAL.q.execute().getResult();
			if(LOCAL.retVal.data.recordCount){
				/*
				 * The next statement is used to provide a TotalCount of all matched records.
				 */
				LOCAL.q.setSql("SELECT FOUND_ROWS() as totalCount");
				LOCAL.totResult = LOCAL.q.execute().getResult();
				if(LOCAL.totResult.recordCount){
					LOCAL.retVal.recordCount = LOCAL.totResult.totalCount; // total number of records
					LOCAL.retVal.pageCount = Ceiling(LOCAL.totResult.TotalCount / ARGUMENTS.pageSize); // total number of pages by pageSize
				}
			}
		} catch (any excpt) {
			LOCAL.retVal.success = false;
			LOCAL.retVal.message = excpt.message;
		}
		return LOCAL.retVal;
	}

	/**
	 *	FUNCTION deleteEntry
	 *	Used to remove entries from the system
	 *
	 *	@access remote
	 *	@returnType struct
	 *	@output false
	 */
	function deleteEntry(required string recId){
		LOCAL.retVal = {"success" = true, "message" = "", "data" = ""};

		// BEST PRACTICE: You'll want to verify that the user has the right to do this. Normally, that would go here.

		LOCAL.sql = "DELETE FROM tblblogentries
					 WHERE id = :recId";
		LOCAL.q = new Query(sql = LOCAL.sql);
		LOCAL.q.addParam(name = "recId", value = ARGUMENTS.recId, cfsqltype = "cf_sql_varchar");
		try {
			// You would uncomment the following line to actually remove records, and remove the throw statement
			// LOCAL.q.execute();
			throw (message = "Intentional Exception: You didn't really think I'd delete entries, did you?", type = "custom_err", errorCode = "ce1001");
		} catch (any excpt) {
			// In testing, and with the .execute() commented out above, comment out the next line to watch the grid remove a row
			LOCAL.retVal.success = false;
			LOCAL.retVal.message = excpt.message;
		}
		return LOCAL.retVal;
	}
}
