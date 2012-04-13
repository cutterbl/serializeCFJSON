<cfcomponent displayname="source" output="false">
	<cfset VARIABLES.instance = StructNew() />

    <cffunction name="getSource" access="remote" output="false" returntype="struct">
        <cfargument name="pageIndex" required="false" type="numeric" default="0" />
        <cfargument name="pageSize" required="false" type="numeric" default="15" />
        <cfargument name="sortCol" required="false" type="string" default="ID" />
        <cfargument name="sortDir" required="false" type="string" default="DESC" />
        <!---<cfargument name="oFormData" required="false" type="string" default="" />--->
        <cfscript>
            var retVal = {};
            retVal['success'] = true;
            retVal['page'] = ARGUMENTS.pageIndex;
            var orderby = ARGUMENTS.sortCol & " " & ARGUMENTS.sortDir;
            var tmp = "";
            var i = 0;
        </cfscript>
        <cftry>
            <cfquery name="entries">
                SELECT   SQL_CALC_FOUND_ROWS id,
                        text
        	    FROM    sourcetbl
                ORDER BY #orderby#
                LIMIT   <cfqueryparam cfsqltype="cf_sql_integer" value="#(ARGUMENTS.pageIndex-1) * ARGUMENTS.pageSize#" />, <cfqueryparam cfsqltype="cf_sql_integer" value="#ARGUMENTS.pageSize#" />
            </cfquery>
            <cfif entries.recordcount>
                <cfquery name="total">
                    SELECT FOUND_ROWS() as TotalCount
                </cfquery>
                <cfif total.recordCount>
                    <cfset retVal['result'] = entries />
                    <cfset retVal['totalCount'] = total.TotalCount / ARGUMENTS.rows />
                <cfelse>
                    <cfthrow type="My_Custom" errorcode="0001" message="No records were returned" />
                </cfif>
            </cfif>
            <cfcatch type="any">
                <cfset retVal['success'] = false />
                <cfset retVal['message'] = CFCATCH.message />
            </cfcatch>
        </cftry>
        <cfreturn retVal />
    </cffunction>
</cfcomponent>