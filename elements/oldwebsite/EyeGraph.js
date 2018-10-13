/**
 * @fileOverview Contains the core classes for EyeGraph
 * @author <a href="mailto:bill.aylward@mac.com">Bill Aylward</a>
 * @version 0.1
 *
 * Modification date: 20th February 2012
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
 * Defines the EyeGraph namespace
 * @namespace Namespace for all EyeGraph classes
 */
var EG = new Object();

/*
 * Chris Raettig's function for getting accurate mouse position in all browsers
 *
 * @param {Object} obj Object to get offset for, usually canvas object
 * @returns {Object} x and y values of offset
 */
EG.findOffset = function(obj)
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
 * Returns true if browser is firefox
 *
 * @returns {Bool} True is browser is firefox
 */
EG.isFirefox = function()
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

EG.Config = {
    hasShadow: true       
}

/**
 * A Graph consists of a canvas element displaying one or more series;
 *
 * @class Graph
 * @property {Canvas} canvas A canvas element used to edit and display the drawing
 * @property {Array} seriesArray An array or series objects
 * @property {Float} firstX Value of beginning of x-axis
 * @property {Float} lastX Value of end of x-axis
 * @property {Float} firstY Value of beginning of y-axis
 * @property {Float} lastY Value of end of y-axis
 * @property {Float} paddingTop Distance from top edge of canvas to end of y-axis
 * @property {Float} paddingBottom Distance from bottom edge of canvas to start of y-axis
 * @property {Float} paddingLeft Distance from left edge of canvas to start of x-axis
 * @property {Float} paddingRight Distance from right edge of canvas to end of x-axis
 * @property {Float} scaleX Scaling transform for x axis
 * @property {Float} scaleY Scaling transform for y axis
 * @property {Float} translateX X value of translation transform
 * @property {Float} translateY Y value of translation transform 
 * @property {Float} axisXIntersect Value of y where x-axis is displayed
 * @property {Array} axisXArray Array of x-axis pairs (value and label)
 * @property {Float} axisXLabelPadding Distance in pixels between axis and lable point
 * @property {Float} axisYIntersect Value of x where y-axis is displayed
 * @property {Array} axisYArray Array of y-axis pairs (value and label)
 * @property {Float} axisYLabelPadding Distance in pixels between axis and lable point
 * @property {Float} tickMarkLength Length of axis tickmarks in pixels
 * @property {Bool} hasShadow True if graph has a drop shadow
 * @property {Bool} showMessage True if message is being shown
 * @property {Float} labelFontSize Font size in points
 * @property {String} labelFontFamily Font family
 * @property {String} labelFont Font string
 * @property {Context} context The graph canvas elemen's graphic context
 */
EG.Graph = function(_canvas)
{
	// Properties
	this.canvas = _canvas;
    this.seriesArray = new Array();
    this.firstX = -25;
    this.lastX = 575;
    this.firstY = 0;
    this.lastY = +400;
    this.paddingTop = 50;
    this.paddingBottom = 50;
    this.paddingLeft = 50;
    this.paddingRight = 50;
    
    // Scale x and y axis (We are not using a scale transform in order to avoid changes in aspect ratio of lines and fonts
    this.scaleX = (this.canvas.width - this.paddingLeft - this.paddingRight)/(this.lastX - this.firstX);
    this.scaleY = -(this.canvas.height - this.paddingTop - this.paddingBottom)/(this.lastY - this.firstY);
    
    // Translation
    this.translateX = -this.firstX * this.scaleX + this.paddingLeft;
    this.translateY = -this.firstY * this.scaleY - this.paddingBottom + this.canvas.height;
    
    // Axis information
    this.axisXIntersect = -10;
    this.axisXArray = [];
    this.axisXLabelPadding = 24;
    this.axisYIntersect = -10;
    this.axisYArray = [];
    this.axisYLabelPadding = 10;
    this.tickMarkLength = 8;
    
    // Decoration
    this.hasShadow = EG.Config.hasShadow;
    
    // Behaviour (true when positive hit test with a point)
    this.showMessage = false;
    
    // Lable font
    this.labelFontSize = 14;
    this.labelFontFamily = "sans-serif"
    this.labelFont = this.labelFontSize + "px " + this.labelFontFamily;
    
    // Get graphics context for this canvas
    this.context = this.canvas.getContext('2d');
    
    // Add event listeners (NB within the event listener 'this' refers to the canvas, NOT the drawing instance)
    if (true)
    {
        // Create reference to the graph 'this'
        var graph = this;
        
        // Mouse down listener
        this.canvas.addEventListener('mousedown', function(e) {
                                     var offset = EG.findOffset(this);
                                     graph.mousedown(e.pageX-offset.x,e.pageY-offset.y);
                                     }, false);
        // Mouse move listener
        this.canvas.addEventListener('mousemove', function(e) {
                                     var offset = EG.findOffset(this);
                                     graph.mousemove(e.pageX-offset.x,e.pageY-offset.y);
                                     }, false);
    }
}

