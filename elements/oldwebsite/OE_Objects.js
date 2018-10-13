/**
 * @fileOverview Contains the core classes for OpenEyes Objects
 * @author <a href="mailto:bill.aylward@mac.com">Bill Aylward</a>
 * @version 0.9
 *
 * Modification date: 5th August 2011
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
 * Defines the OE Object namespace
 * @namespace Namespace for all OE Object classes
 */
var OE = new Object();

/**
 * Abstract class for OE Interface objects
 * @class InterfaceObject
 * @property {Canvas} canvas A canvas element used to edit and display the drawing
 * @property {Context} context The 2d context of the canvas element
 * @property {Bool} mouseIsDown Flag indicating whether mouse is down in canvas
 * @property {Bool} isHotSpotClicked Flag indicating that mouse is clicked within a hotspot
 * @param {Canvas} _canvas Canvas element 
 */
OE.InterfaceObject = function(_canvas)
{
    // Function called as part of prototype assignment has no parameters passed
	if (typeof(_canvas) != 'undefined')
	{
        // Properties
        this.canvas = _canvas;
        this.context = this.canvas.getContext('2d');
        this.mouseIsDown = false;
        this.timerHandle = null;
        this.timerInterval = 1000;
        this.isAnimating = false;
        
        // Initialise canvas context transform by calling clear() method	
        this.clear();
        
        // Add event listeners (NB within the event listener 'this' refers to the canvas, NOT the drawing)
        var frame = this;
        
        // Mouse listeners
        this.canvas.addEventListener('mousedown', function(e) {
                                var offset = OE.findOffset(this);
                                var point = new OE.Point(e.pageX-offset.x,e.pageY-offset.y);
                                frame.mousedown(point);
                                 }, false);
        
        this.canvas.addEventListener('mouseup', function(e) { 
                                var offset = OE.findOffset(this);
                                var point = new OE.Point(e.pageX-offset.x,e.pageY-offset.y);
                                frame.mouseup(point); 
                                }, false);
        
        this.canvas.addEventListener('mousemove', function(e) { 
                                var offset = OE.findOffset(this);
                                var point = new OE.Point(e.pageX-offset.x,e.pageY-offset.y);
                                frame.mousemove(point); 
                                }, false);
        
        this.canvas.addEventListener('mouseout', function(e) { 
                                var offset = OE.findOffset(this);
                                var point = new OE.Point(e.pageX-offset.x,e.pageY-offset.y);
                                frame.mouseout(point); 
                                }, false);
        
        // iOS listeners
        this.canvas.addEventListener('touchstart', function(e) { 
                                var point = new OE.Point(e.targetTouches[0].pageX - this.offsetLeft,e.targetTouches[0].pageY - this.offsetTop);
                                e.preventDefault();
                                frame.mousedown(point); 
                                }, false);
        
        this.canvas.addEventListener('touchend', function(e) { 
                                var point = new OE.Point(e.targetTouches[0].pageX - this.offsetLeft,e.targetTouches[0].pageY - this.offsetTop);
                                frame.mouseup(point); 
                                }, false);
        
        this.canvas.addEventListener('touchmove', function(e) { 
                                var point = new OE.Point(e.targetTouches[0].pageX - this.offsetLeft,e.targetTouches[0].pageY - this.offsetTop);
                                frame.mousemove(point); 
                                }, false);
        
        // Stop browser stealing double click to select text (TODO Test this in browsers other than Safari)
        this.canvas.onselectstart = function () { return false; }
    }
}

/**
 * Responds to mouse down event in canvas, cycles through doodles from front to back.
 * Selected doodle is first selectable doodle to have click within boundary path.
 * Double clicking on a selected doodle promotes it to drawing mode (if is drawable)
 *
 * @event
 * @param {Point} _point Coordinates of mouse in canvas plane
 */  
OE.InterfaceObject.prototype.mousedown = function(_point)
{
	// Set flag to indicate dragging can now take place
	this.mouseIsDown = true;
    
    // Carry out hit test on hot spots
    this.isHotSpotClicked = this.drawHotSpots(_point);
    
    // Refresh canvas to get colour change
    this.repaint();
}

/**
 * Responds to mouse move event in canvas according to the drawing mode
 *
 * @event
 * @param {Point} _point coordinates of mouse in canvas plane
 */
OE.InterfaceObject.prototype.mousemove = function(_point)
{
	// Only drag if mouse already down
	if (this.mouseIsDown)
	{
        // Is mouse in hotspot
        if (this.isHotSpotClicked)
        {
            // Deal with dragging
            this.dragAction(_point);
        }
	}
}

/**
 * Responds to mouse up event in canvas
 *
 * @event
 * @param {Point} _point coordinates of mouse in canvas plane
 */  
OE.InterfaceObject.prototype.mouseup = function(_point)
{
	// Reset flags
	this.mouseIsDown = false;
    this.resetHotSpots();

    // Refresh canvas
    this.repaint();
}

/**
 * Responds to mouse out event in canvas, stopping dragging operation
 *
 * @event
 * @param {Point} _point coordinates of mouse in canvas plane
 */  
OE.InterfaceObject.prototype.mouseout = function(_point)
{
	// Reset flags
	this.mouseIsDown = false;
    this.resetHotSpots();
	
    // Refresh canvas
    this.repaint();
}

/**
 * Drags the slider pointer
 *
 * @param {Point} _point Optional parameter for use in hit testing
 */
OE.InterfaceObject.prototype.dragAction = function(_point)
{
}

/**
 * Resets each hot spot to unselected
 *
 */ 
