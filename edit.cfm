<cfsetting enablecfoutputonly="true" />

<cfparam type="string" name="FORM.recId" default="" />

<cfif !Len(FORM.recId)>
	<cfoutput>You must supply an ID of a record to edit!</cfoutput>
	<cfabort />
</cfif>

<cfoutput>
	<p style="font-weight:bold;">You are editing #FORM.recId#</p>
</cfoutput>

<cfsetting enablecfoutputonly="false" />