/**
 * Sets shadow parameters
 */
EG.Graph.prototype.setShadow = function()
{
    // Shortcut to context
    var ctx = this.context;
    
    // set parameters
    ctx.shadowColor = "darkgray";
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    ctx.shadowBlur = 6;
}

/**
 * Responds to mouse down event in the canvas
 *
 * @event
 * @param {Float} _x X coordinates of mouse in canvas plane
 * @param {Float} _y Y coordinates of mouse in canvas plane
 */  
EG.Graph.prototype.mousedown = function(_x, _y)
{
    // Iterate through each series    
    for (var i in this.seriesArray)
	{
        // Shortcut to series
        var series = this.seriesArray[i];
        
        // Iterate through points checking for mouse hit        
        for (var j in series.pointsArray)
        {
            // Coordinates of the point
            var x = this.scaleX * series.pointsArray[j][0];
            var y = this.scaleY * series.pointsArray[j][1];
            
            // Check to see if mouse is in path
            if (series.addPathForPoint(x, y, _x, _y)) console.log("Mousedown for point " + j + " in series " + i);
        }
    }
}

/**
 * Responds to a mouse move event in canvas. Searches series for a matching point
 *
 * @event
 * @param {Float} _x x coordinates of mouse in canvas plane
 * @param {Float} _y y coordinates of mouse in canvas plane
 */  
EG.Graph.prototype.mousemove = function(_x, _y)
{
    // Flag for successful hit test and indices of point
    var hitTest = false;
    var seriesIndex = 0;
    var pointsIndex = 0;
    
    // Iterate through each series
    for (var i in this.seriesArray)
	{
        // Shortcut to series
        var series = this.seriesArray[i];
        
        // Iterate through points checking for mouse hit
        for (var j in series.pointsArray)
        {
            // Get coordinates in canvas plane
            var x = this.scaleX * series.pointsArray[j][0];
            var y = this.scaleY * series.pointsArray[j][1];
            
            // Check to see if mouse is in path
            if (series.addPathForPoint(x, y, _x, _y))
            {
                hitTest = true;
                seriesIndex = i;
                pointsIndex = j;
            }
        }
    }
    
    // Mouse is over a point
    if (hitTest && !this.showMessage)
    {
        // Set message flag
        this.showMessage = true
        
        // Change shape of pointer to alert user
        this.canvas.style.cursor = 'pointer';
        
        // Redraw graph
        this.draw();
        
        // Show message for the selected point
        if (typeof(this.seriesArray[seriesIndex].pointsArray[pointsIndex][3]) != 'undefined')
        {
            var x = this.seriesArray[seriesIndex].pointsArray[pointsIndex][0];
            var y = this.seriesArray[seriesIndex].pointsArray[pointsIndex][1];
            this.placeMessage(x, y, this.seriesArray[seriesIndex].pointsArray[pointsIndex][3]);
        }

    }
    // Mouse moved away from point
    else if (!hitTest && this.showMessage)
    {
        // Reset message flag
        this.showMessage = false;
        
        // Change shape of pointer back to previous
        this.canvas.style.cursor = 'auto';
        
        // Redraw graph
        this.draw();
    }
    
}

/**
 * Adds a series to graph
 *
 * @param {String} _className Classname of series
 * @param {Array} _data Array of data points (x, y pairs)
 * @param {Array} _params Array of optional parameters
 */
EG.Graph.prototype.addSeries = function(_className, _data, _params)
{
    // Check that class exists
    if (EG.hasOwnProperty(_className))
    {
        // Create new doodle of class and add it to array
        var newSeries = new EG[_className](this, _data, _params);
        this.seriesArray.push(newSeries);
    }
}

/**
 * Draws the graph. Reset;s the canvas, draws axes and all series
 */
