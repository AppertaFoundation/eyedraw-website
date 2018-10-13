/**
 * @fileOverview Exophthalmometry element
 * @author <a href="mailto:bill.aylward@mac.com">Bill Aylward</a>
 * @version 0.9
 *
 * Modification date: 10th July 2011
 * Copyright 2011 OpenEyes
 * 
 * This file is part of OpenEyes.
 * 
 * OpenEyes is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * OpenEyes is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with OpenEyes.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Defines the Exophthalmometry namespace
 * @namespace Namespace for all Exophthalmometry classes
 */
var EX = new Object();


/**
 * Default parameter values
 */
EX.Defaults = 
{
    ExoMin:10,            // Minimum value of Hertel exophthalmometry
    ExoMax:30,            // Maximum value of Hertel exophthalmometry
    ExoAvg:20,            // Average value of Hertel exophthalmometry
    TransverseMin:70,     // Minimum value of transverse distance between orbital margins
    TransverseMax:120,    // Maximum value of transverse distance between orbital margins
    TransverseAvg:100     // Average value of transverse distance between orbital margins
}

/**
 * Draw function mode (Canvas pointInPath function requires a path)
 */
EX.drawFunctionMode = 
{
	Draw:0,
	HitTest:1
}

/**
 * A Drawing consists of one canvas element displaying one or more doodles;
 * Doodles are drawn in the 'doodle plane' consisting of a 1001 pixel square grid -500 to 500) with central origin, and negative Y upwards;
 * Affine transforms are used to convert points in the doodle plane to the canvas plane, the plane of the canvas element;
 * Each doodle contains additional transforms to handle individual position, rotation, and scale.
 * 
 * @class Drawing
 * @property {Canvas} canvas A canvas element used to edit or display the drawing
 * @property {String} idPrefix String prefix to identify HTML elements related to this drawing
 * @property {Mode} mode The current mouse dragging mode
 * @property {Context} context The 2d context of the canvas element
 * @property {Point} lastMousePosition Last position of mouse in canvas coordinates
 * @property {Image} image Optional background image
 * @property {Int} doubleClickMilliSeconds Duration of double click
 * @param {Canvas} _canvas Canvas element 
 * @param {String} _idPrefix String prefix to identify HTML elements related to this drawing
 * @param {String} _mode Edit or Display mode
 */
EX.Drawing = function(_canvas, _idPrefix, _mode)
{
	// Properties
	this.canvas = _canvas;
	this.idPrefix = _idPrefix;
	this.mode = _mode;
    
    // Set exophthalmos range
    this.exoRange = new EX.Range(EX.Defaults.ExoMin,EX.Defaults.ExoMax);
    this.transverseRange = new EX.Range(EX.Defaults.TransverseMin, EX.Defaults.TransverseMax);

    // Get reference to HTML elements
	this.rightExophInput = document.getElementById(this.idPrefix + '_rightExoph');
	this.transverseInput = document.getElementById(this.idPrefix + '_transverse');
	this.leftExophInput = document.getElementById(this.idPrefix + '_leftExoph');

	if (this.mode == "Edit")
	{
	    // Set average values
	    this.rightExoph = EX.Defaults.ExoAvg;
	    this.transverse = EX.Defaults.TransverseAvg;
	    this.leftExoph = EX.Defaults.ExoAvg;
	    
	    // Set values of input elements
	    this.setInputValues();
    }
    else
    {
    	// Set values from HTML
    	this.getInputValues();
    }
	
    // Get canvas context
	this.context = this.canvas.getContext('2d');
    
    // Flag and last mouse position
	this.mouseDown = false;
	this.lastMousePosition = new EX.Point(0, 0);
	
	// Initialise canvas context by calling clear() method	
	this.clear();
	
    // Create right eye
    this.rightEye = new EX.EyeHor(this, -this.transverse/2, this.rightExoph);
    
    // Create left eye
    this.leftEye = new EX.EyeHor(this, this.transverse/2, this.leftExoph);
}

/**
 * Updates a value
 */ 
EX.Drawing.prototype.update = function(_name, _value)
{
    // Enforce numeric value
    var value = +_value;

    switch (_name)
    {
        case "rightExoph":
            value = isNaN(value)?EX.Defaults.ExoAvg:value;
            this.rightExoph = this.exoRange.clamp(value);
            this.rightEye.originY = this.rightExoph;
            break;
        case "transverse":
            value = isNaN(value)?EX.Defaults.TransverseAvg:value;
            this.transverse = this.transverseRange.clamp(value);
            this.rightEye.originX = -this.transverse/2;
            this.leftEye.originX = this.transverse/2;
            break;
        case "leftExoph":
            value = isNaN(value)?EX.Defaults.ExoAvg:value;
            this.leftExoph = this.exoRange.clamp(value);
            this.leftEye.originY = this.leftExoph;
            break;
        default:
            break;            
    }
    
    // Change input values and refresh canvas
    this.setInputValues();
    this.repaint();
}

