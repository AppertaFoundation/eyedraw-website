// Change the options in the _select
function updateSelect(_type, _startId, _endId)
{
	// ID of select
	var id = _type + 'Selector';
	
	// Get reference to the select
	var sel = document.getElementById(id);
	
	// Remove all options
	sel.options.length = 0;
	
	// Populate select according to state of no preservative flag and type
	sel.options[sel.options.length] = new Option("-- Select " + _type + " --","");
	for (var i = _startId; i <= _endId; i++)
	{
		sel.options[sel.options.length] = new Option(this.commonDrugSet[i].name, this.commonDrugSet[i].id);
	}		
}

// Delete row
function deleteRow(obj) {
	// Get index of row
	var rowIndex = obj.parentNode.parentNode.sectionRowIndex;
	
	// Delete it
	document.getElementById('presTable').deleteRow(rowIndex);
	
	// Delete corresponding drawing object and controller
	drawingArray.splice(rowIndex, 1);
	controllerArray.splice(rowIndex, 1);
	
	// Reset drug set
	for (var i in this.commonDrugSet) {
		var drug = this.commonDrugSet[i];
		
		if (drug.id == obj.parentNode.parentNode.getAttribute('drugid')) {
			drug.inTable = false;
		}
	}
	
	// Decrement row counter
	rowCount--;
}

// Add row
function addRow(_selectId, _value) {
	// Get index of selected drug
	var index = _value
	
	// Get reference to table
	var table = document.getElementById('presTable');
	
	if (!this.commonDrugSet[index].inTable) {
	
		// Index of next row is equal to number of rows
		var nextRowIndex = table.tBodies[0].rows.length;
		
		// Add new row
		var newRow = table.tBodies[0].insertRow(nextRowIndex);
		
		// Store drug id as an attribute of the row (to assist row deleting)
		newRow.setAttribute('drugid', this.commonDrugSet[index].id);
		
		// Name
		var paraNode = document.createElement("p");
		paraNode.setAttribute('class','tableText');
		var textNode = document.createTextNode(this.commonDrugSet[index].name);
		paraNode.appendChild(textNode);
		var cell0 = newRow.insertCell(0);
		cell0.appendChild(paraNode);
		cell0.setAttribute('width', '18%')
		
		// Route
		var cell1 = newRow.insertCell(1);
		var routes = ['IV', 'Eye'];
		cell1.appendChild(tableSelect(routes, this.commonDrugSet[index].route, 'route'));
		cell1.setAttribute('width', '8%')
		
		// Duration
		var cell2 = newRow.insertCell(2);
		var duration = document.createElement("canvas");
		duration.setAttribute('width', 600);
		duration.setAttribute('height', 30);
		duration.setAttribute('id', 'duration' + this.commonDrugSet[index].id); // ID of canvas relates to id of drug
		duration.setAttribute('class', 'durationCanvas');
		cell2.appendChild(duration);
		cell2.setAttribute('width', '68%')
		canvasInit('duration' + this.commonDrugSet[index].id, this.commonDrugSet[index].unit, this.commonDrugSet[index].type);
		
		// Delete aref
		var cell3 = newRow.insertCell(3);
		var deleteButton = document.createElement('a');
		deleteButton.setAttribute('onClick','deleteRow(this);');
		deleteButton.innerText = "Delete";
		cell3.appendChild(deleteButton);
		cell3.setAttribute('width', '6%')
		
		// Mark drug as having been used
		this.commonDrugSet[index].inTable = true;
				
		// Augment row counter
		rowCount++;	
	}
	else {
		//this.drawingArray[this.commonDrugSet[index].index].addDoodle('AgentDuration');
		
		// Iterate through drawing array looking for matching drawing and adding new doodle
		for (var i in this.drawingArray) {
			if (this.drawingArray[i].IDSuffix == 'duration' + this.commonDrugSet[index].id) {
				this.drawingArray[i].addDoodle('AgentDuration', {originX: -200, unit:this.commonDrugSet[index].unit, type:this.commonDrugSet[index].type});
			}
		}
	}
	
	// Reset select index
	document.getElementById(_selectId).selectedIndex = 0;
}

// Construct and return select for array
function tableSelect(optionArray, selectedValue, name)
{
	var tableSelect = document.createElement('select');
	tableSelect.setAttribute('name', name + rowCount);
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

// Initialises canvas
function canvasInit(_canvasId, _unit, _type)
{
    // Get reference to the drawingEdit canvas
    var canvasEdit = document.getElementById(_canvasId);

    // Create a drawingEdit (Set to scale on width (otherwise compresses doodle)
    var drawing = new ED.Drawing(canvasEdit, ED.eye.Right, _canvasId, true, {graphicsPath:'../../graphics/', scaleOn:'Width'});

    // Instantiate a controller object
    var controller = new eyeDrawController(drawing);

    // Store drawing object and controller in array
    drawingArray.push(drawing);
    controllerArray.push(drawing);
    
    // Initialise drawing
    drawing.init();
    
    // Set focus to canvasEdit element
    canvasEdit.focus();

    // Controller class
    function eyeDrawController(_drawing)
    {
        this.drawing = _drawing;
        
        // Flag to ensure focus is given to dose box even after redraw
        this.drugFocus = false;
        
        // Specify call back function
        this.callBack = callBack;
        
        // Register for notifications with drawing object
        this.drawing.registerForNotifications(this, 'callBack', []);
        
        // Method called for notification
        function callBack(_messageArray)
        {
            //console.log("Notified for event: " + _messageArray['eventName']);

            switch (_messageArray['eventName'])
            {
                // Eye draw image files all loaded
                case 'ready':
                    // Deselect doodles in all drawings
                	for (var i in drawingArray) {
						drawingArray[i].deselectDoodles();
					}
                    selectedDoodle = this.drawing.addDoodle('AgentDuration', {originX: -200, unit:_unit, type:_type});
                    //selectedDoodle.unit = _unit;
                    break;
                    
                case 'mouseout':
                	//this.drawing.deselectDoodles();
                	break;
                	
                case 'doodleAdded':
                	selectedDoodle = _messageArray['selectedDoodle'];
					flipDoseBox('', true);
					this.drugFocus = true;
                	break;
                	
                case 'doodleSelected':
                 	// Deselect doodles in other drawings
                	for (var i in drawingArray) {
                							
						if (drawingArray[i].IDSuffix != _messageArray['selectedDoodle'].drawing.IDSuffix) {

							drawingArray[i].deselectDoodles();
						}
					}
                	selectedDoodle = _messageArray['selectedDoodle'];
                	flipDoseBox(selectedDoodle.dose, true);
                	this.drugFocus = true;
                	break;
                	
                case 'doodleDeselected':
                	selectedDoodle = null;
					flipDoseBox('', false);
					this.drugFocus = false;
                	break;
                	
                case 'drawingRepainted':
                	//console.log('repainted');
                	if (this.drugFocus) document.getElementById('doseBox').focus();
                	break;
            }
        }
        
        function flipDoseBox(_dose, _show) {
        	document.getElementById('doseBox').value = _dose;
	        if (_show) {
	        	document.getElementById('doseBox').style.display = 'block';
	        	document.getElementById('doseBox').focus();
	        }
	        else
	        {
	        	document.getElementById('doseBox').blur();
	        	document.getElementById('doseBox').style.display = 'none'        
	        }
        }
    }
}

function doseKeyUp(_event) {
	if (selectedDoodle) {
		selectedDoodle.dose = document.getElementById('doseBox').value;
		selectedDoodle.drawing.repaint();
	}
}