EG.Graph.prototype.draw = function()
{
    // Clear canvas;
    this.clear();
    
    // Translate from graph plane (defined by first and last X and Y) to canvas plane. NB flips Y axis so that positive values are up
    this.context.translate(this.translateX, this.translateY);
    
    // Set shadow
    if (this.hasShadow) this.setShadow();
    
    // Draw Axes
    this.drawAxisX();
    this.drawAxisY();
	    
    // Iterate through all points of all series
    for (var i in this.seriesArray)
	{
        var series = this.seriesArray[i];
        series.draw();
    }
}

/**
 * Places text on the graph. The relationship of the text to the passed point depends on the orientation
 * and the settings of the alignment parameter.
 * 
 * @param {Float} _x X-coordinate of origin of text
 * @param {Float} _y Y-coordinate of origin of text
 * @param {String} _text String containing the text
 * @param {Array} _params Optional parameters: orientation, alignment, colour
 */
EG.Graph.prototype.placeText = function(_x, _y, _text, _params)
{
    // Default values for parameters
    var defaults = {
        orientation : 'horizontal',
		alignment : 'center',
		colour : 'gray'
	}
    
    // Set defaults
	for(var i in defaults)
    {
		if (typeof _params[i] == 'undefined') _params[i] = defaults[i];
	}

    // Padding to centre text when in vertical orientation
    var fontVerticalOffset = 4;
    
    // Shortcut to context
    var ctx = this.context;
    
    // Transform coordinates
    x = this.scaleX * _x;
    y = this.scaleY * _y;
    
    // Temporary marker to visualise alignment of text
    /*
    ctx.beginPath()
    ctx.moveTo(x - 20, y);
    ctx.lineTo(x + 20, y);
    ctx.moveTo(x, y - 20);
    ctx.lineTo(x, y + 20);
    ctx.lineWidth = 1;
    ctx.stroke();
    */
    
    // Save context
    ctx.save();
    
    // Set font attributes
    ctx.font = this.labelFont;
    ctx.textAlign = _params.alignment;
    ctx.fillStyle = _params.colour;
    
    // Adjust position according to orientation
    if (_params.orientation == 'vertical')
    {
        x += fontVerticalOffset;
    }
    else
    {
        y += fontVerticalOffset;          
    }
    
    // Use transform to write text at given coordinates
    ctx.translate(x, y);
    
    // Rotate if flag set
    if (_params.orientation == 'vertical')
    {
        ctx.rotate(-Math.PI/2);
    }
    
    // Write text
    ctx.fillText(_text, 0, 0);
    
    // Restore saved context
    ctx.restore();    
}

/**
 * Places a message on the graph
 * 
 * @param {Float} _x X-coordinate of origin of text
 * @param {Float} _y Y-coordinate of origin of text
 * @param {String} _text String containing the text
 * @param {Array} _params Optional parameters: orientation, alignment, colour
 */
EG.Graph.prototype.placeMessage = function(_x, _y, _text)
{        
    // Shortcut to context
    var ctx = this.context;
    
    // Transform coordinates
    x = this.scaleX * _x;
    y = this.scaleY * _y;
    
    // Displace down and right a little
    x += 14;
    y += 14;
    
    // Text formating
    var numberOfLines = 0;
    var maximumWidth = 0;
    var lineHeight = 15;
    
    // Split string into array
    var stringArray = _text.split('\n');
    
    // Iterate through getting maximum width
    for (var i in stringArray)
    {
        // Count number of lines
        numberOfLines++;
        
        // Get width and calculate maximum
        var width = this.context.measureText(stringArray[i]).width * this.scaleX;
        if (width > maximumWidth) maximumWidth = width;
    }
    
    // Save context
    ctx.save();

    // Draw a yellow square with drop shadow as the message background
    ctx.beginPath();
    ctx.rect(x, y, maximumWidth, lineHeight + numberOfLines * lineHeight);
    ctx.fillStyle = "yellow";
    this.setShadow();
    ctx.fill();
    
    // Set font attributes
    ctx.font = this.labelFont;
    ctx.textAlign = "start";
    ctx.fillStyle = "gray";
    ctx.shadowColor = "transparent";

    // Start point
    ctx.translate(x + 10, y + 5);
    
    // Write string
    for (var i in stringArray)
    {
        // Use transform to write text at given coordinates
        ctx.translate(0, lineHeight);
        
        // Write text
        ctx.fillText(stringArray[i], 0, 0);
    }
    
    // Restore saved context
    ctx.restore();    
}

