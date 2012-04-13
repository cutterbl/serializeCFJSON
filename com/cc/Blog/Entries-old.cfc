<cfcomponent displayname="Entries" output="false">

    <cfset VARIABLES.instance = StructNew() />

    <cffunction name="getEntries" access="remote" output="false" returntype="struct">
        <cfargument name="pageIndex" required="false" type="numeric" default="1" />
        <cfargument name="pageSize" required="false" type="numeric" default="15" />
        <cfargument name="sortCol" required="true" type="string" default="" />
        <cfargument name="sortDir" required="true" type="string" />
        <!---<cfargument name="oFormData" required="false" type="string" default="" />--->
        <cfscript>
            var retVal = {"success" = true, "pageIndex" = ARGUMENTS.pageIndex, "message" = "", "data" = ""};
            var orderby = ARGUMENTS.sortCol & " " & ARGUMENTS.sortDir;
            var tmp = "";
            var i = 0;
            /*var entries = QueryNew('id,title,posted,views');
            var total = QueryNew('TotalCount');

            retVal['sEcho'] = ARGUMENTS.sEcho;
            if (len(trim(ARGUMENTS.oFormData))){
                ARGUMENTS.oFormData = deserializeJSON(ARGUMENTS.oFormData);
            }
            if (len(trim(ARGUMENTS.aoSort))){
                ARGUMENTS.aoSort = deserializeJSON(ARGUMENTS.aoSort);
                orderby = "";
                for(i=1;i<=arrayLen(ARGUMENTS.aoSort);i++){
                    tmp = ARGUMENTS.aoSort[i].colName & " " & uCase(ARGUMENTS.aoSort[i].sortDir);
                	if (ReFindNoCase("^(title|posted|views) ?(asc|desc)?$", tmp)) {
                		orderby &= tmp;
                        if(i != arrayLen(ARGUMENTS.aoSort)){
                            orderby &= ",";
                        }
                    }
                }
            }*/
        </cfscript>
        <!---<cftry>--->
            <cfquery name="entries" datasource="blog">
                SELECT   SQL_CALC_FOUND_ROWS id,
                        title,
                        posted,
                        views
        	    FROM    tblblogentries
                ORDER BY #orderby#
                LIMIT   <cfqueryparam cfsqltype="cf_sql_integer" value="#(ARGUMENTS.pageIndex-1) * ARGUMENTS.pageSize#" />, <cfqueryparam cfsqltype="cf_sql_integer" value="#ARGUMENTS.pageSize#" />
            </cfquery>
            <cfif entries.recordcount>
                <cfquery name="total" datasource="blog">
                    SELECT FOUND_ROWS() as TotalCount
                </cfquery>
                <cfif total.recordCount>
                    <cfset retVal['data'] = entries />
                    <cfset retVal['recordCount'] = total.TotalCount />
                    <cfset retVal['totalCount'] = Ceiling(total.TotalCount / ARGUMENTS.pageSize) />
                <cfelse>
                    <cfthrow type="My_Custom" errorcode="0001" message="No records were returned" />
                </cfif>
            </cfif>
            <!---<cfcatch type="any">
                <cfset retVal['success'] = false />
                <cfset retVal['message'] = CFCATCH.message />
            </cfcatch>
        </cftry>--->
        <cfreturn retVal />
    </cffunction>

    <cffunction name="getProxy" access="remote" output="false" returntype="struct">
		<cfscript>
			var LOCAL = StructNew();
			LOCAL.retVal = StructNew();
			LOCAL.retVal['success'] = true;
			LOCAL.call = getEntries();
			LOCAL.recArr = ArrayNew(1);
			LOCAL.q = serializeJSON(LOCAL.call.result);
			LOCAL.qB = deserializeJSON(LOCAL.q);
			for(LOCAL.i=1;LOCAL.i lte ArrayLen(LOCAL.qB.DATA);LOCAL.i++){
				LOCAL.tmp = StructNew();
				LOCAL.tmp['dataId'] = LOCAL.i;
				LOCAL.tmp['dataCell'] = LOCAL.qB.DATA[LOCAL.i];
				arrayAppend(LOCAL.recArr,LOCAL.tmp);
			}
			LOCAL.retVal['result'] = StructNew();
			LOCAL.retVal['result']['data'] = LOCAL.recArr;
			LOCAL.retVal['totalCount'] = LOCAL.call.totalCount;
			//WriteDump(var=LOCAL.recArr,abort=true);
			return LOCAL.retVal;
		</cfscript>
	</cffunction>

</cfcomponent>