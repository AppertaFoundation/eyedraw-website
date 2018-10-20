// common.js - OpenEyes
// Version: 0.9
// Author: Bill Aylward
// © 2010 OpenEyes
// Created: 3 Jan 2010
// Modified: 18 Jun 2010

/*
 * This file contains universally required javascript functions, and is included with every OpenEyes page
 */

// Divert all key presses to this function (IE does not work with onkeypress, so use onkeydown instead)
document.onkeydown = keyPressed;

// Function to handle key presses
function keyPressed(e)
{
	// IE needs a window.event
	var event = e ? e : window.event;
	
	// Check for ctrl and alt key pressed
	if (event)
	{
		if (event.altKey && event.ctrlKey)
		{
			// Don't trigger on alt key alone
			if (event.keyCode != 18)
			{
				// Generate id of target element
				var elementId = "oeak" + String.fromCharCode(event.keyCode);

				// Attempt to get element with that id
				var element = document.getElementById(elementId);

				// If exists, it will either be an <a> with an href attribute or an element with a click method
				if (element)
				{
					// Shift focus to it
					element.focus();
					
					// Generate action
					var url = element.href;
					if (url)
					{
						window.location = url;
					}
					else
					{
						element.click();
					}
				}
			}
		}
		// Return key should not submit form, unless active element is of type submit 
	 	if (event.keyCode == 13)
	 	{
			// Attempt to get active element type
	 		var element = event.srcElement;

			// If its a submit click it
			if (element && element.type == "submit")
			{
				element.click();
			}
			// If its a button click it but don't submit
			else if (element && element.type == "button")
			{
				element.click();
				return false;
			}
			// If its a textarea let it through
			else if (element.type == "textarea")
			{
			}
			// If its a text box, then tab to next one
//			else if (element.type == "text")
//			{
//				this.nextSibling.firstChild.focus();
//			}
			// If its a text input with class 'submit' then allow submission
			else if (element.className == "textsubmit")
			{
				return true;
			}
			// Otherwise prevent submission
			else
			{
				//this.nextSibling.firstChild.focus();
				return false;
			}
	 	}
	}
}

//function submitClicked(el, form)
//{
//	var id = el.id;
//}

// handles interaction with date selector in forms
function updateDate(element)
{
	var curDate = document.getElementById(element).value;
	var curTime = curDate.slice(10);
	
	var newDay = document.getElementById("sel_day").value;
	var newMonth = document.getElementById("sel_month").value;
	var newYear = document.getElementById("sel_year").value;
	
	var newDate = new Date();
	newDate.setFullYear(newYear, newMonth, newDay);
	
	// Makes use of automatic correction in setFullYear function to validate date
	if (newDate.getMonth() != newMonth)
	{
		alert("Invalid date");
	}
	else
	{
		var y = newDate.getFullYear();
		var m = newDate.getMonth() + 1;
		var d = newDate.getDate();
		document.getElementById(element).value = y + "-" + (m>9?"":0) + m + "-" + (d>9?"":0) + d + curTime;
	}
}


//Sets focus to a named element in a form
function setFocusToElement(form, name)
{
	// Get reference to element
	var el = document.forms[form][name];
	
	// Set focus to element
	if (el != undefined)
	{
		el.focus();
	}
}

