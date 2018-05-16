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
