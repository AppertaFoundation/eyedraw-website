// incrementalSearch.js - OpenEyes
// Version: 0.9
// Author: Bill Aylward
// © 2010 OpenEyes
// Created: 15 Feb 2010
// Modified: 15 Feb 2010

/*
 Functions to enable an incremental search using an AJAX call
 HTML requirements;
 A form with the following attributes
 		name="oeform"
 		href="<name of calling script>"  (set by php script)
 
 Form elements;
 <input type="text" name="entry" onkeyup="entryKeyUp(event);"> 
 <select name="namelist" ondblclick="nameSelected(namelist.value);" onKeyPress="namelistKeyPress(event, namelist.value);">
*/

// Sets focus to entry text box and suppresses form submission from enter key
function setFocusToEntry()
{
	document.forms["oeform"]["entry"].focus();
	document.onkeypress = stopSubmitWithCR;
}
		
// Responds to key press in namelist and if CR, selects name
function namelistKeyPress(e, id, theValue)
{
	if (e.keyCode == 13)
	{
		// Select this patient
		nameSelected(id, theValue);
	}
}

// Function called from entry box after keyup
function entryKeyUp(e)
{
	// Return pressed means incremental search over, so move to results
	if (e.keyCode == 13)
	{
		// Get reference to name list
		var namelist = document.getElementById("namelist");
		
		// If it exists, set focus and selection to first row
		if (namelist != undefined)
		{
			namelist.focus();
			namelist.selectedIndex = 0;
		}
	}
	
	// Do search only for alphabetical keys or backspace
	else if ((e.keyCode >= 65 && e.keyCode <= 90) || e.keyCode == 8)
	{
		// Do AJAX search
		var text = document.getElementById('is_entry').value;
		incrementalSearch(text);
	}
}

// Function called from select after keyup
function selectKeyUp(e)
{
	// Return pressed means incremental search over, so move to results
	if (e.keyCode == 13)
	{
		// Get reference to name list
		var select = document.getElementById("common");
		
		if (select.selectedIndex != 0)
		{
			setDiagnosis(select.selectedIndex);
		}
	}
}

// AJAX - call function to create the XMLHttpRequest object
var http = createRequestObject();

// AJAX - create request object
function createRequestObject()
{
    var tmpXmlHttpObject;
    
    // Create the XMLHttpRequest object
    if (!isExplorer())
    { 
        tmpXmlHttpObject = new XMLHttpRequest();
    }
    else if (window.ActiveXObject)
    {
        try
        {
        	tmpXmlHttpObject = new ActiveXObject("Msxml2.XMLHTTP");
        } 
        catch (e)
        {
            try
            {
            	tmpXmlHttpObject = new ActiveXObject("Microsoft.XMLHTTP");
            } 
            catch (e) {}
        }
    }

    if (!tmpXmlHttpObject)
    {
        alert('This browser does not support AJAX');
        return false;
    }
    
    return tmpXmlHttpObject;
}

// AJAX - process response
function processResponse()
{
	//check if the response has been received from the server
    if(http.readyState == 4)
    {
        // Read and assign the response from the server
        var response = http.responseText;
		
        // Assign the response to the contents of a div 
        document.getElementById('results').innerHTML = response;
    }
}


		