/**
 * Sets HTML values
 */
EX.Drawing.prototype.setInputValues = function()
{
	this.rightExophInput.value = this.rightExoph;
	this.transverseInput.value = this.transverse;
	this.leftExophInput.value = this.leftExoph;
}

/**
 * Gets HTML values
 */
EX.Drawing.prototype.getInputValues = function()
{
	this.rightExoph = +this.rightExophInput.innerHTML;
	this.transverse = +this.transverseInput.innerHTML;
	this.leftExoph = +this.leftExophInput.innerHTML;
}

/**
 * Draws the content
 */ 
EX.Drawing.prototype.draw = function()
{
    // Create orbit
    var ctx = this.context;

    // Draw average indicators
    var length = 30;
    ctx.beginPath();
    ctx.moveTo(-EX.Defaults.TransverseAvg/2, EX.Defaults.ExoAvg - length); 
    ctx.lineTo(-EX.Defaults.TransverseAvg/2, EX.Defaults.ExoAvg + length);
    ctx.moveTo(-EX.Defaults.TransverseAvg/2 - length, EX.Defaults.ExoAvg);    
    ctx.lineTo(-EX.Defaults.TransverseAvg/2 + length, EX.Defaults.ExoAvg);
    ctx.moveTo(EX.Defaults.TransverseAvg/2, EX.Defaults.ExoAvg - length); 
    ctx.lineTo(EX.Defaults.TransverseAvg/2, EX.Defaults.ExoAvg + length);
    ctx.moveTo(EX.Defaults.TransverseAvg/2 - length, EX.Defaults.ExoAvg);    
    ctx.lineTo(EX.Defaults.TransverseAvg/2 + length, EX.Defaults.ExoAvg);
    ctx.lineWidth = 1;
	ctx.strokeStyle = "gray";
    ctx.stroke();
    
    // Start path
	ctx.beginPath();

    // Scaling factor
    var s = 0.2;

    // Calculate width of orbits from tranverse value
    var w = this.transverse/s;
    
    // Outline of orbits
    ctx.moveTo( -w * s, 100 * s);
    ctx.bezierCurveTo( -400 * s, 0 * s, -300 * s, -200 * s, -200 * s, -200 * s);
    ctx.bezierCurveTo( -50 * s, -200 * s, -100 * s, 200 * s, 0 * s, 200 * s);
    ctx.bezierCurveTo( 100 * s, 200 * s, 50 * s, -200 * s, 200 * s, -200 * s);
    ctx.bezierCurveTo( 300 * s, -200 * s, 400 * s, 0 * s, w * s, 100 * s);

    // Set line attributes
	ctx.lineWidth = 2;
	ctx.strokeStyle = "blue";
    
    // Draw it
    ctx.stroke();
    
    // Draw eyes
    this.rightEye.draw();
    this.leftEye.draw();
}

/**
 * Responds to mouse down event in canvas
 *
 * @event
 * @param {Point} _point Coordinates of mouse in canvas plane
 */  
EX.Drawing.prototype.mousedown = function(_point)
{    
	// Set flag to indicate dragging can now take place
	this.mouseDown = true;
    
    // Store mouse position
    this.lastMousePosition = _point;
    
    // Perform hit tests
    this.rightEye.draw(_point);
    this.leftEye.draw(_point);
}

/**
 * Responds to mouse move event in canvas according to the drawing mode
 *
 * @event
 * @param {Point} _point coordinates of mouse in canvas plane
 */
EX.Drawing.prototype.mousemove = function(_point)
{
    var newOriginX;
    var newOriginY;
    
	// Only drag if mouse already down
	if (this.mouseDown)
	{
		// Drag right eye
		if (this.rightEye.isClicked)
		{
            // Clamp and set originX for both eyes
            newOriginX = this.rightEye.originX + _point.x - this.lastMousePosition.x;
            this.transverse = this.transverseRange.clamp(Math.abs(newOriginX * 2));
            this.rightEye.originX = -this.transverse/2;
            this.leftEye.originX = this.transverse/2;
            
            // Clamp and set originY for right eye
            newOriginY = this.rightEye.originY + _point.y - this.lastMousePosition.y;
            this.rightEye.originY = this.exoRange.clamp(newOriginY); 
            this.rightExoph = this.rightEye.originY;
		}

        // Drag left eye
		if (this.leftEye.isClicked)
		{
            // Clamp and set originX for both eyes
            newOriginX = this.leftEye.originX + _point.x - this.lastMousePosition.x;
            this.transverse = this.transverseRange.clamp(Math.abs(newOriginX * 2));
            this.rightEye.originX = -this.transverse/2;
            this.leftEye.originX = this.transverse/2;
            
            // Clamp and set originY for right eye
            newOriginY = this.leftEye.originY + _point.y - this.lastMousePosition.y;
            this.leftEye.originY = this.exoRange.clamp(newOriginY); 
            this.leftExoph = this.leftEye.originY;
		}
        
        // Update input values
        this.setInputValues();
        
        // Refresh drawing
        this.repaint();				

		// Store mouse position
		this.lastMousePosition = _point;
	}
}