/**
 * Draws the x axis
 */
EG.Graph.prototype.drawAxisX = function()
{
    if (this.axisXArray.length > 0)
    {
        // Graphics context
        var ctx = this.context;
        
        // Scale shortcuts
        var sx = this.scaleX;
        var sy = this.scaleY;
        
        // Path for axis and tick marks
        ctx.beginPath();
        
        // Add axis line
        ctx.moveTo(sx * this.axisXArray[0][0], sy * this.axisXIntersect);
        ctx.lineTo(sx * this.axisXArray[this.axisXArray.length - 1][0], sy * this.axisXIntersect);
        
        // Iterate through series adding tick marks to path
        for (var i in this.axisXArray)
        {
            // Add tick mark
            ctx.moveTo(sx * this.axisXArray[i][0], sy * this.axisXIntersect);
            ctx.lineTo(sx * this.axisXArray[i][0], sy * this.axisXIntersect + this.tickMarkLength);
        }
        
        // Draw axis and tick marks
        ctx.stroke();
        
        // Iterate through series adding labels
        for (var i in this.axisXArray)
        {
            // Text centred on tick mark and displaced downwards by padding value
            this.placeText(this.axisXArray[i][0], this.axisXIntersect - this.axisXLabelPadding, this.axisXArray[i][1], {});
        }
    }
}

/**
 * Draws the y axis
 */
EG.Graph.prototype.drawAxisY = function()
{
    if (this.axisXArray.length > 0)
    {
        // Graphics context
        var ctx = this.context;
        
        // Scale shortcuts
        var sx = this.scaleX;
        var sy = this.scaleY;

        // Path for axis and tick marks
        ctx.beginPath();
        
        // Add axis line
        ctx.moveTo(sx * this.axisYIntersect, sy * this.axisYArray[0][0]);
        ctx.lineTo(sx * this.axisYIntersect, sy * this.axisYArray[this.axisYArray.length - 1][0]);
        
        // Iterate through series adding tick marks to path
        for (var i in this.axisYArray)
        {
            // Add tick mark
            ctx.moveTo(sx * this.axisYIntersect, sy * this.axisYArray[i][0]);
            ctx.lineTo(sx * this.axisYIntersect - this.tickMarkLength, sy * this.axisYArray[i][0]);
        }
        
        // Draw axis and tick marks
        ctx.stroke();
        
        // Iterate through series adding labels
        for (var i in this.axisYArray)
        {
            // Text centred on tick mark and displaced leftwards by padding value
            this.placeText(this.axisYIntersect - this.axisYLabelPadding, this.axisYArray[i][0], this.axisYArray[i][1], {alignment: "right"});
        }
    }
}

/**
 * Clears canvas and sets context transform
 */
EG.Graph.prototype.clear = function()
{
	// Resetting a dimension attribute clears the canvas and resets the context
	this.canvas.width = this.canvas.width;
	
	// But, might not clear canvas, so do it explicitly
	this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
}


/**
 * A series of x and y pairs representing values to plot
 *
 * @class Series
 * @property {Graph} graph Reference to the enclosing Graph object
 * @property {Array} pointsArray Array of points
 * @param {Graph} _graph
 * @param {Array} _array
 */ 
EG.Series = function(_graph, _array)
{
	// Properties
    this.graph = _graph;
    this.pointsArray = _array;
}

EG.Series.prototype.draw = function()
{
}

/**
 * Adds a line to the current path
 *
 * @param {Float} _x1 X-coordinate of origin
 * @param {Float} _y1 Y-coordinate of origin
 * @param {Float} _x2 X-coordinate of origin
 * @param {Float} _y2 Y-coordinate of origin
 * @param {Float} _d Distance to remove from each end
 */
EG.Series.prototype.addLine = function(_x1, _y1, _x2, _y2, _d)
{
    var ctx = this.graph.context;
    
    // Length of line
    var length = Math.sqrt((_x2 - _x1) * (_x2 - _x1) + (_y2 - _y1) * (_y2 - _y1));
    
    // Proportion to shave off
    var p = _d/length;
    
    // Amount to shave off each axis
    var dx = p * (_x2 - _x1);
    var dy = p * (_y2 - _y1);
    
    // Add line
    ctx.moveTo(_x1 + dx, _y1 + dy);
    ctx.lineTo(_x2 - dx, _y2 - dy);   
}

