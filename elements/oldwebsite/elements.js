/**
 * Contains common javascript functions for elements
 */
 

// Takes selection from a select dropdown and adds to a text area, with comma if appropriate
function addToTextarea(selectId, textareaId, fixed)
{
	// Get references to select and textarea
	var select = document.getElementById(selectId);
	var textArea = document.getElementById(textareaId);
	
	// Get value and text from select box
	var value = select.options[select.selectedIndex].value;
	var text = select.options[select.selectedIndex].text;
	
	// If text there already, make it lower case (as long as it has no caret) and add a comma before
	if (textArea.value.length > 0)
	{
		char = value.charAt(0);
		if (char != "^")
		{
			text = lcfirst(text);
		}		
		var text = ", " + text;
	}
	
	// Add to textarea
	textArea.value = textArea.value + text;
	
	// Adjust height of target textarea
	if (typeof(fixed) == 'undefined')
	{
		adjustHeight(textareaId, 40);
	}
	
	// Reset select
	select.selectedIndex = 0;
}

// Makes automatically resizeable textarea. Style should be set with no scrollbars (overflow: hidden;)
function adjustHeight(id, defaultHeight)
{
	// Get reference to text area
	var textArea = document.getElementById(id);
	
	// Start by setting to default height
	textArea.style.height = defaultHeight + "px";
	
	// Now set new height according to content
	if (textArea.scrollHeight > textArea.clientHeight)
	{
		textArea.style.height = textArea.scrollHeight + "px";
	}
}

// Decapitalise first letter of a string
function lcfirst(str)
{
    var firstLetter = str.substr(0, 1);
    return firstLetter.toLowerCase() + str.substr(1);
}

// Returns true if browser is firefox
function isFirefox()
{
	var index = 0;
	var ua = window.navigator.userAgent;
	index = ua.indexOf("Firefox");
	
	if (index > 0)
	{
		return true;
	}
	else
	{
		return false;
	}
}