OE.InterfaceObject.prototype.resetHotSpots = function()
{
    this.isHotSpotClicked = false;    
}

/*
 * Starts the timer 
 */
OE.InterfaceObject.prototype.startTimer = function()
{
    // Reset tick count
    this.tickCount = 0;
    
    // Set flag
    this.isAnimating = true;
    
    // Start timer
    var thisObject = this;
    this.timerHandle = setInterval(function(){thisObject.timerTick();}, this.timerInterval);
}

/*
 * Stops the timer 
 */
OE.InterfaceObject.prototype.stopTimer = function()
{ 
    // Reset flag
    this.isAnimating = false;

    // Stop timer
    clearInterval(this.timerHandle);
}

/*
 * Timer to increment if hotspot held down
 */
OE.InterfaceObject.prototype.timerTick = function()
{
    
}

/**
 * Clears canvas, and sets context transform to centre origin
 */
OE.InterfaceObject.prototype.clear = function()
{
	// Resetting a dimension attribute clears the canvas and resets the context
	this.canvas.width = this.canvas.width;
	
	// But, might not clear canvas, so do it explicitly
	this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	
	// Set context transform so origin is in the centre	
	this.context.translate(this.canvas.width/2, this.canvas.height/2);
}

/**
 * Refreshes canvas
 */
