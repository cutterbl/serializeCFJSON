<cfcomponent displayname="Application" output="false" >

    <cfscript>
    THIS.name = "jqGridDemo-pt1";
    THIS.applicationTimeout = createTimespan(0,2,0,0);
    THIS.dataSource = "blog"; // With this I don't need to include the attribute in my cfquery tags
    THIS.serverSideFormValidation = false; // this is 'true' by default, but I like to write my own
    THIS.sessionManagement = true;
    THIS.sessionTimeout = createTimespan(0,0,20,0);
    THIS.setClientCookies = true;
    THIS.setDomainCookies = true;
    THIS.timeout = 3000; // This overrides the CF Admin's request timeout value, in milliseconds
    </cfscript>

</cfcomponent>