// Set focus to element with id
function setFocusToElementId(id)
{
	var el = document.getElementById(id);

	// Set focus to element
	if (el != undefined)
	{
		el.focus();
	}
}
// Trim function (http://blog.stevenlevithan.com/archives/faster-trim-javascript)
function trim (str)
{
	return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

// Capitalise first letter of a string
function ucfirst(str)
{
    var firstLetter = str.substr(0, 1);
    return firstLetter.toUpperCase() + str.substr(1);
}

// Decapitalise first letter of a string
function lcfirst(str)
{
    var firstLetter = str.substr(0, 1);
    return firstLetter.toLowerCase() + str.substr(1);
}

// Called by navigation bar or other link if insufficient permission
function noPermission()
{
	document.getElementById("messages").innerHTML = '<p class="error">Insufficient permission</p>';
}

// Changes message text to give under construction messages
function underConstruction()
{
	document.getElementById("messages").innerHTML = '<p class="alert">That OpenEyes module is still under construction</p>';
}

// Returns true if browser is explorer
function isExplorer()
{
   var ua = window.navigator.userAgent;
   var msie = ua.indexOf("MSIE");

   if (msie > 0)
   {
      return true;
   }
   else
   {
      return false;
   }
}

/*
	Form Validation Classes
	
	These are a set of classes to handle form validation. They are instantiated by placing javascript commands
	immediately following the form in the html document, for example;
	
		<script language="JavaScript" type="text/javascript">
		 	var formValidator = new FormValidator("oeform");
		 	formValidator.addValidation("fullname", "required");
		 	formValidator.addValidation("fullname", "numeric");
		 	formValidator.addValidation("password", "required");
		</script>
	
	Each form element should be paired with an error arrow element with an id equal to the form element name plus "ErrorArrow", for example;
	
		<span class="error" id="fullnameErrorArrow" style="display:none;">  &laquo</span><br />
		
	The classes work by adding any number of validation objects to each form element, then iterating through them one by one applying tests.
	
	Currently available tests are;
	
		required:		Some value must be present
		alphabetic:		Characters must be alphabetic only or space
		numeric:		Chararacters must be only 0-9 or a space
		alphanumeric:	Characters must be alphabetic or numeric or space
		email:			Must be valid email address
		hosnum:			Meets local criteria for hospital numbers (edit function according to local conditions)
		
	For select elements that must have a selection made, use the following syntax (NB use element ID rather than element name)
	
		formValidator.addRequiredSelect("principalEyeSelect");
*/


/*
 * Class FormValidator:
 */

// Global flag indicating whether cancel button pressed
var cancelButtonClicked = false;

// Constructor
function FormValidator(formName)
{
	// Properties
	this.form = document.forms[formName];
	//this.validationArray = new Array();
	
	// Methods
	this.addValidation = addValidation;
	this.addRequiredSelect = addRequiredSelect;
    this.validate = validate;
	
	// Set form onsubmit function
	this.form.onsubmit = this.validate;
}

// Finds the named element in the form, and attaches an array if one does not already exist, then adds validation to it
function addValidation(elementName, validationType)
{
	// Get element
	var element = this.form[elementName];
	
	// Create validation array if does not exist
	if (!element.validationArray)
	{
		element.validationArray = new Array();
	}
	
	// Add a new validation to array
	element.validationArray[element.validationArray.length] = new Validation(validationType);
}

// Add a custom attribute to the specified select element
function addRequiredSelect(elementId)
{
	// Get element (using this.form[elementName] causes problems eg Safari returns a nodelist)
	var element = document.getElementById(elementId);
	
	// Flag element with custom attribute
	element.selectionRequired = true;
}

// Iterates though each element, calling all validations, setting error arrows
function validate()
{
	// Set return value optimistically
	var returnValue = true;
	
	// First invalid field to correct
	var firstInvalidField = false;

	// If cancel button pressed, no need to validate
	if (!cancelButtonClicked)
	{
		// Iterate through all elements in the form
		for (var i = 0; i < this.elements.length; i++)
		{
			// Process those with a validation array attached
			if (this.elements[i].validationArray)
			{
				// String holding validation messages
				var titleString = "";
				
				// Iterate through validation objects for this element
				for (var j = 0; j < this.elements[i].validationArray.length; j++)
				{
					if (!this.elements[i].validationArray[j].check(this.elements[i].value))
					{
						// Set arrow indicating error
						var arrowId = this.elements[i].name + "ErrorArrow";
						errorArrow(arrowId, 'set');
						
						// Add cause of error to a string
						titleString = titleString + ((titleString.length > 0)?", ":"") + this.elements[i].validationArray[j].message;
						
						// Store first invalid field to put cursor in
						if (!firstInvalidField)
						{
							firstInvalidField = this.elements[i];
						}
						
						// Prevent submission
						returnValue = false;
					}	
				}
	
				// Set title attribute (tool tip) showing validation errors
				this.elements[i].title = ucfirst(titleString);
			}
			
			// Check select elements which require a selection
			if (this.elements[i].selectionRequired)
			{
				if (this.elements[i].value == "")
				{
					// Set arrow indicating error
					var arrowId = this.elements[i].name + "ErrorArrow";
					errorArrow(arrowId, 'set');
					
					// Prevent submission
					returnValue = false;
				}
			}
		}
		
		// Change message element to indicate failure and corrective action
		if (!returnValue)
		{
			document.getElementById("messages").innerHTML='<p class="error">' + lang_validation_message + '</p>';
		}
	}

	// Move focus to first element to correct
	if (firstInvalidField)
	{
		firstInvalidField.focus();
	}
	
	return returnValue;
}

// Acts on Error Arrow for an element
function errorArrow(id, action)
{
	var element = document.getElementById(id);
	
	switch(action) 
    { 
        case "set":
        {
	        element.style.display = '';
	        break;
        }
        case "clear":
        {
	        element.style.display = 'none';
	        break;
        }
        case "toggle":
        {
			if ( element.style.display != 'none' ) {
				element.style.display = 'none';
			}
			else {
				element.style.display = '';
			}
			break;
		}
	}
}

/*
 * Class Validation
 */

function Validation(type)
{
	// Properties
	this.type = type;
	this.message = "";
	
	// Methods
	this.check = check;
	this.isRequired = isRequired;
	this.isAlphabetic = isAlphabetic;
	this.isNumeric = isNumeric;
	this.isAlphaNumeric = isAlphaNumeric;
	this.isEmail = isEmail;
	this.isExactLength = isExactLength;
}

// Call validation function according to type 
function check(value)
{
	var returnValue = true;
	
	switch(this.type) 
    { 
        case "required":
        {
	        returnValue = this.isRequired(value);
	        this.message = "required field";
	        break;
        }
        case "alphabetic":
        {
	        returnValue = this.isAlphabetic(value);
	        this.message = "must be letters";
	        break;
        }
        case "numeric":
        {
	        returnValue = this.isNumeric(value);
	        this.message = "must be a number";
	        break;
        }
        case "alphanumeric":
        {
	        returnValue = this.isAlphanNumeric(value);
	        this.message = "must be letters or numbers";
	        break;
        }
        case "email":
        {
	        returnValue = this.isEmail(value);
	        this.message = "must be an email address";
	        break;
        }
        case "hosnum":
        {
	        returnValue = this.isNumeric(value);
	        this.message = "must be a number";
	        break;
        }
	}
	
	return returnValue;
}

// Checks that a value is present
function isRequired(value)
{
	return !(value==null||value=="");
}

// Checks that the value is numeric
function isAlphabetic(value)
{
	var regex = /[^A-Za-z ]/;
	return !regex.test(value);
}

// Checks that the value is numeric
function isNumeric(value)
{
	var regex = /[^0-9 ]/;
	return !regex.test(value);
}

//Checks that the value is alphanumeric
function isAlphaNumeric(value)
{
	var regex = /[^a-zA-Z0-9 ]/;
	return !regex.test(value);
}

// Checks that the value is a valid email
function isEmail(value)
{
	var regex = /^([a-zA-Z0-9])+([\.a-zA-Z0-9_-])*@([a-zA-Z0-9])+(\.[a-zA-Z0-9_-]+)+$/;
	return regex.test(value);
}

//Checks that the value is a particular length
function isExactLength(value, length)
{
	var trimmedValue = trim(value);
	return (trimmedValue.length == length);
}