OE.InterfaceObject.prototype.repaint = function()
{
	// Clear canvas
	this.clear();
    
    // Re-draw
    this.draw();
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
OE.Range = function(_min, _max)
{
	// Properties
	this.min = _min;
	this.max = _max;
}

/**
 * Returns true if the parameter is less than the minimum of the range
 *
 * @param {Float} _num
 * @returns {Bool} True if the parameter is less than the minimum
 */
OE.Range.prototype.isBelow = function(_num)
{
	if (_num < this.min)
	{
		return true;
	}
	else
	{
		return false;
	}
}

/**
 * Returns true if the parameter is more than the maximum of the range
 *
 * @param {Float} _num
 * @return {Bool} True if the parameter is more than the maximum
 */
OE.Range.prototype.isAbove = function(_num)
{
	if (_num > this.max)
	{
		return true;
	}
	else
	{
		return false;
	}
}

/**
 * Returns true if the parameter is inclusively within the range
 *
 * @param {Float} _num
 * @returns {Bool} True if the parameter is within the range
 */
OE.Range.prototype.includes = function(_num)
{
	if (_num < this.min || _num > this.max)
	{
		return false;
	}
	else
	{
		return true;
	}
}

/**
 * Constrains a value to the limits of the range
 *
 * @param {Float} _num
 * @returns {Float} The constrained value
 */
OE.Range.prototype.constrain = function(_num)
{
	if (_num < this.min)
	{
		return this.min;
	}
	else if (_num > this.max)
	{
		return this.max;
	}
	else
	{
		return _num;
	}
}


/**
 * Represents a point in two dimensional space
 * @class Point
 * @property {Float} x The x-coordinate of the point
 * @property {Float} y The y-coordinate of the point
 * @param {Float} _x
 * @param {Float} _y
 */ 
OE.Point = function(_x, _y)
{
	// Properties
    this.x = +_x;
    this.y = +_y;
}

/**
 * Sets properties of the point using polar coordinates
 *
 * @param {Float} _r Distance from the origin
 * @param {Float} _p Angle in radians from North going clockwise
 */ 
OE.Point.prototype.setWithPolars = function(_r, _p)
{
    this.x = _r * Math.sin(_p);
    this.y = -_r * Math.cos(_p);
}

/**
 * A hotspot within a container canvas that responds to mouse clicks
 *
 * @class HotSpot
 * @property {Object} container Refers to container canvas
 * @property {Bool} isClicked True if mouse is down in area of hotspot
 * @param {Object} _object Container object
 */
OE.HotSpot = function(_object)
{
	// Properties
	this.container = _object;
    this.isClicked = false;
}


/**
 * Slider interface object
 *
 * @class Slider
 * @property {Float} minimum Minimum value
 * @property {Float} maximum Maximum value
 * @property {Float} value Slider value
 * @property {Float} canvasWidth Width of the canvas element
 * @property {Float} canvasHeight Height of the canvas element
 * @property {Float} padding Horizontal separation of slider ends and edge of canvas
 * @property {Float} halfSliderWidth Width of the slider expressed as half
 * @property {Float} halfSliderHeight Height of the slider expressed as half
 * @property {Float} radius Radius of the slider handle
 * @property {Float} tickStart Y coordinate of the start of a tick mark
 * @property {Float} tickLength Length a tick mark
 * @property {Bool} hasTickMarks If true, tick marks are shown
 * @property {Float} numberOfTickMarks Number of tick marks to be shown
 * @property {Bool} onlyStopOnTickMarks If true, slider handle can only be on a tick mark
 * @property {Range} Maximum and minimum expressed as a range
 * @param {Canvas} _canvas Canvas element
 * @param {Float} _min Minimum value
 * @param {Float} _max Maximum value
 * @param {Float} _value Initial value
 */
OE.Slider = function(_canvas, _min, _max, _value)
{
	// Call superclass constructor
	OE.InterfaceObject.call(this, _canvas);
    
    // Slider values
    this.minimum = _min;
    this.maximum = _max;
    this.value = _value;
    
    // Slider dimensions
    this.canvasWidth = 410;
    this.canvasHeight = 40;
    this.padding = 15;
    this.halfSliderWidth = (this.canvasWidth - this.padding * 2)/2;
    this.halfSliderHeight = 3;
    this.sliderRadius = 10;
    this.tickStart = 12;
    this.tickLength = 6;
    
    // Slider behaviour
    this.hasTickMarks = false;
    this.numberOfTickMarks = 21;
    this.onlyStopOnTickMarks = false;

    // Set range of slider
    this.range = new OE.Range(this.minimum, this.maximum);
	
	// Set classname
	this.className = "Slider";

    // Set dimensions
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
    
    // Create hotspots
    this.sliderHotSpot = new OE.SliderHotSpot(this);
}

/**
 * Sets superclass and constructor
 */
OE.Slider.prototype = new OE.InterfaceObject;
OE.Slider.prototype.constructor = OE.Slider;
OE.Slider.superclass = OE.InterfaceObject.prototype;

/**
 * Called by form elements to safely set value of slider
 *
 * @param {Float} _value New value of slider
 */
OE.Slider.prototype.setValue = function(_value)
{
    // Set value, constrained to allowable range
    this.value = this.range.constrain(_value);
    
    // Refresh canvas
    this.repaint();
}

/**
 * Draws slider
 */
OE.Slider.prototype.draw = function()
{
	// Get context
	var ctx = this.context;
    
    // Outline of slider
	ctx.beginPath();
    ctx.moveTo(-this.halfSliderWidth, -this.halfSliderHeight);
    ctx.lineTo(this.halfSliderWidth, -this.halfSliderHeight);
    ctx.arc(this.halfSliderWidth, 0, this.halfSliderHeight, -Math.PI/2, Math.PI/2, false);
    ctx.lineTo(-this.halfSliderWidth, this.halfSliderHeight);    
    ctx.arc(-this.halfSliderWidth, 0, this.halfSliderHeight, Math.PI/2, -Math.PI/2, false);
    
    // Tick marks
    if (this.hasTickMarks && this.numberOfTickMarks > 1)
    {
        var gap = this.halfSliderWidth * 2/(this.numberOfTickMarks - 1);
        var i;
        var x = -this.halfSliderWidth;
        for (i = 0; i < this.numberOfTickMarks; i++)
        {
            ctx.moveTo(x, -this.tickStart);
            ctx.lineTo(x, -this.tickStart - this.tickLength);
            x += gap;
        }
    }
    
    ctx.closePath();
    
    // Vertical gradient
    var topColour = "rgba(180, 180, 180, 1)";
    var bottomColour = "rgba(250, 250, 250, 1)";
    var gradient = ctx.createLinearGradient(0, -this.halfSliderHeight, 0, this.halfSliderHeight);
    gradient.addColorStop(0, topColour);
    gradient.addColorStop(1, bottomColour);
    ctx.fillStyle = gradient;
    
	// Outer line
	ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(120,120,120,0.8)";
	
	// Draw outline
    ctx.fill();
    ctx.stroke();
    
	// Draw hot spot (called without a Point parameter)
	this.drawHotSpots();
    
    // Call to optional method to notify changes in doodle parameters
    if (typeof(this.listener) != 'undefined') this.listener(parseFloat(this.value));
}

/**
 * Draws the slider pointer
 *
 * @param {Point} _point Optional parameter for use in hit testing
 */
OE.Slider.prototype.drawHotSpots = function(_point)
{
    var sliderHotSpot = this.sliderHotSpot.draw(_point);
    
    // Return result of hit test
	return sliderHotSpot;
}

/**
 * Drags the slider pointer
 *
 * @param {Point} _point Optional parameter for use in hit testing
 */
OE.Slider.prototype.dragAction = function(_point)
{
    // New position of slider in canvas
    var x = _point.x - (this.canvasWidth - this.halfSliderWidth * 2)/2;

    // Adjust value
    var newValue = this.minimum + (this.maximum - this.minimum) * x/(2 * this.halfSliderWidth);
    this.value = this.range.constrain(newValue);

    // Refresh canvas
    this.repaint();
}

/**
 * Slider hotspot
 *
 * @class HotSpot
 * @property {Object} container Refers to container canvas
 * @property {Bool} isClicked True if mouse is down in area of hotspot
 * @param {Object} _object Container object
 */
OE.SliderHotSpot = function(_object)
{
	// Call superclass constructor
	OE.HotSpot.call(this, _object);
	
	// Set classname
	this.className = "SliderHotSpot";
}

/**
 * Sets superclass and constructor
 */
OE.SliderHotSpot.prototype = new OE.HotSpot;
OE.SliderHotSpot.prototype.constructor = OE.SliderHotSpot;
OE.SliderHotSpot.superclass = OE.HotSpot.prototype;

/**
 * Draws hotspot
 *
 * @param {Point} _point
 * @returns {Bool} True if the parameter is within the range
 */
OE.SliderHotSpot.prototype.draw = function(_point)
{
	// Get context
	var ctx = this.container.context;
    var r = this.container.sliderRadius;
    
    // Only stop on tick marks
    if (this.container.hasTickMarks && this.container.onlyStopOnTickMarks && this.container.numberOfTickMarks > 1)
    {
        // Gap between tick marks
        var gap = (this.container.maximum - this.container.minimum)/(this.container.numberOfTickMarks - 1);
        
        // Round to nearest tick mark
        this.container.value = Math.round((this.container.value - this.container.minimum)/gap) * gap + this.container.minimum;
    }
    
    // Construct slider hotspot
 	ctx.beginPath();
    
    // Position of slider in canvas
    var x = ((this.container.value - this.container.minimum)/(this.container.maximum - this.container.minimum)) * (2 * this.container.halfSliderWidth) - this.container.halfSliderWidth;
    
    // Draw a pointed slider if using tick marks 
    if (this.container.hasTickMarks)
    {
        var shiftUp = 1;        // Move pointer up above midline
        var sq = 0.8;           // Squeeze pointer horizontally to have same area as round slider
        ctx.moveTo(x, -r - shiftUp);
        ctx.lineTo(x - r * sq, -r/2 - shiftUp);
        ctx.lineTo(x - r * sq, r - shiftUp);
        ctx.lineTo(x + r * sq, r - shiftUp);
        ctx.lineTo(x + r * sq, -r/2 - shiftUp);
    }
    // Otherwise a circle
    else
    {
        ctx.arc(x, 0, r, 0, 2 * Math.PI, false);
    }
    
    ctx.closePath();
    
    // Perform hit test if a Point parameter is passed
	if (typeof(_point) != 'undefined')
    {
        var hitTest = false;
        
        // Workaround for Mozilla bug 405300 https://bugzilla.mozilla.org/show_bug.cgi?id=405300
		if (OE.isFirefox())
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
    // Otherwise draw hotspot
    else
    {
        // Colors for gradient
        if (this.mouseIsDown && this.isHotSpotClicked)
        {
            var bottomColour = "rgba(130, 205, 205, 1)";
            var topColour = "rgba(170, 225, 225, 1)";
        }
        else
        {
            var bottomColour = "rgba(160, 235, 235, 1)";
            var topColour = "rgba(200, 255, 255, 1)";
        }
        
        // Vertical gradient
        var gradient = ctx.createLinearGradient(0, -this.container.halfSliderHeight, 0, this.container.halfSliderHeight);
        gradient.addColorStop(0, topColour);
        gradient.addColorStop(1, bottomColour);
        ctx.fillStyle = gradient;
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();
    }
    
    // Return value for hit test
    return this.isClicked;
}

/**
 * Stepper interface object
 *
 * @class Stepper
 * @property {Float} minimum Minimum value
 * @property {Float} maximum Maximum value
 * @property {Float} value Stepper value
 * @property {Float} canvasWidth Width of the canvas element
 * @property {Float} canvasHeight Height of the canvas element
 * @property {Float} padding Horizontal separation of Stepper ends and edge of canvas
 * @property {Float} stepperWidth Width of the Stepper
 * @property {Float} stepperHeight Height of the Stepper
 * @property {Bool} autoRepeat True if stepper should autorepeat if held down
 * @property {Int} timerInterval Interval between autoincrements in milliseconds;
 * @property {Int} ticksBeforeIncrementing Number of ticks before autoincrementing starts
 * @property {Range} Maximum and minimum expressed as a range
 * @param {Canvas} _canvas Canvas element
 * @param {Float} _min Minimum value
 * @param {Float} _max Maximum value
 * @param {Float} _value Initial value
 */
OE.Stepper = function(_canvas, _min, _max, _value)
{
	// Call superclass constructor
	OE.InterfaceObject.call(this, _canvas);
    
    // Stepper values
    this.minimum = _min;
    this.maximum = _max;
    this.value = _value;
    this.increment = 1;
    
    // Stepper dimensions
    this.canvasHeight = 34;
    this.canvasWidth = this.canvasHeight/2;
    this.padding = 2;
    this.stepperWidth = (this.canvasWidth - this.padding * 2);
    this.stepperHeight = (this.canvasHeight - this.padding * 2);
    
    // Stepper behaviour
    this.autoRepeat = false;
    this.timerInterval = 100;
    this.ticksBeforeIncrementing = 4;
    
    // Set range of Stepper
    this.range = new OE.Range(this.minimum, this.maximum);
    
    // Iternal variables
    this.tickCount;
	
	// Set classname
	this.className = "Stepper";
    
    // Set dimensions
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
    
    // Create hotspots
    this.topHotSpot = new OE.StepperHotSpot(this, "Up");
    this.bottomHotSpot = new OE.StepperHotSpot(this, "Down");
}

/**
 * Sets superclass and constructor
 */
OE.Stepper.prototype = new OE.InterfaceObject;
OE.Stepper.prototype.constructor = OE.Stepper;
OE.Stepper.superclass = OE.InterfaceObject.prototype;

/**
 * Called by form elements to safely set value of Stepper
 *
 * @param {Float} _value New value of Stepper
 */
OE.Stepper.prototype.setValue = function(_value)
{
    // Set value, constrained to allowable range
    this.value = this.range.constrain(parseFloat(_value));
}

/**
 * Draws Stepper
 */
OE.Stepper.prototype.draw = function()
{
	// Draw hot spots (called without a Point parameter)
	this.drawHotSpots();
}

/**
 * Draws the Stepper pointer
 *
 * @param {Point} _point Optional parameter for use in hit testing
 * @return {Bool} True if positive hit test
 */
OE.Stepper.prototype.drawHotSpots = function(_point)
{
    var topHit = this.topHotSpot.draw(_point);
    var bottomHit = this.bottomHotSpot.draw(_point);
    
    // Take appropriate action according to which hotspot is clicked
    if (typeof(_point) != 'undefined')
    {
        // Start timer
        this.startTimer();
        
        // Increment value
        this.incrementValue();
    }
    
    // Return result of hit test
	return topHit && bottomHit;
}

/**
 * Resets each hot spot to unselected
 */ 
OE.Stepper.prototype.resetHotSpots = function()
{
    this.isHotSpotClicked = false;
    this.topHotSpot.isClicked = false;
    this.bottomHotSpot.isClicked = false;
    this.stopTimer();
}

/*
 * Timer to increment if hotspot held down
 */
OE.Stepper.prototype.timerTick = function()
{
    if (this.autoRepeat)
    {
        this.tickCount++;
        
        // Delay before starting
        if (this.tickCount > this.ticksBeforeIncrementing)
        {
            this.incrementValue();
        }
    }
}

/**
 * Increments value of stepper
 */
OE.Stepper.prototype.incrementValue = function()
{
    // Alter values according to which hotspot is clicked
    if (this.topHotSpot.isClicked)
    {
        this.value += this.increment;
    }
    if (this.bottomHotSpot.isClicked)
    {
        this.value -= this.increment;            
    }
    
    // Set value, constrained to allowable range
    this.value = this.range.constrain(this.value);
    
    // Call to optional method to notify changes in doodle parameters
    if (typeof(this.listener) != 'undefined') this.listener(parseFloat(this.value));
}

/**
 * Stepper hotspot
 *
 * @class HotSpot
 * @property {Object} container Refers to container canvas
 * @property {Bool} isClicked True if mouse is down in area of hotspot
 * @property {String} direction Direction of stepper arrow "Up" or "Down"
 * @param {Object} _object Container object
 * @param {String} _direction Direction of stepper arrow
 */
OE.StepperHotSpot = function(_object, _direction)
{
	// Call superclass constructor
	OE.HotSpot.call(this, _object);
	
	// Set classname
	this.className = "StepperHotSpot";
    
    // Direction
    this.direction = _direction;
}

/**
 * Sets superclass and constructor
 */
OE.StepperHotSpot.prototype = new OE.HotSpot;
OE.StepperHotSpot.prototype.constructor = OE.StepperHotSpot;
OE.StepperHotSpot.superclass = OE.HotSpot.prototype;

/**
 * Draws hotspot
 *
 * @param {Point} _point
 * @returns {Bool} True if the parameter is within the range
 */
OE.StepperHotSpot.prototype.draw = function(_point)
{
	// Get context
	var ctx = this.container.context;
    var hw = this.container.stepperWidth/2;
    var hh = this.container.stepperHeight/2;
    
    // Settings for up or down arrow
    var clockwise = true;
    if (this.direction == "Up")
    {
        hh = -hh;
        clockwise = false;
    }
    
    // Boundary path
	ctx.beginPath();
    ctx.moveTo(-hw, 0);
    ctx.lineTo(-hw, hh/2);
    ctx.arc(0, hh/2, hw, -Math.PI, 0, clockwise);
    ctx.lineTo(hw, 0);    
    ctx.closePath();
	
    // Perform hit test if a Point paramter is passed
	if (typeof(_point) != 'undefined')
    {
        // Workaround for Mozilla bug 405300 https://bugzilla.mozilla.org/show_bug.cgi?id=405300
		if (OE.isFirefox())
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
    // Otherwise draw hotspot
    else
    {
        // Colors for gradient
        if (this.container.mouseIsDown && this.isClicked)
        {
            var bottomColour = "rgba(205, 205, 205, 1)";
            var topColour = "rgba(225, 225, 225, 1)";
        }
        else
        {
            var bottomColour = "rgba(255, 255, 255, 1)";
            var topColour = "rgba(225, 225, 225, 1)";
        }
        
        // Vertical gradient
        var gradient = ctx.createLinearGradient(0, hh, 0, 0);
        gradient.addColorStop(0, topColour);
        gradient.addColorStop(1, bottomColour);
        ctx.fillStyle = gradient;
        
        // Outer line
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(120,120,120,0.8)";
        
        // Draw it
        ctx.fill();
        ctx.stroke();
        
        // Arrow
        ctx.beginPath();
        ctx.moveTo(-hw/2,hh/3);
        ctx.lineTo(0, 2/3 * hh);
        ctx.lineTo(hw/2, hh/3);
        ctx.lineTo(-hw/2, hh/3);
        
        // Fill arrow
        ctx.fillStyle = "rgba(120,120,120,0.8)";
        ctx.fill();
    }
    
    // Return value for hit test
    return this.isClicked;
}

/**
 * DisclosureTriangle interface object
 *
 * @class DisclosureTriangle
 * @property {Float} minimum Minimum value
 * @property {Float} maximum Maximum value
 * @property {Float} value DisclosureTriangle value
 * @property {Float} canvasWidth Width of the canvas element
 * @property {Float} canvasHeight Height of the canvas element
 * @property {Float} padding Horizontal separation of DisclosureTriangle ends and edge of canvas
 * @property {Float} DisclosureTriangleWidth Width of the DisclosureTriangle
 * @property {Float} DisclosureTriangleHeight Height of the DisclosureTriangle
 * @property {Bool} autoRepeat True if DisclosureTriangle should autorepeat if held down
 * @property {Int} timerInterval Interval between autoincrements in milliseconds;
 * @property {Int} ticksBeforeIncrementing Number of ticks before autoincrementing starts
 * @property {Range} Maximum and minimum expressed as a range
 * @param {Canvas} _canvas Canvas element
 * @param {Float} _min Minimum value
 * @param {Float} _max Maximum value
 * @param {Float} _value Initial value
 */
OE.DisclosureTriangle = function(_canvas)
{
	// Call superclass constructor
	OE.InterfaceObject.call(this, _canvas);
    
    // DisclosureTriangle values
    this.isClosed = true;
    
    // DisclosureTriangle dimensions
    this.canvasWidth = 20;
    this.canvasHeight = 20;
    this.padding = 1;
    this.DisclosureTriangleBase = (this.canvasWidth - this.padding * 2);
    
    // DisclosureTriangle behaviour
    this.timerInterval = 10;
    
    // Iternal variables
    this.tickCount;
	
	// Set classname
	this.className = "DisclosureTriangle";
    
    // Set dimensions
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
    
    // Create hotspots
    this.triangleHotSpot = new OE.DisclosureTriangleHotSpot(this);
}

/**
 * Sets superclass and constructor
 */
OE.DisclosureTriangle.prototype = new OE.InterfaceObject;
OE.DisclosureTriangle.prototype.constructor = OE.DisclosureTriangle;
OE.DisclosureTriangle.superclass = OE.InterfaceObject.prototype;

/**
 * Draws DisclosureTriangle
 */
OE.DisclosureTriangle.prototype.draw = function()
{
	// Draw hot spots (called without a Point parameter)
	this.drawHotSpots();
}

/**
 * Draws the DisclosureTriangle triangle
 *
 * @param {Point} _point Optional parameter for use in hit testing
 * @return {Bool} True if positive hit test
 */
OE.DisclosureTriangle.prototype.drawHotSpots = function(_point)
{
    var triangleHit = this.triangleHotSpot.draw(_point);
    
    // Take appropriate action according to which hotspot is clicked
    if (typeof(_point) != 'undefined' && triangleHit && !this.isAnimating)
    {
        // Toggle isClosed
        this.isClosed = !this.isClosed;
        
        // Start timer
        this.startTimer();
    }
    
    // Return result of hit test
	return triangleHit;
}

/**
 * Drags the slider pointer
 *
 * @param {Point} _point Optional parameter for use in hit testing
 */
OE.DisclosureTriangle.prototype.dragAction = function(_point)
{
}

/**
 * Resets each hot spot to unselected
 */ 
OE.DisclosureTriangle.prototype.resetHotSpots = function()
{
    this.isHotSpotClicked = false;
    this.triangleHotSpot.isClicked = false;
}

/*
 * Animate disclosure triangle
 */
OE.DisclosureTriangle.prototype.timerTick = function()
{
    if (!this.isClosed)
    {
        this.triangleHotSpot.rotation += this.triangleHotSpot.rotationIncrement;
        if (this.triangleHotSpot.rotation >= Math.PI/2)
        {
            this.triangleHotSpot.rotation = Math.PI/2;
            this.stopTimer();
        }
    }
    else
    {
        this.triangleHotSpot.rotation -= this.triangleHotSpot.rotationIncrement;
        if (this.triangleHotSpot.rotation <= 0)
        {
            this.triangleHotSpot.rotation = 0;
            this.stopTimer();
        }
    }
    
    // Refresh
    this.repaint();
}

/*
 * Starts the timer 
 */
OE.DisclosureTriangle.prototype.startTimer = function()
{   
	// Call method in superclass
	OE.DisclosureTriangle.superclass.startTimer.call(this);
}

/*
 * Stops the timer 
 */
OE.DisclosureTriangle.prototype.stopTimer = function()
{   
	// Call method in superclass
	OE.DisclosureTriangle.superclass.stopTimer.call(this);
    
    // Call to optional method to notify change
    if (typeof(this.listener) != 'undefined') this.listener(this.isClosed);
}

/**
 * DisclosureTriangle hotspot
 *
 * @class HotSpot
 * @property {Object} container Refers to container canvas
 * @property {Bool} isClicked True if mouse is down in area of hotspot
 * @param {Object} _object Container object
 */
OE.DisclosureTriangleHotSpot = function(_object)
{
	// Call superclass constructor
	OE.HotSpot.call(this, _object);
	
	// Set classname
	this.className = "DisclosureTriangleHotSpot";
    
    // Rotation
    this.rotation = 0;
    this.rotationIncrement = Math.PI/45;
    
}

/**
 * Sets superclass and constructor
 */
OE.DisclosureTriangleHotSpot.prototype = new OE.HotSpot;
OE.DisclosureTriangleHotSpot.prototype.constructor = OE.DisclosureTriangleHotSpot;
OE.DisclosureTriangleHotSpot.superclass = OE.HotSpot.prototype;

/**
 * Draws hotspot
 *
 * @param {Point} _point
 * @returns {Bool} True if the parameter is within the range
 */
OE.DisclosureTriangleHotSpot.prototype.draw = function(_point)
{
	// Get context
	var ctx = this.container.context;
    
    // Rotate triangle
    ctx.rotate(this.rotation);
    
    // Calculate measurements
    var base = this.container.DisclosureTriangleBase;
    var a = base/2;
    var b = base/(2 * Math.sqrt(3));
    var h = Math.sqrt(3) * base/2;
    var c = h - b;
    
    // Boundary path
	ctx.beginPath();
    ctx.moveTo(-b, -a);
    ctx.lineTo(-b, +a);
    ctx.lineTo(c, 0);
    ctx.lineTo(-b, -a);
    ctx.closePath();
	
    // Perform hit test if a Point paramter is passed
	if (typeof(_point) != 'undefined')
    {
        // Workaround for Mozilla bug 405300 https://bugzilla.mozilla.org/show_bug.cgi?id=405300
		if (OE.isFirefox())
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
    // Otherwise draw hotspot
    else
    {
        // Colors for gradient
        if (this.container.mouseIsDown && this.isClicked)
        {
            var bottomColour = "#999999";
            var middleColour = "#dddddd";
            var topColour = "#eeeeee";
        }
        else
        {
            var bottomColour = "#aaaaaa";
            var middleColour = "#eeeeee";
            var topColour = "#ffffff";
        }
        
        // Vertical gradient, from top regardless of context of rotation
        var pointTop = new OE.Point(0, 0);
        var pointBot = new OE.Point(0, 0);
        pointTop.setWithPolars(a, -this.rotation);
        pointBot.setWithPolars(a, Math.PI - this.rotation);
        
        // Create gradient colour
        var gradient = ctx.createLinearGradient(pointTop.x, pointTop.y, pointBot.x, pointBot.y);
        gradient.addColorStop(0, topColour);
        gradient.addColorStop(0.5, middleColour);
        gradient.addColorStop(1, bottomColour);
        
        ctx.fillStyle = gradient;
        
        // Outer line
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(120,120,120,0.8)";
        
        // Draw it
        ctx.fill();
        ctx.stroke();
    }
    
    // Return value for hit test
    return this.isClicked;
}


/**
 * BeveledButtons interface object
 *
 * A block of beveled buttons
 *
 * @class BeveledButtons
 * @property {Float} Number of buttons
 * @property {Bool} isVertical If true, buttons are arranged vertically, otherwise horizontally
 * @property {Bool} isSticky If true, buttons stay down until next click
 * @property {Bool} isRadio If true, buttons behave like radio buttons (ignores isSticky setting)
 * @property {Bool} isIlluminated If true, bevel is replaced by dark green indicator light
 * @property {Float} padding Distance from edges of button block to edge of canvas
 * @property {Float} BeveledButtonsWidth Width of the BeveledButtons
 * @property {Float} BeveledButtonsHeight Height of the BeveledButtons
 * @property {Float} canvasWidth Width of the canvas element
 * @property {Float} canvasHeight Height of the canvas element
 * @param {Canvas} _canvas Canvas element
 * @param {Number} _number Number of buttons in block
 * @param {Bool} _isVertical True if buttons to be arranged vertically
 */
OE.BeveledButtons = function(_canvas, _number, _isVertical)
{
	// Call superclass constructor
	OE.InterfaceObject.call(this, _canvas);

    // Set parameters
    if (typeof(_number) != "undefined") this.numberOfButtons = _number;
    else this.numberOfButtons = 1;
    if (typeof(_isVertical) != "undefined") this.isVertical = _isVertical;
    else this.isVertical = false;
    
    // Properties
    this.isSticky = false;
    this.isRadio = false;
    this.isIlluminated = false;
    
    // BeveledButtons dimensions
    this.padding = 10;
    this.BeveledButtonsWidth = 60;
    this.BeveledButtonsHeight = 30;
    
    // Set dimensions
    if (this.isVertical)
    {
        this.canvasWidth = this.BeveledButtonsWidth + this.padding * 2;
        this.canvasHeight = this.BeveledButtonsHeight * this.numberOfButtons + this.padding * 2;
    }
    else
    {
        this.canvasWidth = this.BeveledButtonsWidth * this.numberOfButtons + this.padding * 2;
        this.canvasHeight = this.BeveledButtonsHeight + this.padding * 2;        
    }
	
	// Set classname
	this.className = "BeveledButtons";
    
    // Set dimensions
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
    
    // Create hotspots
    this.buttonHotSpotArray = new Array();
    var i;
    for (i = 0; i < this.numberOfButtons; i++)
    {
        if (this.isVertical)
        {
            var centreX = 0;
            var centreY = -(this.BeveledButtonsHeight * this.numberOfButtons)/2 + this.BeveledButtonsHeight/2 + i * this.BeveledButtonsHeight;
        }
        else
        {
            var centreX = -(this.BeveledButtonsWidth * this.numberOfButtons)/2 + this.BeveledButtonsWidth/2 + i * this.BeveledButtonsWidth;
            var centreY = 0;            
        }
        
        var text = "Text";
        if (i == 0) text = 'One';
        if (i == 1) text = 'Two';
        if (i == 2) text = 'Three';
        
        this.buttonHotSpotArray[i] = new OE.BeveledButtonsHotSpot(this, centreX, centreY, text);
    }
}

/**
 * Sets superclass and constructor
 */
OE.BeveledButtons.prototype = new OE.InterfaceObject;
OE.BeveledButtons.prototype.constructor = OE.BeveledButtons;
OE.BeveledButtons.superclass = OE.InterfaceObject.prototype;
 
/**
 * Draws BeveledButtons
 */
OE.BeveledButtons.prototype.draw = function()
{
	// Draw hot spots (called without a Point parameter)
	this.drawHotSpots();
}

/**
 * Draws the BeveledButtons
 *
 * @param {Point} _point Optional parameter for use in hit testing
 * @return {Bool} True if positive hit test
 */
OE.BeveledButtons.prototype.drawHotSpots = function(_point)
{
    var anyButtonHit = false;
    
    var i;
    for (i = 0; i < this.numberOfButtons; i++)
    {
        var buttonHit = this.buttonHotSpotArray[i].draw(_point);
        anyButtonHit = anyButtonHit && buttonHit;

        // Take appropriate action according to which hotspot is clicked
        if (typeof(_point) != 'undefined')
        {
            if (buttonHit)
            {
                // Call to optional method to notify changes in doodle parameters
                if (typeof(this.listener) != 'undefined') this.listener(i);
                
                // Put button down
                if (!this.isSticky)
                {
                    this.buttonHotSpotArray[i].isDown = true;
                }
                // Toggle button
                else
                {
                    this.buttonHotSpotArray[i].isDown = !this.buttonHotSpotArray[i].isDown;
                }
            }
            else
            {
                // If a radio button, cancel the non-clicked ones others
                if (this.isRadio) this.buttonHotSpotArray[i].isDown = false;            
            }
        }
    }
    
    // Return result of hit test
	return anyButtonHit;
}

/**
 * Resets each hot spot to unselected
 */ 
OE.BeveledButtons.prototype.resetHotSpots = function()
{
    this.isHotSpotClicked = false;
    var i;
    for (i = 0; i < this.numberOfButtons; i++)
    {
        this.buttonHotSpotArray[i].isClicked = false;
        if (!this.isRadio && !this.isSticky)
        {
            this.buttonHotSpotArray[i].isDown = false;
        }
    }
}

/**
 * BeveledButtons hotspot
 *
 * @class HotSpot
 * @property {Object} container Refers to container canvas
 * @property {Bool} isClicked True if mouse is down in area of hotspot
 * @param {Object} _object Container object
 */
OE.BeveledButtonsHotSpot = function(_object, _centreX, _centreY, _lableText)
{
	// Call superclass constructor
	OE.HotSpot.call(this, _object);
	
	// Set classname
	this.className = "BeveledButtonsHotSpot";
    
    // Properties
    this.centreX =  _centreX;
    this.centreY = _centreY;
    this.lableText = _lableText;
    this.isDown = false;
    
    // Lable font
    this.lableFont = "12px sans-serif";
}

/**
 * Sets superclass and constructor
 */
OE.BeveledButtonsHotSpot.prototype = new OE.HotSpot;
OE.BeveledButtonsHotSpot.prototype.constructor = OE.BeveledButtonsHotSpot;
OE.BeveledButtonsHotSpot.superclass = OE.HotSpot.prototype;

/**
 * Draws hotspot
 *
 * @param {Point} _point
 * @returns {Bool} True if the parameter is within the range
 */
OE.BeveledButtonsHotSpot.prototype.draw = function(_point)
{
	// Get context
	var ctx = this.container.context;
    
    // Calculate measurements
    var w = this.container.BeveledButtonsWidth;
    var h = this.container.BeveledButtonsHeight;
    var x = this.centreX - w/2;
    var y = this.centreY - h/2;
    
    // Size of bevel
    var bs = h/7;
    
    // Boundary path
	ctx.beginPath();
    OE.roundedRect(ctx, x, y, w, h, 5);
    ctx.closePath();
	
    // Perform hit test if a Point paramter is passed
	if (typeof(_point) != 'undefined')
    {
        // Workaround for Mozilla bug 405300 https://bugzilla.mozilla.org/show_bug.cgi?id=405300
		if (OE.isFirefox())
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
    // Otherwise draw hotspot
    else
    {
        // Illuminated
        if (this.container.isIlluminated)
        {
            if (this.isDown)
            {
                ctx.fillStyle = "rgba(0,255,0,1)";
            }
            else
            {
                ctx.fillStyle = "rgba(0,140,0,1)";
            }
        }
        // Gradient
        else
        {
            if (this.isDown)
            {
                var bottomColour = "#eee";
                var topColour = "#999";
            }
            else
            {
                var bottomColour = "#999";
                var topColour = "#eee";
            }
            
            // Diagnonal gradient, from top
            var skew = -1;
            var pointTop = new OE.Point(this.centreX + skew, y);
            var pointBot = new OE.Point(this.centreX - skew, y + h);
            
            // Create gradient colour
            var fillStyle = ctx.createLinearGradient(pointTop.x, pointTop.y, pointBot.x, pointBot.y);
            fillStyle.addColorStop(0, topColour);
            fillStyle.addColorStop(1, bottomColour);
        }
        
        // Set colour of bevel
        ctx.fillStyle = fillStyle;

        // Outer line
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(120,120,120,0.8)";
        
        // Draw bevel
        ctx.fill();
        ctx.stroke();
        
        // Draw button
        ctx.beginPath();
        OE.roundedRect(ctx, x + bs, y + bs, w - 2 * bs, h - 2 * bs, 5);
        ctx.closePath();
        ctx.fillStyle = "rgba(220,220,220,1)";
        ctx.fill();
        
        // Draw text
        ctx.font = this.lableFont;
        ctx.fillStyle = "rgba(100,100,100,1)";
        this.lableWidth = ctx.measureText(this.lableText).width;
        this.lableHeight = 8;  //***TODO*** make this more general
        ctx.fillText(this.lableText, this.centreX - this.lableWidth/2, this.centreY + this.lableHeight/2, w);
    }
    
    // Return value for hit test
    return this.isClicked;
}

/**
 * Draws a rounded rectangle using the current state of the canvas. 
 * If you omit the last three params, it will draw a rectangle 
 * outline with a 5 pixel border radius 
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate 
 * @param {Number} width The width of the rectangle 
 * @param {Number} height The height of the rectangle
 * @param {Number} radius The corner radius. Defaults to 5;
 */
OE.roundedRect = function(ctx, x, y, width, height, radius)
{
    if (typeof radius === "undefined")
    {
        radius = 5;
    }
    
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);        
}

/*
 * Chris Raettig's function for getting accurate mouse position in all browsers
 *
 * @param {Object} obj Object to get offset for, usually canvas object
 * @return {Object} x and y values of offset
 */
OE.findOffset = function(obj)
{
    var curleft = curtop = 0;
    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
        return { x: curleft, y: curtop };
    }
}

/*
 * Detects Firefox browser
 *
 * @return {Bool} True if browser is Firefox
 */
OE.isFirefox = function()
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
