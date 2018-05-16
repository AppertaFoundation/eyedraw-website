// Calls php script to do incremental search
function incrementalSearch(searchText)
{
	// Name of results namelist
	var selectName = 'namelist';
    			
	// Define server connection
    http.open('get', 'ajaxSearchProcedures.php?txt=' + searchText + '&select=' + selectName);
    
    // Assign handler for the response
    http.onreadystatechange = processResponse;
	
    // Send the request to the server
    http.send(null);
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
			setProcedure(select.value);
		}
	}
}

// Set hidden value to code and submit form
function setProcedure(_value)
{
	// Get reference to select
	var sel = document.getElementById("common");
	
	// Set procedure
	var sep = document.getElementById('procedure_display').innerHTML == ""?"":"/";
	document.getElementById('procedure_display').innerHTML = document.getElementById('procedure_display').innerHTML + sep + _value;

	// Show clear button
	document.getElementById('clearButton').style.display = "block";
	
	// Reset select to first option
	sel.selectedIndex = 0;
}

// Function called from selection in namelist by double click or CR key press
function nameSelected(id, _value)
{
	// Set procedure
	var sep = document.getElementById('procedure_display').innerHTML == ""?"":"/";
	document.getElementById('procedure_display').innerHTML = document.getElementById('procedure_display').innerHTML + sep + _value;

	// Show clear button
	document.getElementById('clearButton').style.display = "block";
	
	// Clear nameselected
	document.getElementById('results').innerHTML = "";
	
	// Clear text box
	document.getElementById('is_entry').value = "";
	
	// Set focus to select
	document.getElementById("common").focus();
}

function newProcedure(type)
{
	// Reload page with user_id = 0
	//var url = "viewAdmins.php?edit=true&type=users&id=0";
	//window.location = url;
}

function clearProcedure()
{
	// Clear procedure box
	document.getElementById('procedure_display').innerHTML = "";

	// Hide clear button
	document.getElementById('clearButton').style.display = "none";
	
	// Clear incremental search box
	document.getElementById('is_entry').value = "";
	
	// Reset focus to select element
	document.getElementById("common").focus();	
}
