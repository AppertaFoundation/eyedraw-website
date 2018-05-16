// Calls php script to do incremental search
function incrementalSearch(searchText)
{
	// Name of results namelist
	var selectName = 'namelist';
    			
	// Define server connection
    http.open('get', 'ajaxSearchDiagnoses.php?txt=' + searchText + '&select=' + selectName);
    
    // Assign handler for the response
    http.onreadystatechange = processResponse;
	
    // Send the request to the server
    http.send(null);
}

// Set hidden value to code and submit form
function setDiagnosis(_index)
{
	// Get text of selected diagnosis
	var sel = document.getElementById("common");
	var chosenOption = sel.options[_index]
	
	// Set diagnosis
	document.getElementById('diagnosis_display').innerHTML = chosenOption.text;

	// Show clear button
	document.getElementById('clearButton').style.display = "block";
	
	// Reset select to first option
	sel.selectedIndex = 0;
}

// Function called from selection in namelist by double click or CR key press
function nameSelected(id, code)
{
	// Get selected option
	var sel = document.getElementById(id);
	var chosenOption = sel.options[sel.selectedIndex]

	// Display term 
	document.getElementById('diagnosis_display').innerHTML = chosenOption.text;
	
	// Show clear button
	document.getElementById('clearButton').style.display = "block";
	
	// Clear nameselected
	document.getElementById('results').innerHTML = "";
}

function newDiagnosis(type)
{
	// Reload page with user_id = 0
	//var url = "viewAdmins.php?edit=true&type=users&id=0";
	//window.location = url;
}

function clearDiagnosis()
{
	// Clear diagnosis box
	document.getElementById('diagnosis_display').innerHTML = "";

	// Hide clear button
	document.getElementById('clearButton').style.display = "none";
	
	// Clear incremental search box
	document.getElementById('is_entry').value = "";
	
	// Reset focus to select element
	document.getElementById("common").focus();	
}