/**
 * Points joined by a line
 *
 * @class Series
 * @property {Graph} graph Reference to the enclosing Graph object
 * @property {Array} pointsArray Array of points
 * @param {Graph} _graph
 * @param {Array} _array
 * @param {Array} _params Associative array of optional parameters for subclass
 */ 
EG.LineGraph = function(_graph, _array, _params)
{
	// Call superclass constructor
	EG.Series.call(this, _graph, _array);

    // Colour
    if (typeof _params.colour != 'undefined') this.colour = _params.colour;
    else this.colour = "gray";
}

/**
 * Sets superclass and constructor
 */
EG.LineGraph.prototype = new EG.Series;
EG.LineGraph.prototype.constructor = EG.LineGraph;
EG.LineGraph.superclass = EG.Series.prototype;

/**
 * Draws the series
 */
EG.LineGraph.prototype.draw = function()
{
    // Shortcut to context
    var ctx = this.graph.context;
    
    // Scale shortcuts
    var sx = this.graph.scaleX;
    var sy = this.graph.scaleY;
    
    // Entire graph is a single path
    ctx.beginPath(); 
    
    // Add lines to path
    for (var i = 0; i < this.pointsArray.length; i++)
    {
        var thisX = sx * this.pointsArray[i][0];
        var thisY = sy * this.pointsArray[i][1];
        
        // Draw line
        if (i > 0)
        {
            this.addLine(lastX, lastY, thisX, thisY, 5);
        }
        
        // Save values for next line
        var lastX = thisX;
        var lastY = thisY;
    }
    
    // Add points to path
    for (var i = 0; i < this.pointsArray.length; i++)
    {
        var x = sx * this.pointsArray[i][0];
        var y = sy * this.pointsArray[i][1];
        
        // Draw point
        this.addPathForPoint(x, y);
    }

    // Set line attributes
	ctx.lineWidth = 4;
	ctx.strokeStyle = this.colour;
    
    // Draw line and points
    ctx.stroke();

    // Set lable attributes
    var labelPaddingBottom = 20;
    
    // Write optional point labels
    for (var i = 0; i < this.pointsArray.length; i++)
    {
        // Check for existence of optional label and write it
        if (typeof(this.pointsArray[i][2]) != 'undefined' && this.pointsArray[i][2].length > 0)
        {
            // Write text centred on tick mark
            this.graph.placeText(this.pointsArray[i][0], this.pointsArray[i][1] + labelPaddingBottom, this.pointsArray[i][2], {colour: this.colour});
        }
    }
}

/**
 * Adds a shape for the passed point for this series type (eg circle, bar, pie etc)
 * Also carries out hit test for mouse detection
 *
 * @param {Float} _x X coordinate in canvas plane
 * @param {Float} _y Y coordinate in canvas plane
 * @returns {Bool} True if mouse position within path 
 */
EG.LineGraph.prototype.addPathForPoint = function(_x, _y, _mx, _my)
{
    var returnValue = false;

    // Shortcut to context
    var ctx = this.graph.context;
    
    // Radius of point
    var radius = 5;
    
    // Check for passed mouse position arguments
    if(_mx)
    {
        // Create path and check for mouse hit
        ctx.beginPath();
    }
    
    // Add path for point
    ctx.moveTo(_x + radius, _y);
    ctx.arc(_x, _y, radius, 0, Math.PI * 2, true);

    // Check if mouse position is witin path
    if(_mx)
    {
        // Ensure path is closed
        ctx.closePath();
        
        // Perfrom hit test
        if (ctx.isPointInPath(_mx, _my))
        {
            returnValue = true;           
        }
    }
    
    return returnValue;
}

/**
 * Bar chart
 *
 * @class Series
 * @property {Graph} graph Reference to the enclosing Graph object
 * @property {Array} pointsArray Array of points
 * @param {Graph} _graph
 * @param {Array} _array
 * @param {Array} _params Associative array of optional parameters for subclass
 */ 
EG.BarChart = function(_graph, _array, _params)
{
	// Call superclass constructor
	EG.Series.call(this, _graph, _array);
    
    // Flag indicating orientation of bars
    this.isVertical = (_params.type == 'vertical')?true:false;
}

/**
 * Sets superclass and constructor
 */
