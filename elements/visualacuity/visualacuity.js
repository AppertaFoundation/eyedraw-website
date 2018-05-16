
// Call each select that needs changing
function changeOptions(_format)
{
	// Go through selects populating them
	updateSelect("rva_in", _format);
	updateSelect("rva_cr", _format);
	updateSelect("lva_in", _format);
	updateSelect("lva_cr", _format);
	updateSelect("bva_in", _format);
	updateSelect("bva_cr", _format);
	
	// Set focus to first select
	document.getElementById("rva_in").focus();
}

// Change the options in the _select to _format
function updateSelect(_selectId, _format)
{
	// Get reference to the select
	var sel = document.getElementById(_selectId);
	
	// Remove all options
	sel.options.length = 0;
	
	// Repopulate with correct format
	switch (_format)
	{
		case "Snellen Metre":
			sel.options[sel.options.length] = new Option("Not recorded","Not recorded");
			sel.options[sel.options.length] = new Option("6/5","");
			sel.options[sel.options.length] = new Option("6/6","");
			sel.options[sel.options.length] = new Option("6/9","");
			sel.options[sel.options.length] = new Option("6/12","");
			sel.options[sel.options.length] = new Option("6/18","");
			sel.options[sel.options.length] = new Option("6/24","");
			sel.options[sel.options.length] = new Option("6/60","");
			sel.options[sel.options.length] = new Option("3/60","");
			sel.options[sel.options.length] = new Option("CF","");
			sel.options[sel.options.length] = new Option("HM","");
			sel.options[sel.options.length] = new Option("PL","");
			sel.options[sel.options.length] = new Option("NPL","");
			break;

		case "Snellen Foot":
			sel.options[sel.options.length] = new Option("Not recorded","Not recorded");
			sel.options[sel.options.length] = new Option("20/20","");
			sel.options[sel.options.length] = new Option("20/25","");
			sel.options[sel.options.length] = new Option("20/30","");
			sel.options[sel.options.length] = new Option("20/40","");
			sel.options[sel.options.length] = new Option("20/50","");
			sel.options[sel.options.length] = new Option("20/60","");
			sel.options[sel.options.length] = new Option("20/70","");
			sel.options[sel.options.length] = new Option("20/80","");
			sel.options[sel.options.length] = new Option("20/100","");
			sel.options[sel.options.length] = new Option("20/200","");
			sel.options[sel.options.length] = new Option("20/400","");
			sel.options[sel.options.length] = new Option("CF","");
			sel.options[sel.options.length] = new Option("HM","");
			sel.options[sel.options.length] = new Option("PL","");
			sel.options[sel.options.length] = new Option("NPL","");
			break;

		case "ETDRS letters":
			sel.options[sel.options.length]=new Option("Not recorded","Not recorded")
			var value = 100;
			for (i = 0; i < 20; i++)
			{
				sel.options[sel.options.length] = new Option(value.toFixed(0),"");
				value -= 5;
			}
			sel.options[sel.options.length] = new Option("CF","");
			sel.options[sel.options.length] = new Option("HM","");
			sel.options[sel.options.length] = new Option("PL","");
			sel.options[sel.options.length] = new Option("NPL","");
			break;
								
		case "logMAR":
			sel.options[sel.options.length]=new Option("Not recorded","Not recorded")
			var value = -0.30;
			for (i = 0; i < 20; i++)
			{
				sel.options[sel.options.length] = new Option(value.toFixed(2),"");
				value += 0.1;
			}
			sel.options[sel.options.length] = new Option("CF","");
			sel.options[sel.options.length] = new Option("HM","");
			sel.options[sel.options.length] = new Option("PL","");
			sel.options[sel.options.length] = new Option("NPL","");
			break;

		case "Decimal":
			sel.options[sel.options.length]=new Option("Not recorded","Not recorded")
			var value = 1.60;
			for (i = 0; i < 16; i++)
			{
				sel.options[sel.options.length] = new Option(value.toFixed(2),"");
				value -= 0.1;
			}
			sel.options[sel.options.length] = new Option("0.05","");
			sel.options[sel.options.length] = new Option("CF","");
			sel.options[sel.options.length] = new Option("HM","");
			sel.options[sel.options.length] = new Option("PL","");
			sel.options[sel.options.length] = new Option("NPL","");
			break;
					
		default:
			alert("default");
			break;
	}
}

// Sets corrected select to same value as initial
function setCorrected(_index, _id)
{
	document.getElementById(_id).selectedIndex = _index;
}

// Show or hide the both eyes section
function showBothEyes(_value)
{
    if (_value)
	{
		document.getElementById("botheyesdiv").style.display = "inline";
		document.getElementById("editSectionDiv").style.height = "270px";
	}
	else
	{
		document.getElementById("botheyesdiv").style.display = "none";
		document.getElementById("editSectionDiv").style.height = "150px";
	}
}

// Show or hide the notes boxes
function showNotes(_value)
{
    if (_value)
	{
		document.getElementById("r_notes").style.display = "inline";
		document.getElementById("l_notes").style.display = "inline";
		document.getElementById("b_notes").style.display = "inline";
	}
	else
	{
		document.getElementById("r_notes").style.display = "none";
		document.getElementById("l_notes").style.display = "none";
		document.getElementById("b_notes").style.display = "none";
	}
}