/**
 * Responds to mouse up event in canvas
 *
 * @event
 * @param {Point} _point coordinates of mouse in canvas plane
 */  
EX.Drawing.prototype.mouseup = function(_point)
{
	// Reset flag
	this.mouseDown = false;
}

/**
 * Responds to mouse out event in canvas, stopping dragging operation
 *
 * @event
 * @param {Point} _point coordinates of mouse in canvas plane
 */  
EX.Drawing.prototype.mouseout = function(_point)
{
	// Reset flag
	this.mouseDown = false;
}

/**
 * Clears canvas and sets context
 */
EX.Drawing.prototype.clear = function()
{
	// Resetting a dimension attribute should clear the canvas and resets the context
	this.canvas.width = this.canvas.width;
	
	// But, might not clear canvas, so do it explicitly
	this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Set transform to centre drawing components
    this.context.translate(this.canvas.width/2, this.canvas.height/2);
}

/**
 * Clears canvas and draws all doodles
 */
EX.Drawing.prototype.repaint = function()
{
	// Clear canvas
	this.clear();
    
	// Redraw canvas
	this.draw();
}

EX.EyeHor = function(_drawing, _originX, _originY)
{
    // Parameters
    this.drawing = _drawing;
    this.originX = _originX;
    this.originY = _originY;
    this.isClicked = false;
    this.radius = 20;
}

/**
 * Draws doodle or performs a hit test if a Point parameter is passed
 *
 * @param {Point} _point Optional point in canvas plane, passed if performing hit test
 */
EX.EyeHor.prototype.draw = function(_point)
{
    // Determine function mode
	if (typeof(_point) != 'undefined')
	{
		this.drawFunctionMode = EX.drawFunctionMode.HitTest;
	}
	else
	{
		this.drawFunctionMode = EX.drawFunctionMode.Draw;
	}
    
    // Get context
	var ctx = this.drawing.context;
    
    // Create boundary path
	ctx.beginPath();
	
	// Draw outside boundary of eye
    var r2 = this.radius/1.72;
    ctx.arc(this.originX, this.originY, this.radius, Math.PI * 1/3, Math.PI * 2/3, true);
    ctx.arc(this.originX, this.originY + r2, r2, Math.PI * 0.8, Math.PI * 0.15, true);
    
	// Close path
	//ctx.closePath();
	
	// Set line attributes
	ctx.lineWidth = 2;
	ctx.fillStyle = "green";
	ctx.strokeStyle = "blue";
    
	// HitTest
	if (this.drawFunctionMode == EX.drawFunctionMode.HitTest)
	{
		// Workaround for Mozilla bug 405300 https://bugzilla.mozilla.org/show_bug.cgi?id=405300
		if (isFirefox())
		{
			ctx.save();
			ctx.setTransform( 1, 0, 0, 1, 0, 0 );
			this.isClicked = ctx.isPointInPath(_point.x, _point.y);
			ctx.restore();
		}
		else
		{
			this.isClicked = ctx.isPointInPath(_point.x, _point.y);
		}
	}
	// Drawing
	else
	{
		ctx.stroke();
	}

	// Draw non boundary stuff here
	if (this.drawFunctionMode == EX.drawFunctionMode.Draw)
	{
		ctx.beginPath();
		ctx.arc(this.originX, this.originY, 3, 0, Math.PI * 2, true);
		ctx.lineWidth = 1;
		ctx.stroke();
	}
	
	// Return value indicating successful hit test
	return this.isClicked;
}

/**
 * Represents a point in two dimensional space
 *
 * @class Point
 * @property {Float} x The x-coordinate of the point
 * @property {Float} y The y-coordinate of the point
 * @param {Float} _x
 * @param {Float} _y
 */ 
EX.Point = function(_x, _y)
{
	// Properties
    this.x = +_x;
    this.y = +_y;
}

/**
 * Represents a range of numerical values
 *
 * @class Range
 * @property {Float} min Minimum value
 * @property {Float} max Maximum value
 * @param {Float} _min
 * @param {Float} _max
 */
EX.Range = function(_min, _max)
{
	// Properties
	this.min = _min;
	this.max = _max;
}

/**
 * Tests whether a value is within the range
 *
 * @param {Float} _value
 * @returns {Bool} True if value is within range
 */
EX.Range.prototype.isInRange = function(_value)
{
    return (_value <= this.max && _value >= this.min);
}

/**
 * Clamps value to within the range
 *
 * @param {Float} _value
 * @returns {Float} Unchanged if within range, otherwise set to min or max
 */
EX.Range.prototype.clamp = function(_value)
{
    if (_value > this.max) return this.max;
    if (_value < this.min) return this.min;
    return _value;
}
