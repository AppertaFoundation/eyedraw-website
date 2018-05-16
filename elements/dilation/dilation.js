// Clear table
function clearTable()
{
	if (scriptCount > 0)
	{
		for (scriptCount--; scriptCount >= 0; scriptCount--)
		{
			document.getElementById('presTable').deleteRow(scriptCount + 1);
		}
	}
	
	scriptCount = 0;
	document.getElementById('timeStampSpan').style.display = "none";
}

// Delete row
function deleteRow(obj)
{
	// Get index of row
	var rowIndex = obj.parentNode.parentNode.sectionRowIndex + 1;
	
	// Delete it
	document.getElementById('presTable').deleteRow(rowIndex);
	
	// Augment row counter
	scriptCount--;
	
	// Remove timestamp
	if (scriptCount == 0)
	{
		document.getElementById('timeStampSpan').style.display = "none";
	}
}

// Add row
function addRow(_value)
{
	// Get reference to table
	var table = document.getElementById('presTable');
	
	// Index of next row is equal to number of rows
	var nextRowIndex = table.tBodies[0].rows.length;
	
	// Add new row
	var newRow = table.tBodies[0].insertRow(nextRowIndex);
	
	// Name
	var paraNode = document.createElement("p");
	paraNode.setAttribute('class','tableText');
	
	// Editable text for 'Other' only
	if (_value == "Other")
	{
		var node = document.createElement("input");
		node.type = "text";
		node.value = _value;
		node.focus();
	}
	else
	{
		var node = document.createTextNode(_value);
	}
	
	// Add to table
	paraNode.appendChild(node);
	var cell0 = newRow.insertCell(0);
	cell0.appendChild(node);
				
	// Number of drops
	var cell1 = newRow.insertCell(1);
	var numbers = ['1', '2', '3', '4', ,'5', '6', '7', '8', '9', '10'];
	cell1.appendChild(tableSelect(numbers, 1, 'number'));
				
	// Delete aref
	var cell2 = newRow.insertCell(2);
	var deleteButton = document.createElement('a');
	deleteButton.setAttribute('onClick','deleteRow(this);');
	deleteButton.innerText = "Delete";
	cell2.appendChild(deleteButton);
	
	// Reset select index
	document.getElementById('drugSelector').selectedIndex = 0;
	
	// Augment row counter
	scriptCount++;
	
	// Time stamp
	document.getElementById('timeStamp').value = getTime();
	document.getElementById('timeStampSpan').style.display = "inline";
	
	// If input needed focus
	if (_value == "Other") node.focus();
}

// Construct and return select for array
function tableSelect(optionArray, selectedValue, name)
{
	var tableSelect = document.createElement('select');
	tableSelect.setAttribute('name', name + scriptCount);
	tableSelect.setAttribute('class', 'tableSelect');
	
	// Iterate through array adding options
	var i;
	for (i in optionArray)
	{
		var option = document.createElement('option');
		if (selectedValue == optionArray[i]) option.setAttribute('selected', 'true');
		option.innerText = optionArray[i];
		tableSelect.appendChild(option);
	}

	return tableSelect;
}

// Get time
function getTime()
{
	var date = new Date();
	//var seconds = zfill(2, date.getSeconds());
	var minutes = zfill(2, date.getMinutes());
	var hour = zfill(2, date.getHours());
	
	return hour + ":" + minutes;
}

// Zero padding
function zfill(len, num)
{
	return (Array(len).join("0") + num).slice(-len);
}