EG.BarChart.prototype = new EG.Series;
EG.BarChart.prototype.constructor = EG.BarChart;
EG.BarChart.superclass = EG.Series.prototype;

/**
 * Draws the series
 */
EG.BarChart.prototype.draw = function()
{
    // Shortcut to context
    var ctx = this.graph.context;
    
    // Proportion of gap between bars occupied by bar
    var wp = 0.6;
    
    // Scale shortcuts
    var sx = this.graph.scaleX;
    var sy = this.graph.scaleY;
    
    // Calculate width as a function of the total spread
    if (this.isVertical)
    {
        var width = wp * (sx * (this.pointsArray[this.pointsArray.length - 1][0] - this.pointsArray[0][0])/(this.pointsArray.length - 1));
    }
    else
    {
        var width = wp * (sy * (this.pointsArray[this.pointsArray.length - 1][1] - this.pointsArray[0][1])/(this.pointsArray.length - 1));
    }
    
    // Start path
    ctx.beginPath(); 
    
    // Iterate through points creating bars
    for (var i = 0; i < this.pointsArray.length; i++)
    {
        var x = sx * this.pointsArray[i][0];
        var y = sy * this.pointsArray[i][1];
        
        // Draw bar
        if (this.isVertical)
        {
            ctx.rect(x - width/2, sy * this.graph.firstY, width, y - sy * this.graph.firstY);
        }
        else
        {
            ctx.rect(0, y - width/2, x, width);
        }
    }
    
    // Set attributes
	ctx.fillStyle = "green";
	ctx.strokeStyle = "blue";
    
    // Draw graph
    ctx.fill();
    ctx.stroke();
}

/**
 * Time Points indicated by arrow
 *
 * @class Series
 * @property {Graph} graph Reference to the enclosing Graph object
 * @property {Array} pointsArray Array of points
 * @param {Graph} _graph
 * @param {Array} _array
 * @param {Array} _params Associative array of optional parameters for subclass
 */ 
EG.TimePoints = function(_graph, _array, _params)
{
	// Call superclass constructor
	EG.Series.call(this, _graph, _array);
}

/**
 * Sets superclass and constructor
 */
EG.TimePoints.prototype = new EG.Series;
EG.TimePoints.prototype.constructor = EG.TimePoints;
EG.TimePoints.superclass = EG.Series.prototype;

/**
 * Draws the series
 */
EG.TimePoints.prototype.draw = function()
{
    // Vertical offset
    var offsetY = 38;
    var labelIsVertical = true;
    
    // Shortcut to context    
    var ctx = this.graph.context;

    // Scale shortcuts
    var sx = this.graph.scaleX;
    var sy = this.graph.scaleY;
    
    // Start a new graphics path
    ctx.beginPath(); 
    
    // Iterate through array drawing arrows
    for (var i = 0; i < this.pointsArray.length; i++)
    {
        // Draw point
        var x = sx * this.pointsArray[i][0];
        var y = sy * this.pointsArray[i][1];
        
        // Draw point
        this.addPathForPoint(x, y);
    }
    
    // Set line attributes
	ctx.lineWidth = 1;
	ctx.strokeStyle = "blue";
    ctx.fillStyle = "blue";
    
    // Draw line and fill arrow
    ctx.fill();
    ctx.stroke();
    
    // Write arrow labels
    for (var i = 0; i < this.pointsArray.length; i++)
    {
        // Check for existence of optional label and write it
        if (typeof(this.pointsArray[i][2]) != 'undefined')
        {
            this.graph.placeText(this.pointsArray[i][0], this.pointsArray[i][1] + offsetY, this.pointsArray[i][2], {orientation:'vertical', alignment:'left', colour:'blue'});
        }
    }
}

/**
 * Adds a shape for the passed point for this series type (eg circle, bar, pie etc)
 * Also carries out hit test for mouse detection
 *
 * @param {Float} _x X coordinate in canvas plane
 * @param {Float} _y Y coordinate in canvas plane
 * @returns {Bool} True if mouse position within path 
 */
