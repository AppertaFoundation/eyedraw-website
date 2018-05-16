// Clear table
function clearTable()
{
	if (procCount > 0)
	{
		for (procCount--; procCount >= 0; procCount--)
		{
			document.getElementById('procTable').deleteRow(procCount + 1);
		}
	}
	
	procCount = 0;
}

// Delete row
function deleteProc(obj)
{
	// Get index of row
	var rowIndex = obj.parentNode.parentNode.sectionRowIndex;
	
	// Get name of procedure, then delete it
	var table = document.getElementById('procTable');
	var proc = table.rows[rowIndex].cells[0].textContent;
	table.deleteRow(rowIndex);

	// Augment row counter
	procCount--;
	
	// Remove any proc specific note
	var value = manyToOne(proc);
	var procSpecific = document.getElementById(value);
	if (procSpecific != null)
	{
		procSpecific.style.display = 'none';
	}
}

// Add procedure
function addProc(_value)
{
	// Get index of selected procedure
	var index = _value
	
	// Get reference to table
	var table = document.getElementById('procTable');
	
	// Index of next row is equal to number of rows
	var nextRowIndex = table.tBodies[0].rows.length;
	
	// Add new row
	var newRow = table.tBodies[0].insertRow(nextRowIndex);
	
	// Name
	var paraNode = document.createElement("p");
	paraNode.setAttribute('class','tableText');
	var textNode = document.createTextNode(_value);
	paraNode.appendChild(textNode);
	var cell0 = newRow.insertCell(0);
	cell0.setAttribute('width', '40%');
	cell0.appendChild(paraNode);
	
	var cell2 = newRow.insertCell(1);
	var deleteButton = document.createElement('a');
	deleteButton.setAttribute('onClick','deleteProc(this);');
	deleteButton.innerText = "remove";
	cell2.appendChild(deleteButton);
				
	// Reset select index
	document.getElementById('procSelector').selectedIndex = 0;
	
	// Augment row counter
	procCount++;
	
	// Add procedure specific operation note
	var value = manyToOne(_value);		
	var procSpecific = document.getElementById(value);
	if (procSpecific != null)
	{
		procSpecific.style.display = 'block';
	}
}

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

// Function called from selection in namelist by double click or CR key press
function nameSelected(id, _value)
{
	// Add selected procedure to row
	addProc(_value);
	
	// Show clear button
	//document.getElementById('clearButton').style.display = "block";
	
	// Clear nameselected
	document.getElementById('results').innerHTML = "";
	
	// Clear text box
	document.getElementById('is_entry').value = "";
	
	// Set focus to select
	//document.getElementById("common").focus();
}

// Many to one relationship of procs to proc-specific element
function manyToOne(_value)
{
	var returnValue = _value;
	
	if (_value == 'Gas') returnValue = 'Tamponade';
	if (_value == 'Oil') returnValue = 'Tamponade';
	
	return returnValue;
}

