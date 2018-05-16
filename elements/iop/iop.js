// Change instrument select's default values
function changeDefault(_index)
{
	document.getElementById("r_ins").selectedIndex = _index;
	document.getElementById("l_ins").selectedIndex = _index;
}

// Change left eye select value
function changeLeftSelect(_index)
{
	if (document.getElementById("chk_lnk").checked)
	{
		document.getElementById("l_ins").selectedIndex = _index;
	}
}

// Show or hide the notes boxes
function showInstruments(_value)
{
    if (_value)
	{
		document.getElementById("r_ins").style.display = "inline";
		document.getElementById("l_ins").style.display = "inline";
	}
	else
	{
		document.getElementById("r_ins").style.display = "none";
		document.getElementById("l_ins").style.display = "none";
	}
}