EG.TimePoints.prototype.addPathForPoint = function(_x, _y, _mx, _my)
{
    var returnValue = false;
    
    // Shortcut to context
    var ctx = this.graph.context;
    
    // Arrow dimensions
    var wo = 5;
    var wi = 2;
    var ho = 5;
    var hi = 14;
    
    // Check for passed mouse position arguments
    if(_mx)
    {
        // Create path and check for mouse hit
        ctx.beginPath();
    }
    
    // Add arrow path for point
    ctx.moveTo(_x, _y);
    ctx.lineTo(_x - wo, _y - ho);
    ctx.lineTo(_x - wi, _y - ho);
    ctx.lineTo(_x - wi, _y - hi);
    ctx.lineTo(_x + wi, _y - hi);
    ctx.lineTo(_x + wi, _y - ho);
    ctx.lineTo(_x + wo, _y - ho);
    ctx.lineTo(_x, _y);
    
    // Check if mouse position is within path
    if(_mx)
    {
        // Ensure path is closed
        ctx.closePath();
        
        // Perfrom hit test
        if (ctx.isPointInPath(_mx, _my))
        {
            returnValue = true;           
        }
    }
    
    return returnValue;
}

/**
 * Time Points indicated by arrow
 *
 * @class Series
 * @property {Graph} graph Reference to the enclosing Graph object
 * @property {Array} pointsArray Array of points
 * @param {Graph} _graph
 * @param {Array} _array
 * @param {Array} _params Associative array of optional parameters for subclass
 */ 
EG.TimeBlocks = function(_graph, _array, _params)
{
	// Call superclass constructor
	EG.Series.call(this, _graph, _array);
}

/**
 * Sets superclass and constructor
 */
EG.TimeBlocks.prototype = new EG.Series;
EG.TimeBlocks.prototype.constructor = EG.TimeBlocks;
EG.TimeBlocks.superclass = EG.Series.prototype;

/**
 * Draws the series
 */
EG.TimeBlocks.prototype.draw = function()
{
    // Vertical offset
    var offsetY = -12;
    var labelIsVertical = true;
    
    // Shortcut to context    
    var ctx = this.graph.context;
    
    // Scale shortcuts
    var sx = this.graph.scaleX;
    var sy = this.graph.scaleY;
    
    // Start a new graphics path
    ctx.beginPath(); 
    
    // Iterate through array drawing rectangles
    for (var i = 0; i < this.pointsArray.length; i++)
    {
        // Draw point
        var x = sx * this.pointsArray[i][0];
        var y = sy * this.pointsArray[i][1];
        var d = sy * this.pointsArray[i][2];
        
        // Draw point
        this.addPathForPoint(x, y);
        
        if (i == 0)
        {
            ctx.strokeStyle = "blue";
            ctx.fillStyle = "lightblue";
        }
        else
        {
            ctx.strokeStyle = "gray";
            ctx.fillStyle = "lightgray";            
        }
    }
    
    // Set line attributes
	ctx.lineWidth = 1;
	ctx.strokeStyle = "blue";
    ctx.fillStyle = "lightblue";
    
    // Draw line and fill arrow
    ctx.fill();
    ctx.stroke();
    
    // Write arrow labels
    for (var i = 0; i < this.pointsArray.length; i++)
    {
        // Check for existence of optional label and write it
        if (typeof(this.pointsArray[i][3]) != 'undefined')
        {
            this.graph.placeText(this.pointsArray[i][0] + 30, this.pointsArray[i][1] + offsetY, this.pointsArray[i][3], {orientation:'horizontal', alignment:'center', colour:'blue'});
        }
    }
}

/**
 * Adds a shape for the passed point for this series type (eg circle, bar, pie etc)
 * Also carries out hit test for mouse detection
 *
 * @param {Float} _x X coordinate in canvas plane
 * @param {Float} _y Y coordinate in canvas plane
 * @param {Float} _d Y coordinate in canvas plane
 * @returns {Bool} True if mouse position within path 
 */
EG.TimeBlocks.prototype.addPathForPoint = function(_x, _y, _mx, _my)
{
    var returnValue = false;
    
    // Shortcut to context
    var ctx = this.graph.context;
    
    // Arrow dimensions
    var h = 20;
    var d = 400;
    
    // Check for passed mouse position arguments
    if(_mx)
    {
        // Create path and check for mouse hit
        ctx.beginPath();
    }
    
    // Add arrow path for point
    ctx.moveTo(_x, _y);
    ctx.rect(_x, _y, d, h);
    
    // Check if mouse position is within path
    if(_mx)
    {
        // Ensure path is closed
        ctx.closePath();
        
        // Perfrom hit test
        if (ctx.isPointInPath(_mx, _my))
        {
            returnValue = true;           
        }
    }
    
    return returnValue;
}



