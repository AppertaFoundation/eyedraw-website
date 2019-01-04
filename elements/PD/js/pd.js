/*
 * Defines the Pedigree namespace
 */
if (PD == null || typeof(PD) != "object") { var PD = new Object();}


/*
 * Editable parameters for drawing 
 ** TODO - should be property of pedigree
 */
PD.LinkedNode1 = null;
PD.LinkedNode2 = null;

/*
 * Drawing constants
 */
/* force duration */
PD.timestep = 0.1;
/* algorithm stops when all node movement less than threshold */
PD.movementThreshold = 20;
/* hard stop algorithm when reach limit */
PD.maxIterations = 5000;
/* replusion */
PD.kR = 980;
/* attraction to centre of canvas */ // only really needed to centre first node as kO so strong...
PD.kG = 20;
/* attraction to old node position */
PD.kO = 150;
/* attraction between parents & children */
PD.kA = 80;
/* attraction between sibs */
PD.kAsib = 70;
/* attraction between multiplets */
PD.kAsibMB = 120; // not really working to ensure MB sibs next to one another if they have offspring...
/* attraction between mates */
PD.kAmate = 150;
/* attracting male mates to L & female partners to R */
PD.kM = 110;
/* subtracted from repulsion of nodes within large sibships */ //prevents problems when v large sibships create local pockets of negative charge
PD.localBuffer = 30;
/* Number of members of pedigree when start decreasign repulsion - make same as stop to turn this fetaure off! */
PD.startDecreasingRepulsion = 22;

PD.stopDecreasingRepulsion = 22;

PD.repulsionDecreaseFactor = 40;

PD.startZoom = 1;

PD.maxZoom = 1;

PD.generationHeight = 250; // changing this may mean the force constants also need to be altered as depend on distance between nodes

PD.nodeDimension = 30;

PD.consangSeperationHeight = 7;

PD.canvasBorder = 170; // gives whitespace around nodes when autoZoom, required if scaling in Y direction and orphan sibship in top generation



/*
 * The graph: contains 1 Family
 */
PD.Pedigree = function(_memberSet, _relationshipSet, _disorderSet, _canvas, _drawing, _width, _height) {
	this.canvas = _canvas;
    this.drawing = _drawing;
    
    this.memberArray = new Array();
    this.relationshipArray = new Array();
    this.generationsArray = new Array();
	this.disorderArray = _disorderSet;
	
	this.showAll = true;
	this.nSignificantNodes = 0;
	this.nSignificantEdges = 0;
	this.zoomFactor = PD.startZoom;
	this.yDisplacement = 0;
	this.xDisplacement = 0;
	
	this.stillMoving = false;
	
	this.labelContent = {
		aa_pdId:false,
		names: false,
		age: false,
		disorders: false,
		comments: false
	}
	    
	for (var k=0; k<_disorderSet.length; k++) {
		var disorder = {};
		disorder.value = _disorderSet[k];			
		this.disorderArray.push(disorder);
	}
	
	for (var j = 0; j < _relationshipSet.length; j++) {        
        var relationship = new PD.Relationship(j, _relationshipSet[j][0], _relationshipSet[j][1], _relationshipSet[j][2], this);
        this.relationshipArray.push(relationship);
    }
    
	// _index, _name, _gender, _dob, _isProband, _disorders, _deceased, _IUFD, _adopted, _orphan, _singleton, _multipleBirth, _generationRank, _p, _pedigree
    for (var i = 0; i < _memberSet.length; i++) {        
        var member = new PD.Member(_memberSet[i][0], _memberSet[i][1], _memberSet[i][2], _memberSet[i][3], _memberSet[i][4], _memberSet[i][5], _memberSet[i][6], _memberSet[i][7], _memberSet[i][8], _memberSet[i][9], _memberSet[i][10], _memberSet[i][11], _memberSet[i][12], _memberSet[i][13], this);
        this.memberArray.push(member);
        // if generation rank not already within array of all generations, push to array
		if (this.generationsArray.indexOf(member.generationRank) < 0) {this.generationsArray.push(member.generationRank)}
		member.significant = true;
    }

    // order array in numberical order
	this.generationsArray.sort(function(a, b) {
		return a - b;
	});	
	
	this.minY = 1000000000;
	this.maxY = -1000000000;
	
	// add event listener to move canvas
	var ped = this;
	ped.drawing.canvas.addEventListener('mousemove', function(e) {
		if (ped.drawing.mouseDown && ped.drawing.selectedDoodle == null) {
			ped.drawing.canvas.style.cursor = "-webkit-grabbing";
			dragCanvas(e,ped);
		}
		else {
			ped.draggingCanvas = false;
			if (ped.drawing.selectedDoodle == null) ped.drawing.canvas.style.cursor = "-webkit-grab";
		}
		
		return false;
	}, false);
}

PD.Pedigree.prototype.recalculatePositions = function() {
    counter = 0;
	this.stillMoving = true;
    while (this.stillMoving && counter<PD.maxIterations) {
	    this.stillMoving = false;
		this.run(PD.timestep);
		counter++;
	}
	if (counter==PD.maxIterations) {
		for (var i=0; i<this.memberArray.length; i++) {
			this.memberArray[i].p = new PD.Vector(this.memberArray[i].previousPoint.x, this.memberArray[i].previousPoint.y);
		}
	}
	this.normaliseXalignment();
}

PD.Pedigree.prototype.getGenerationNodes = function(_genN) {
	var genRank = this.generationsArray[_genN];
	var generation = [];
	
	for (var i=0; i<this.memberArray.length; i++) {
		if (this.memberArray[i].generationRank == genRank) generation.push(this.memberArray[i]);
	}
	
	return generation;
}

PD.Pedigree.prototype.checkConsang = function() {
	for (var i=0; i<this.memberArray.length; i++) {
		// TODO: so will repeat for all orphan sibs?! Only need to do once per sibship...
		if (this.memberArray[i].orphan) {
			this.memberArray[i].checkBloodlineConsang();
		}
	}
}

PD.Pedigree.prototype.drawFamily = function(_newMember) {
	var activeMembers = 0;
	var previousSignifNodeCounter = this.nSignificantNodes;
	var previousSignifEdgeCounter = this.nSignificantEdges;
	
	for (var l = 0; l<this.memberArray.length; l++) {
		this.memberArray[l].significant = this.memberArray[l].setSignificance();
		this.memberArray[l].setNodeVisibility();
		
		// reset duplicate parameters;		
		this.memberArray[l].duplicateMaster = null;
		this.memberArray[l].duplicateNumber = 0;
		
		// set previousPoint to current p value
		this.memberArray[l].previousPoint = new PD.Vector(this.memberArray[l].p.x, this.memberArray[l].p.y);
	}
		
	// set start parameters for force calculations
		// only recalculate forces if a different number of significant nodes or edges (ie a change has occured to graph)
	this.nSignificantNodes = this.memberArray.length;
	var nAffectedMembers = 0;
	for (var k = 0; k<this.memberArray.length; k++) {
		if (this.memberArray[k].significant) {
			this.memberArray[k].setY();
			this.memberArray[k].bridgeCap = false;
		}
		else {
			// TODO ? what does this achieve?!
			if (this.memberArray[k].duplicateNumber == '0') this.memberArray[k].setDuplicateSibs();
		}
	}
	this.nSignificantEdges = this.relationshipArray.length;
	for (var v=0; v<this.relationshipArray.length; v++) {
		this.relationshipArray[v].setEdgeSignificance();
		this.relationshipArray[v].setEdgeVisibility();
	}
	
	// recalculate node positions on canvas
	if (previousSignifNodeCounter !== this.nSignificantNodes || previousSignifEdgeCounter !== this.nSignificantEdges) {
		this.recalculatePositions();
	}
	
	
	for (var l=0; l<this.memberArray.length; l++) {
		var mmbr = this.memberArray[l]; 
		mmbr.bridgeCap = false;
		if (mmbr.duplicateNumber>0) {
			mmbr.p.x = mmbr.duplicateMaster.p.x;
		}
	}
	for (var m=0; m<this.relationshipArray.length; m++) {
		this.relationshipArray[m].updateRelationship(m);
	}
	
	for (var i=0; i<this.drawing.doodleArray.length; i++) {
		var dood = this.drawing.doodleArray[i];
		var node = dood.node;
		var edge = dood.edge
		if (node) {
			dood.setNode(node);
			if (dood.significant && dood.visible) activeMembers++;
		}
		else if (edge) dood.setEdge(edge);
	}
	// shift canvas so the new, selected doodle is definitely visible
	var needReset = false;
	if (_newMember) needReset = _newMember.ensureVisibleOnCanvas();
	if (needReset) {
		for (var z=0; z<this.relationshipArray.length; z++) {
			this.relationshipArray[z].updateRelationship(z);
		}
		for (var j=0; j<this.drawing.doodleArray.length; j++) {
			var dood = this.drawing.doodleArray[j];
			var node = dood.node;
			var edge = dood.edge
			if (node) dood.setNode(node);
			else if (edge) dood.setEdge(edge);
		}
	}
	
	// update pedigree generations axis
	this.generationsDoodle.setGenerations(this);

	this.drawing.deselectDoodles();
					
	var r = $.Deferred();	
	setTimeout(function () {
		r.resolve();
	}, 0.01);
	
	return r;
	
}

PD.Pedigree.prototype.run = function(_timestep) {	
	
	for (var h=0; h<this.relationshipArray.length; h++) {
		var edge = this.relationshipArray[h];
		if (edge.significant) edge.applyHookesLaw();
	}
	
	for (var i = 0; i < this.memberArray.length; i++) {
		var node = this.memberArray[i];
		if (node.significant) {
			
            var lastPos = node.p.x;

			node.sortSibsX();
						
			if (node.previousPoint.x =='0' && node.previousPoint.y=='0') {
			}
			else {
				node.attractToPreviousPosition();
			}
						
			node.applyCoulombsLaw();
						
			node.attractToCentre();
			
			node.attractToSide();
						
			node.updateVelocity(_timestep);
			node.updatePosition(_timestep);
			
			node.sortSibsX();

			node.setY();
			
			if (this.stillMoving && counter > 0) this.stillMoving = true;
			else if (counter < 5) this.stillMoving = true;
			else if (Math.abs(node.p.x - lastPos) < PD.movementThreshold) this.stillMoving = false;
			else this.stillMoving = true;
		}
	}
	
}

//TODO: Currently iterates once
/// so parents above children, but if the parent has a sib may be moved out of alignment...
PD.Pedigree.prototype.normaliseXalignment = function() {
	for (var m=this.generationsArray.length-1; m>-1; m--) {
		
		// get all members in the sam generation (same Y coordinate)
		var gen = this.getGenerationNodes(m);
		
		var checkedNodes = [];
		
		for (var n=0; n<gen.length; n++) {
			gen[n].sortSibsX();

			// don't bother rechecking nodes if already considered
			if (!gen[n].orphan && checkedNodes.indexOf(gen[n].index) < 0 && gen[n].significant) {
				checkedNodes.push(gen[n].index);

				var node = gen[n];
				var midP = node.p.x;
				
				// find parent nodes
				var rents = node.getParentNodes();
				
				// sort parents by x coord and get centre point
				rents.sort(function(a, b) {
				    return parseFloat(a.p.x) - parseFloat(b.p.x);
				});
				var MP = (rents[1].p.x - rents[0].p.x) * 0.5 + rents[0].p.x;
				
				var sibs = node.getSiblings();
				var sibNodes = node.getSignificantSiblingsNodes();
				if (sibNodes.length>0) {
					// add sibs to array as don't need to move parents twice...
					checkedNodes = checkedNodes.concat(sibs);
					
					sibNodes.push(node);
					// get centre point of siblings
					sibNodes.sort(function(a, b) {
					    return parseFloat(a.p.x) - parseFloat(b.p.x);
					});
					midP = sibNodes[0].p.x + 0.5*(sibNodes[sibNodes.length-1].p.x - sibNodes[0].p.x);
				}
				// move parents to centre of sibship / equally above only child
				rents[0].p.x = rents[0].p.x - (MP-midP);
				rents[1].p.x = rents[1].p.x - (MP-midP);
			}
			
		}
	}
}

PD.Pedigree.prototype.setVisibility = function(_disorder, _visibility, _index) {
	// if any of the pedigrees not visible, set showAll flag to false 
	/// (won't be able to see subset of a disorder + those unasigned to a disorder... meh)
	if (_visibility == false) this.showAll = false;
	
	// if all visible, push to disorder array
	if (_disorder == "all") {
		if (_visibility) {
			this.showAll = true;
			for (var i=0; i<this.disorderArray.length; i++) {
				this.disorderArray[i].visible = true;
			}
		}
	}

	// otherwise set visibility of individual disorder
	else {		
		var index = _index-1;
		this.disorderArray[index].visible = _visibility;
	}
	
	autoZoom();
}

/*
 * A node
 * Initial X coordinate, and rank defined from parent node
 */
PD.Member = function(_index, _name, _gender, _dob, _isProband, _disorders, _deceased, _IUFD, _adopted, _orphan, _singleton, _multipleBirth, _generationRank, _p, _pedigree) {
    var d = [{
	    'memberOf' : false,
		'status':'Unknown',
		'onset':'',
		'gene':''
	},
	{
		'memberOf' : false,
		'status':'Unknown',
		'onset':'',
		'gene':''
	},
	{
		'memberOf' : false,
		'status':'Unknown',
		'onset':'',
		'gene':''
	},
	{
		'memberOf' : false,
		'status':'Unknown',
		'onset':'',
		'gene':''
	}];
	
    this.index = _index;
    this.dob = _dob;
    this.personName = _name;
    this.gender = _gender;
    this.isProband = _isProband;
   	this.disorders = (_disorders == null) ? d : _disorders;
	this.deceased = _deceased;
	this.IUFD = _IUFD;
	this.adoptedIn = _adopted;
	this.orphan = _orphan;
	this.generationRank = _generationRank; // rank relative to proband (proband rank = 0; +1 for each older generation, -1 for younger) ** ARBcan just start ranking on any generation, doesn't have to be proband
	this.p = _p;
	
	// TODO: will need to be parsed from array!
	this.singleton = _singleton;
	this.multipleBirth = _multipleBirth;
	
	this.duplicateMaster = null;
	this.duplicateNumber = 0;
	
	this.significant = true;
	this.visible = true;
	
	this.previousPoint = null;
	this.v = new PD.Vector(0,0);
	this.a = new PD.Vector(0,0);
	this.m = 1;
	
	this.bridgeCap = false;
	
	this.pedigree = _pedigree;
	
	lastNodeIndex++;
		
// 	if (_index >= lastNodeIndex) lastNodeIndex = _index+1;
		
}


/*
 *
 * y set when created and then never changes?
 */
PD.Member.prototype.setY = function() {
	this.p.y = this.previousPoint.y;
	if (this.p.y<this.pedigree.minY) this.pedigree.minY = this.p.y;
	if (this.p.y>this.pedigree.maxY) this.pedigree.maxY = this.p.y;
	
}

// apply repulsion forces
// TODO: currently multigenerational matings have the tendency to align x coordinates as repulsion has y component so smaller in x direction
/// could just use the same y coodinate?
// TODO: some sibs being weird...
PD.Member.prototype.applyCoulombsLaw = function() {
	var kR = (pedigree.nSignificantNodes > PD.startDecreasingRepulsion &&  pedigree.nSignificantNodes < PD.stopDecreasingRepulsion) ? (PD.kR - (pedigree.nSignificantNodes - PD.startDecreasingRepulsion) * PD.repulsionDecreaseFactor) : (pedigree.nSignificantNodes >= PD.stopDecreasingRepulsion) ? (PD.kR - (PD.stopDecreasingRepulsion-PD.startDecreasingRepulsion) * PD.repulsionDecreaseFactor) : PD.kR;

	var sibs = this.getSignificantSiblings();
	// so big sibships repel all other nodes less
// 	var localBuffer = (sibs.length>3) ? PD.localBuffer * sibs.length : PD.localBuffer;
	var localBuffer = PD.localBuffer;
		
	for (var i=0; i<pedigree.memberArray.length; i++) {
		if (this.index !== pedigree.memberArray[i].index) {
			var node2 = pedigree.memberArray[i];
			
			if (node2.significant) {
				// different internal repulsion within big sibships - TODO: maybe should also apply to mates?
				if (sibs.length>2 && sibs.indexOf(node2.index)>-1) localBuffer = PD.localBuffer / 3 * sibs.length;
				
				var d = this.p.subtract(node2.p);
				var distance = d.magnitude() + localBuffer; // avoid massive forces at small distances (and divide by zero)
				var direction = d.normalise();
							
				this.applyForce(direction.multiply(kR*1000000).divide(distance * distance * 0.5));
			}
		}
	}
	
}

// below three functions pretty much use same code, to attract to set point (all dif points), but could probs generalise & pass point as a parameter
PD.Member.prototype.attractToCentre = function() {
	var centre = new PD.Vector(0.5 * pedigree.canvasWidth, this.targetY);
	var spring = {
		length: 1,
		k: PD.kG,
	};
		
	var d = centre.subtract(this.p); // the direction of the spring
	var displacement = spring.length - d.magnitude();
	var direction = d.normalise();

	this.applyForce(direction.multiply(spring.k * displacement * -0.5));
}

PD.Member.prototype.attractToPreviousPosition = function() {
	// I only really want to do this with X coord, does it matter?!
	var point = new PD.Vector(this.previousPoint.x, this.previousPoint.y);
	
	var spring = {
		length: 1,
		k: PD.kO,
	};

	var d = this.previousPoint.subtract(this.p); // the direction of the spring
	var displacement = spring.length - d.magnitude();
	var direction = d.normalise();

	this.applyForce(direction.multiply(spring.k * displacement * -0.5));
}

// Attracts to point relative to position of mates, pulling males to L and females to R
PD.Member.prototype.attractToSide = function() {
	var matesIndices = this.getMates();
	var mates = [];
	for (var i=0; i<pedigree.memberArray.length; i++) {
		if (matesIndices.indexOf(pedigree.memberArray[i].index)>-1) mates.push(pedigree.memberArray[i]);
	}
	
	if (mates.length>0) {
		mates.push(this);
		mates.sort(function(a, b) {
		    return parseFloat(a.p.x) - parseFloat(b.p.x);
		});
		
		var xDif = Math.abs(mates[0].p.x - mates[mates.length-1].p.x) * 0.5 + 1;
		var mp = mates[0].p.x + xDif;

		// define side to attract to, based on gender
		var side;
		if (this.gender == 'M') side = new PD.Vector(mp - xDif, this.previousPoint.y);
		else side = new PD.Vector(mp + xDif, this.previousPoint.y);
		
		var spring = {
			length: 1,
			k: PD.kM,
		};

		var d = side.subtract(this.p); // the direction of the spring
		var displacement = spring.length - d.magnitude();
		var direction = d.normalise();
	
		this.applyForce(direction.multiply(spring.k * displacement * -0.5));
	}
}

/**
 * Sorts an array of nodes by X coordinate
 * _nodes : array of other node indices in which to order by x difference between each node in the array and this member
 * returns ordered array of node indices
 */
PD.Member.prototype.orderNodesByX = function(_nodes) {
	var nodes = [];
	var orderedNodes = [];
	
	for (var i=0; i<_nodes.length; i++) {
		var node;
		var found = false;
		for (var j=0; j<pedigree.memberArray.length; j++) {
			if (!found) {
				if (pedigree.memberArray[j].index == _nodes[i]) {
					nodes.push(pedigree.memberArray[j]);
					found = true;
				}
			}
		}
	}
	nodes.push(this);
	
	nodes.sort(function(a,b) {
		return a.p.x - b.p.x;
	});
	
	for (var h=0; h<nodes.length; h++) {
		orderedNodes.push(nodes[h].index);
	}
	
	return orderedNodes;
}

PD.Member.prototype.sortSibsX = function() {
	
	var sibIndices = this.getSignificantSiblings();
	
	if (sibIndices.length > 0) {
		
		var sibs = [];
		for (var i=0; i<pedigree.memberArray.length; i++) {
			if (sibIndices.indexOf(pedigree.memberArray[i].index)>-1 && pedigree.memberArray[i].significant) {
				sibs.push(pedigree.memberArray[i]);
			}
		}		
		sibs.push(this);
		
		// sort by xPos to calcualte parameters to reorder relative to current span of sibship
		sibs.sort(function(a, b) {
		    return parseInt(a.p.x) - parseInt(b.p.x);
		});
		var xSpacing = (sibs[sibs.length-1].p.x - sibs[0].p.x) / (sibs.length-1);
		var startX = sibs[0].p.x;
		
		
		// then sort sibs by age, and find out where should come in array
		//// TODO - currently only runs for those in lowest generation as if high up in pedigree makes ccan require big changes in layout -> problems...
		////// change to if non of the sibs have offspring, then sort, else leave ?
		if (this.pedigree.generationsArray.indexOf(this.generationRank) === (this.pedigree.generationsArray.length-1)) {
			sibs.sort(function(a, b) {
			    return parseInt(b.doodle.age) - parseInt(a.doodle.age);
			});
// 			console.log(this.index);
		}
		
		// set x coord evenly throughout sibship
		for (var k=0; k<sibs.length; k++) {
			sibs[k].p.x = startX + xSpacing * k;
		}

	}
}


PD.Member.prototype.updateVelocity = function(_timestep) {
	this.v = this.v.add(this.a.multiply(_timestep)).multiply(0.3);
	this.a = new PD.Vector(0,0);
}


PD.Member.prototype.updatePosition = function(_timestep) {
	this.p = this.p.add(this.v.multiply(_timestep));
}


PD.Member.prototype.applyForce = function(force) {
	this.a = this.a.add(force.divide(this.m));
}


PD.Member.prototype.getSiblings = function() {
	var siblings = [];
	for (var i=0; i<pedigree.relationshipArray.length; i++) {
		var rShip = pedigree.relationshipArray[i];
		if (rShip.type == "sib" || rShip.type == "sibMZ" || rShip.type == "sibDZ") {
			if (rShip.from == this.index) siblings.push(rShip.to);
			else if (rShip.to == this.index) siblings.push(rShip.from);
		}
	}
	return siblings;
}

PD.Member.prototype.getSiblingsNodes = function() {
	var siblings = [];
	for (var i=0; i<pedigree.relationshipArray.length; i++) {
		var rShip = pedigree.relationshipArray[i];
		if (rShip.type == "sib" || rShip.type == "sibMZ" || rShip.type == "sibDZ") {
			if (rShip.from == this.index) siblings.push(rShip.to);
			else if (rShip.to == this.index) siblings.push(rShip.from);
		}
	}
	
	var siblingNodes = [];
	for (var j=0; j<siblings.length; j++) {
		var found = false;
		var k=0;
		while (!found && k<pedigree.memberArray.length) {
			if (pedigree.memberArray[k].index == siblings[j]) {
				siblingNodes.push(pedigree.memberArray[k]);
				found = true;
			}
			k++;
		}
	}
	return siblingNodes;
}

PD.Member.prototype.getSignificantSiblingsNodes = function() {
	var siblings = [];
	for (var i=0; i<pedigree.relationshipArray.length; i++) {
		var rShip = pedigree.relationshipArray[i];
		if (rShip.type == "sib" || rShip.type == "sibMZ" || rShip.type == "sibDZ") {
			if (rShip.from == this.index) siblings.push(rShip.to);
			else if (rShip.to == this.index) siblings.push(rShip.from);
		}
	}
	
	var siblingNodes = [];
	for (var j=0; j<siblings.length; j++) {
		var found = false;
		var k=0;
		while (!found && k<pedigree.memberArray.length) {
			if (pedigree.memberArray[k].index == siblings[j]) {
				if (pedigree.memberArray[k].significant) siblingNodes.push(pedigree.memberArray[k]);
				found = true;
			}
			k++;
		}
	}
	return siblingNodes;
}


PD.Member.prototype.getSignificantSiblings = function() {
	var siblings = [];
	for (var i=0; i<pedigree.relationshipArray.length; i++) {
		var rShip = pedigree.relationshipArray[i];
		if (rShip.type == "sib" || rShip.type == "sibMZ" || rShip.type == "sibDZ") {
			var sibIndex;
			if (rShip.from == this.index) sibIndex = rShip.to;
			else if (rShip.to == this.index) sibIndex = rShip.from;
			
			var j=0;
			var found = false;
			while (!found && j<this.pedigree.memberArray.length) {
				if (this.pedigree.memberArray[j].index == sibIndex) {
					found = true;
					if (pedigree.memberArray[j].significant) siblings.push(sibIndex);
				}
				j++;
			}
		}
	}
	return siblings;
}


PD.Member.prototype.getWombMates = function() {
	var wombMates = [];
	for (var i=0; i<pedigree.relationshipArray.length; i++) {
		var rShip = pedigree.relationshipArray[i];
		if (rShip.type == "sibMZ" || rShip.type == "sibDZ") {
			if (rShip.from == this.index) wombMates.push(rShip.to);
			else if (rShip.to == this.index) wombMates.push(rShip.from);
		}
	}
	return wombMates;
}

PD.Member.prototype.getParentNodes = function() {
	var rents = this.getParents();
	var parentNodes = [];
	
	var parentCounter = 0;
	var i=0;
	while (i<pedigree.memberArray.length && parentCounter<2) {
		if (rents.mother == pedigree.memberArray[i].index || rents.father == pedigree.memberArray[i].index) {
			parentNodes.push(pedigree.memberArray[i]);
			parentCounter++;
		}
		i++;
	}
	
	return parentNodes;
}

PD.Member.prototype.getParents = function() {
	var parents = {
		mother:"",
		father:"",
		rShipIndex:"",
	};
	for (var i=0; i<pedigree.relationshipArray.length; i++) {
		var rShip = pedigree.relationshipArray[i];
		if (rShip.type == "parentChild") {
			if (rShip.to == this.index) {
				for (var j = 0; j < pedigree.memberArray.length; j++) {
					if (pedigree.memberArray[j].index == rShip.from) {
						if (pedigree.memberArray[j].gender == 'M') parents.father = rShip.from;
						else if (pedigree.memberArray[j].gender == 'F') parents.mother = rShip.from;			
					}
				}
			}
		}
	}
	
	for (var j=0; j<pedigree.relationshipArray.length; j++) {
		var rShip = pedigree.relationshipArray[j];
		if (rShip.type == "mate" || rShip.type == "mateSep" || rShip.type == "mateConsang") {
			if ((rShip.to == parents.mother && rShip.from == parents.father) || (rShip.from == parents.mother && rShip.to == parents.father)) {
				parents.rShipIndex = rShip.index;
			}
		}
	}
	return parents;
}

PD.Member.prototype.getChildren = function() {
	var offspring = [];
	
	for (var i=0; i<pedigree.relationshipArray.length; i++) {
		var rShip = pedigree.relationshipArray[i];
		if (rShip.type == "parentChild" && rShip.from == this.index) offspring.push(rShip.to);
	}
	
	return offspring;
}
PD.Member.prototype.getChildrenNodes = function() {
	var offspring = [];
	for (var i=0; i<pedigree.relationshipArray.length; i++) {
		var rShip = pedigree.relationshipArray[i];
		if (rShip.type == "parentChild" && rShip.from == this.index) offspring.push(rShip.to);
	}
	
	var offspringNodes = [];
	for (var j=0; j<offspring.length; j++) {
		var found = false;
		var k=0;
		while (!found && k<pedigree.memberArray.length) {
			if (pedigree.memberArray[k].index == offspring[j]) {
				offspringNodes.push(pedigree.memberArray[k]);
				found = true;
			}
			k++;
		}
	}
	return offspringNodes;
}

PD.Member.prototype.getSharedOffspring = function(_coparent) {
	var sharedOffspring = [];
	
	var coparent;
	for (var i = 0; i < pedigree.memberArray.length; i++) {
		if (pedigree.memberArray[i].index == _coparent) coparent = pedigree.memberArray[i];
	}
	
	var myOffspring = this.getChildren();
	var partnersOffspring = coparent.getChildren();
	
	for (var j=0; j<myOffspring.length; j++) {
		if (partnersOffspring.indexOf(myOffspring[j]) > -1) sharedOffspring.push(myOffspring[j]);
	}
	
	return sharedOffspring;
}

PD.Member.prototype.getMates = function() {
	var mates = [];
	for (var i=0; i<pedigree.relationshipArray.length; i++) {
		var rShip = pedigree.relationshipArray[i];
		if (rShip.type == "mate" || rShip.type == "mateConsang" || rShip.type == "mateSep" || this.type=="mateDiv") {
			if (rShip.to == this.index) mates.push(rShip.from);
			else if (rShip.from == this.index) mates.push(rShip.to);
		}
	}
	return mates;
}

PD.Member.prototype.getMateNodes = function() {
	var mates = [];
	for (var i=0; i<pedigree.relationshipArray.length; i++) {
		var rShip = pedigree.relationshipArray[i];
		if (rShip.type == "mate" || rShip.type == "mateConsang" || rShip.type == "mateSep" || this.type=="mateDiv") {
			if (rShip.to == this.index) mates.push(rShip.from);
			else if (rShip.from == this.index) mates.push(rShip.to);
		}
	}
	
	var mateNodes = [];
	for (var j=0; j<pedigree.memberArray.length; j++) {
		if (mates.indexOf(pedigree.memberArray[j].index > -1)) mateNodes.push(pedigree.memberArray[j]);
	}
	return mateNodes;
}

/**
 * 
 * _nodes : array of other node indices in which to order by x difference between each node in the array and this member
 * returns ordered array of node indices
 */
PD.Member.prototype.orderNodesByXdif = function(_nodes,_x) {
	var nodes = [];
	var orderedNodes = [];
	
	for (var i=0; i<_nodes.length; i++) {
		var node;
		var found = false;
		for (var j=0; j<pedigree.memberArray.length; j++) {
			if (!found) {
				if (pedigree.memberArray[j].index == _nodes[i]) {
					nodes.push(pedigree.memberArray[j]);
					found = true;
				}
			}
		}
	}
	
	nodes.sort(function(a,b) {
		return (Math.abs(_x-a.p.x)) - (Math.abs(_x-b.p.x));
	});
	
	for (var h=0; h<nodes.length; h++) {
		orderedNodes.push(nodes[h].index);
	}
	
	return orderedNodes;
}

/**
 * 
 * 
 * check all blood relatives of member for consang matings
 */
PD.Member.prototype.checkBloodlineConsang = function() {
	var bloodRelatives = [];
	var bloodRelativesIndices = [];
	
	bloodRelativesIndices.push(this.index);
	bloodRelativesIndices.concat(this.getSiblings());
	
	var firstGen = [];
	firstGen.push(this);
	var mySibs = this.getSiblingsNodes();
	for (var z=0; z<mySibs.length; z++) {
		if (mySibs[z].index!==undefined) {
			firstGen.push(mySibs[z]);
			bloodRelativesIndices.push(mySibs[z].index);
		}
	}
	bloodRelatives = firstGen;
	
	for (var i=0; i<firstGen.length; i++) {
		var newRelatives = []
		newRelatives.push(firstGen[i]);
		
		while(newRelatives.length>0) {
			tempRelatives = newRelatives;
			newRelatives = [];
			for (var j=0; j<tempRelatives.length; j++) {
				if(tempRelatives[j].index!==undefined) {
					var nextGen = tempRelatives[j].getChildrenNodes();
					if (nextGen.length>0) {
						for (var l=0; l<nextGen.length; l++) {
							if (nextGen[l].index!==undefined && bloodRelativesIndices.indexOf(nextGen[l].index<0)) {
								bloodRelatives.push(nextGen[l]);
								bloodRelativesIndices.push(nextGen[l].index);
								newRelatives.push(nextGen[l]);
							}
						}
					}
				}
			}
		}
	}

	for (k=0; k<bloodRelatives.length; k++) {
		var mates = bloodRelatives[k].getMates();
		for (var l=0; l<mates.length; l++) {
			if (bloodRelativesIndices.indexOf(mates[l])>-1) {
				// find relationship in array and set to a consang mating
				var found = false;
				var m = 0;
				while (!found && m<pedigree.relationshipArray.length) {
					if ((pedigree.relationshipArray[m].from == bloodRelativesIndices[k] && pedigree.relationshipArray[m].to == mates[l]) || (pedigree.relationshipArray[m].to == bloodRelativesIndices[k] && pedigree.relationshipArray[m].from == mates[l])) {
						pedigree.relationshipArray[m].type = "mateConsang";
						found = true;
					}
					m++;
				}				
			}
		}
	}
}


PD.Member.prototype.addRelative = function(_type,_gender,_pedigree) {
	var doodle;
	var newMember;
	
	var index = lastNodeIndex;
	
	var generation = (_pedigree.generationsArray.length <= 2) ? _pedigree.generationsArray.indexOf(this.generationRank) + 2 : _pedigree.generationsArray.indexOf(this.generationRank) + 1;
	var generationsNumber = (_pedigree.generationsArray.length <= 2) ? _pedigree.generationsArray.length + 1 : _pedigree.generationsArray.length;

	var generationHeight = PD.generationHeight * _pedigree.zoomFactor;
	
	switch (_type)
    {
        case 'sib':
        	this.singleton = false;
        	var generationRank = this.generationRank;
        	var isOrphan = this.orphan;
        	var sibs = this.getSiblings();
        	var midpoint = this.p.x+50; // add sib to R as usually do in age order...
/*
        	if (sibs.length>0) {
	        	var sibNodes = this.getSiblingsNodes();
	        	midpoint = sibNodes[sibNodes.length-1].p.x + 40;
        	}
*/
        	
        	//// _index, _name, _gender, _dob, _isProband, _disorders, _deceased, _IUFD, _adopted, _orphan, _singleton, _multipleBirth, _duplicateMember, _duplicateMaster, _generationRank, _p
        	var member = new PD.Member(index, "", _gender, "", false, null, false, false, false, isOrphan, false, false, generationRank, new PD.Vector(midpoint,this.p.y), this.pedigree);
			newMember = member;
			
			_pedigree.memberArray.push(member);
			doodle = _pedigree.drawing.addDoodle('FamilyMember');
			doodle.setNode(member);
			doodle.setPropertyDefaults();

			var relationship = new PD.Relationship(lastRelationshipIndex, this.index, member.index, 'sib', _pedigree);
			_pedigree.relationshipArray.push(relationship);
			doodle = _pedigree.drawing.addDoodle('MemberConnector');
			doodle.setEdge(relationship);
        	
        	// if current node has parents, create parent child relationships
        	if (this.orphan == false) {
	        	
				member.orphan = false;
	        	var parents = this.getParents();
	        	
				// add relationship with existing father node
	        	var father = new PD.Relationship(lastRelationshipIndex, parents.father, member.index, 'parentChild', _pedigree);
				_pedigree.relationshipArray.push(father);
				doodle = _pedigree.drawing.addDoodle('MemberConnector');
				doodle.setEdge(father);
				
				// add relationship with existing mother node
				var mother = new PD.Relationship(lastRelationshipIndex, parents.mother, member.index, 'parentChild', _pedigree);
				_pedigree.relationshipArray.push(mother);
				doodle = _pedigree.drawing.addDoodle('MemberConnector');
				doodle.setEdge(mother);
        	}
        	
        	// if this has sibs, add sib relationships with new node
        	if (sibs.length > 0) {
	        	for (var i = 0; i < sibs.length; i++) {
		        	var rShip = new PD.Relationship(lastRelationshipIndex, sibs[i], member.index, 'sib', _pedigree);
					_pedigree.relationshipArray.push(rShip);
					doodle = _pedigree.drawing.addDoodle('MemberConnector');
					doodle.setEdge(rShip);
	        	}
        	}
            break;
            
            
        case 'parents':
        	var generationRank = this.generationRank - 1;
			this.orphan = false;
			var isOrphan = true;
			var sibs = this.getSiblings();
			var midpoint = this.p.x;
			if (sibs.length > 0) midpoint = this.calculateSibshipMidpoint(sibs);
			
			// father 
        	//// _index, _name, _gender, _dob, _isProband, _disorders, _deceased, _IUFD, _adopted, _orphan, _singleton, _multipleBirth, _duplicateMember, _duplicateMaster, _generationRank, _p
			var father = new PD.Member(index, '', 'M', '', false, null, false, false, false, isOrphan, true, false, generationRank, new PD.Vector(midpoint-40,this.p.y-PD.generationHeight), this.pedigree);

			_pedigree.memberArray.push(father);
			doodle = _pedigree.drawing.addDoodle('FamilyMember');
			doodle.setNode(father);
			doodle.setPropertyDefaults();
			
			var relationship1 = new PD.Relationship(lastRelationshipIndex, father.index, this.index, 'parentChild', _pedigree);
			_pedigree.relationshipArray.push(relationship1);
			doodle = _pedigree.drawing.addDoodle('MemberConnector');
			doodle.setEdge(relationship1);
			
			
			// mother 
	        //// _index, _name, _gender, _dob, _isProband, _disorders, _deceased, _IUFD, _adopted, _orphan, _singleton, _multipleBirth, _duplicateMember, _duplicateMaster, _generationRank, _p
			var mother = new PD.Member(index + 1, '', 'F', '', false, null, false, false, false, isOrphan, true, false, generationRank, new PD.Vector(midpoint+40,this.p.y-PD.generationHeight), this.pedigree);
			newMember = mother;
			
			_pedigree.memberArray.push(mother);
			doodle = _pedigree.drawing.addDoodle('FamilyMember');
			doodle.setNode(mother);
			doodle.setPropertyDefaults();
			
			var relationship2 = new PD.Relationship(lastRelationshipIndex, mother.index, this.index, 'parentChild', _pedigree);
			_pedigree.relationshipArray.push(relationship2);
			doodle = _pedigree.drawing.addDoodle('MemberConnector');
			doodle.setEdge(relationship2);
			
			// also create mate relationship between new parents
			var relationship3 = new PD.Relationship(lastRelationshipIndex, father.index, mother.index, 'mate', _pedigree);
			_pedigree.relationshipArray.push(relationship3);
			doodle = _pedigree.drawing.addDoodle('MemberConnector');
			doodle.setEdge(relationship3);
			
			// if this has sibs, also add relationships with new parents for all sibs
        	if (sibs.length > 0) {
	        	var s = this.getSiblingsNodes();
	        	for (var i = 0; i < s.length; i++) {
					var f = new PD.Relationship(lastRelationshipIndex, father.index, s[i].index, 'parentChild', _pedigree);
					_pedigree.relationshipArray.push(f);
					doodle = _pedigree.drawing.addDoodle('MemberConnector');
					doodle.setEdge(f);
					
					var m = new PD.Relationship(lastRelationshipIndex, mother.index, s[i].index, 'parentChild', _pedigree);
			        _pedigree.relationshipArray.push(m);
			        s[i].orphan = false;
			        doodle = _pedigree.drawing.addDoodle('MemberConnector');
					doodle.setEdge(m);
	        	}
        	}
            break;
            
            
        case 'child':
        	var generationRank = this.generationRank + 1;
			var isOrphan = false;

	        //// _index, _name, _gender, _dob, _isProband, _disorders, _deceased, _IUFD, _adopted, _orphan, _singleton, _multipleBirth, _duplicateMember, _duplicateMaster, _generationRank, _p
			var child = new PD.Member(index, '', _gender, '', false, null, false, false, false, isOrphan, true, false, generationRank, new PD.Vector(this.p.x, this.p.y + PD.generationHeight), this.pedigree);
			newMember = child;
			
			var relationship = new PD.Relationship(lastRelationshipIndex, this.index, child.index, 'parentChild', _pedigree);
			_pedigree.relationshipArray.push(relationship);
			doodle = _pedigree.drawing.addDoodle('MemberConnector');
			doodle.setEdge(relationship);
			
			// ensure a co-parent exists, and add relationship with new child
			// **TODO** problems if try to add child to node with several partners... at the moment just takes last from the list (so most recently added?)...
			var coparent;
			var mate;
			var mates = this.getMates();
			if (mates.length>0) coparent = mates[mates.length -1];
			else {
				var sex = (this.gender == 'M') ? 'F' : 'M';
				//// _index, _name, _gender, _dob, _isProband, _disorders, _deceased, _IUFD, _adopted, _orphan, _singleton, _multipleBirth, _duplicateMember, _duplicateMaster, _generationRank, _p
				var pX = (this.gender == 'M') ? this.p.x + 10 : this.p.x - 10;
				mate = new PD.Member(index+1, '', sex, '', false, null, false, false, false, true, true, false, this.generationRank, new PD.Vector(pX, this.p.y), this.pedigree);
				_pedigree.memberArray.push(mate);
				doodle = _pedigree.drawing.addDoodle('FamilyMember');
				doodle.setNode(mate);
				doodle.setPropertyDefaults();
				
				coparent = mate.index;
				var mating = new PD.Relationship(lastRelationshipIndex, this.index, mate.index, 'mate', _pedigree);
				_pedigree.relationshipArray.push(mating);
				doodle = _pedigree.drawing.addDoodle('MemberConnector');
				doodle.setEdge(mating);
			}
			var relationship2 = new PD.Relationship(lastRelationshipIndex, coparent, child.index, 'parentChild', _pedigree);
			_pedigree.relationshipArray.push(relationship2);
			doodle = _pedigree.drawing.addDoodle('MemberConnector');
			doodle.setEdge(relationship2);
			
			// set x coord to midpoint between parents
			var midpoint = this.p.x;
			if (mates.length > 0) {
				// find member with index == coparent
				var found = false;
				var z = 0;
				while (!found && z<_pedigree.memberArray.length) {
					if (_pedigree.memberArray[z].index == coparent) {
						mate = _pedigree.memberArray[z];
						found = true;
					}
					z++;
				}
			}
			// push parents to array
			var rents = [this, mate];
			rents.sort(function(a, b) {
			    return parseFloat(a.p.x) - parseFloat(b.p.x);
			});
			midpoint = (rents[1].p.x - rents[0].p.x) * 0.5 + rents[0].p.x;
			child.p.x = midpoint; // probs not necessary as now hard coded to be in centre...
			
			// do after co parent so will be last doodle selected...
			_pedigree.memberArray.push(child);
			doodle = _pedigree.drawing.addDoodle('FamilyMember');
			doodle.setNode(child);
			doodle.setPropertyDefaults();
			
			// if has children, also create sibling relationship with existing children and new child
			var sharedOffspring = this.getSharedOffspring(coparent);
			if (sharedOffspring.length>0) {
				for (var n=0; n<sharedOffspring.length; n++) {
					if (sharedOffspring[n]!==child.index) {
						var sibship = new PD.Relationship(lastRelationshipIndex, sharedOffspring[n], child.index, 'sib', _pedigree);
						_pedigree.relationshipArray.push(sibship);
						doodle = _pedigree.drawing.addDoodle('MemberConnector');
						doodle.setEdge(sibship);	
						for (var m=0; m<_pedigree.memberArray.length; m++) {
							if (_pedigree.memberArray[m].index == sharedOffspring[n]) _pedigree.memberArray[m].singleton = false;
						}
					}				
				}
				child.singleton = false;
			}
			child.orphan = false; // TODO: why does this need to be reset again?!
            break;
            
            
        case 'mate':
        	var generationRank = this.generationRank;
			var isOrphan = true;
			
			//// _index, _name, _gender, _dob, _isProband, _disorders, _deceased, _IUFD, _adopted, _orphan, _singleton, _multipleBirth, _duplicateMember, _duplicateMaster, _generationRank, _p
			var pX = (_gender=='M') ? this.p.x-40 : this.p.x+40;
			var member = new PD.Member(index, '', _gender, '', false, null, false, false, false, isOrphan, true, false, generationRank, new PD.Vector(pX, this.p.y), this.pedigree);
			_pedigree.memberArray.push(member);
			doodle = _pedigree.drawing.addDoodle('FamilyMember');
			doodle.setNode(member);
			doodle.setPropertyDefaults();
			
			var relationship = new PD.Relationship(lastRelationshipIndex, this.index, member.index, 'mate', _pedigree);
			_pedigree.relationshipArray.push(relationship);
			doodle = _pedigree.drawing.addDoodle('MemberConnector');
			doodle.setEdge(relationship);
			
			newMember = member;
            break;
            
            
        default:
            break;
    
    }	
	
	if (_pedigree.generationsArray.indexOf(generationRank) < 0) {_pedigree.generationsArray.push(generationRank)}

	// order array in numberical order
	_pedigree.generationsArray.sort(function(a, b) {
		return a - b;
	});
	
	return newMember;
	
// 	createHTMLrow();
}


/*
 * Set flag to include/exclude nodes from force calculations
 * Returns Bool
 * TODO: change to internal and external significance (with customisable variables) using doodle for internal
 */
PD.Member.prototype.setSignificance = function() {
	var significant = true;
	if (!this.singleton && !this.isProband && this.disorders[0].status!=="Affected" && !this.affectedUnknownDisorder && this.disorders[1].status!=="Affected" && this.disorders[2].status!=="Affected" && this.disorders[3].status!=="Affected" && !this.deceased && !this.adoptedIn && !this.multipleBirth && this.personName == "" && this.dob == "" && !this.IUFD) {
		var mates = this.getMates();
		var offspring = this.getChildren();
		
		if (mates.length<1 && offspring.length<1) significant = false;
	}

	return significant;
}


PD.Member.prototype.setNodeVisibility = function() {
	var visible;
	
	if (this.pedigree.showAll) visible = true;
	else {
		for (var i=0; i<this.pedigree.disorderArray.length; i++) {
			if (this.disorders[i].memberOf == true && this.pedigree.disorderArray[i].visible) visible = true;
		};
	};
	
	this.visible = visible;
}


PD.Member.prototype.getDuplicateSibs = function() {
	var duplicateSibs = [];
	var sibs = this.getSiblingsNodes();
	for (var i=0; i<sibs.length; i++) {
		var sibling = sibs[i];
		if (sibling.gender == this.gender && !sibling.significant) duplicateSibs.push(sibling.index);
	}
	
	return duplicateSibs;
}
PD.Member.prototype.getDuplicateSibNodes = function() {
	var duplicateSibs = [];
	var sibs = this.getSiblingsNodes();
	for (var i=0; i<sibs.length; i++) {
		var sibling = sibs[i];
		if (sibling.gender == this.gender && !sibling.significant) duplicateSibs.push(sibling);
	}
	
	return duplicateSibs;
}
/*
 * Returns Array of other insignificant siblings of the same gender, ordered by reverse node index
 * The first node in the array will be used as the duplicateMaster, in all force calculations and define the coordinates of the duplicate sibs 
 */
PD.Member.prototype.setDuplicateSibs = function() {
	var duplicateSibs = this.getDuplicateSibNodes();
	
	if (duplicateSibs.length>1) {
		duplicateSibs.push(this);
		
		// order array by index
		duplicateSibs.sort(function(a, b) {
			return parseFloat(a.index) - parseFloat(b.index);
		});
		
		// set the most recently added node to be significant		
		var duplicateMaster = duplicateSibs[duplicateSibs.length - 1];
		duplicateMaster.significant = true;
		
		// for all nodes in the array, set the duplicateMaster
		for (var h=0; h<duplicateSibs.length; h++) {
			duplicateSibs[h].duplicateMaster = duplicateMaster;
			duplicateSibs[h].duplicateNumber = duplicateSibs.length;
			duplicateSibs[h].p.y = duplicateMaster.p.y;			
		}
		
		this.pedigree.nSignificantNodes -= (duplicateSibs.length);
	}
	else {
		// if only two similar siblings, both significant
		if (duplicateSibs.length>0) duplicateSibs[0].significant = true;
		this.significant = true;
	}
}


PD.Member.prototype.calculateSibshipMidpoint = function(_sibs) {
	var siblings = [];
	var sib;
	
	// get nodes
	for (var i=0; i<_sibs.length; i++) {
		var found = false;
		var n = 0;
		while (!found && n<pedigree.memberArray.length) {
			if (pedigree.memberArray[n].index == _sibs[i]) {
				siblings.push(pedigree.memberArray[n]);	
				found = true;
			}
			n++
		}
	}
	siblings.push(this);
	
	// order array of siblings by x coordinate
	siblings.sort(function(a, b) {
	    return parseFloat(a.p.x) - parseFloat(b.p.x);
	});
	
	var lastIndex = siblings.length -1;
	
	var first = siblings[0];
	var last = siblings[lastIndex];
	
	var midpoint = (last.p.x - first.p.x) * 0.5 + first.p.x;
	
	return midpoint;
}
	
PD.Member.prototype.ensureVisibleOnCanvas = function() {
	var currentXdis = this.pedigree.xDisplacement;
	var currentYdis = this.pedigree.yDisplacement;
	
	// off to the right -> shift pedigree to left
	if (this.doodle.originX > (this.doodle.drawing.canvas.width - PD.canvasBorder) / this.doodle.drawing.scale * 0.5) this.pedigree.xDisplacement += ((this.doodle.drawing.canvas.width - PD.canvasBorder) / this.doodle.drawing.scale * 0.5 - this.doodle.originX);
	// off to the left
	else if (this.doodle.originX < (this.doodle.drawing.canvas.width - PD.canvasBorder) / this.doodle.drawing.scale * -0.5) this.pedigree.xDisplacement += ((this.doodle.drawing.canvas.width - PD.canvasBorder) / this.doodle.drawing.scale * -0.5 - this.doodle.originX);
	// off the top -> shift pedigree down
	if (this.doodle.originY > (this.doodle.drawing.canvas.height - PD.canvasBorder) / this.doodle.drawing.scale * 0.5) this.pedigree.yDisplacement += ((this.doodle.drawing.canvas.height - PD.canvasBorder) / this.doodle.drawing.scale * 0.5 - this.doodle.originY);
	// off the bottom
	else if (this.doodle.originY < (this.doodle.drawing.canvas.height - PD.canvasBorder) / this.doodle.drawing.scale * -0.5) this.pedigree.yDisplacement += ((this.doodle.drawing.canvas.height - PD.canvasBorder) / this.doodle.drawing.scale * -0.5 - this.doodle.originY);

	var needReset = (currentXdis == this.pedigree.xDisplacement && currentYdis == this.pedigree.yDisplacement) ? false : true;
	return needReset;
}


/*
 * An edge
 * Type parentChild is the only directional edge (always from parent, to child) - with other type order of no significance
 */
PD.Relationship = function(_index, _fromIndex, _toIndex, _type, _pedigree) {
	
	this.index = _index;
    this.from = _fromIndex;
	this.to = _toIndex;
    this.type = _type;
    this.pedigree = _pedigree;
    
    this.significant = true;
    this.visible = true;
	this.adoption = false;
	
	this.bridgePoints=[];
    
    if (_index >= lastRelationshipIndex) lastRelationshipIndex = _index+1;
}

PD.Relationship.prototype.updateRelationship = function(_n) {    
    // reset parameters
    this.xOverhang = 0;
    this.sibshipXtra = 0;
	this.generationHeight = 0;
	var multiplePartnerFrom = 0;
	var multiplePartnerTo = 0;
	this.significant = true;
	this.bridgePoints = [];
	
	var fromNode;
    var toNode;
    var startPnt;
	var endPnt;
	
	// MSC TODO: change to stop when found (using foundCounter<2)
	for (var i = 0; i < pedigree.memberArray.length; i++) {
		if (pedigree.memberArray[i].index == this.from) {
			var fromNode = pedigree.memberArray[i];
			startPnt = pedigree.memberArray[i].p;
		}
		if (pedigree.memberArray[i].index == this.to) {
			var toNode = pedigree.memberArray[i];
			endPnt = pedigree.memberArray[i].p;
		}
	}
	
	// set significance
	//// && only update relationship parameters if BOTH involved nodes are significant
	if (!fromNode.significant || !toNode.significant) this.significant = false;
	if (this.significant) {	
		this.startX = (startPnt.x - 500) * pedigree.zoomFactor + pedigree.xDisplacement;
		this.startY = (startPnt.y - 500) * pedigree.zoomFactor + pedigree.yDisplacement;
		this.endX = (endPnt.x - 500) * pedigree.zoomFactor + pedigree.xDisplacement;
		this.endY = (endPnt.y - 500) * pedigree.zoomFactor + pedigree.yDisplacement;
		
		
		if (this.type == "parentChild") {
			var parents = toNode.getParents(); // child always to node in this relationship
			
			var spouseIndex = (this.from == parents.mother) ? parents.father : parents.mother;
			for (var j=0; j<pedigree.memberArray.length; j++) {
				if (spouseIndex == pedigree.memberArray[j].index) var spouse = pedigree.memberArray[j];
			}
			if (spouse) this.xOverhang = (((spouse.p.x - 500) * pedigree.zoomFactor + pedigree.xDisplacement) - this.startX) * 0.5;
			else this.xOverhang = 0;
			
			// ensure offspring of multigenerational matings rShip starts at midPoint of the two generations
			if (spouse) this.startY = ((startPnt.y - 0.5*(startPnt.y-spouse.p.y)) - 500) * pedigree.zoomFactor + pedigree.yDisplacement;
			this.generationHeight = PD.generationHeight * pedigree.zoomFactor;
	
			if (toNode.multipleBirth) {
				var wombMates = toNode.getWombMates();
				var midpoint = (toNode.calculateSibshipMidpoint(wombMates) - 500) * pedigree.zoomFactor + pedigree.xDisplacement;
				
				this.sibshipXtra = (midpoint - this.endX);
			}
			
			var conception;
			var found = false;
			var n=0;
			while (!found && n<pedigree.relationshipArray.length) {
				if (pedigree.relationshipArray[n].index == parents.rShipIndex) {
					conception = pedigree.relationshipArray[n];
					found = true;
				}
				n++;	
			};
			var fromParent;
			var toParent;
			if (this.from == conception.from) {
				fromParent = fromNode;
				toParent = spouse;
			}
			else {
				toParent = fromNode;
				fromParent = spouse;
			}
			var allPartnersFromParent = fromParent.getMates();
			var orderedAllPartnersFrom = fromParent.orderNodesByXdif(allPartnersFromParent, fromParent.p.x);
			var allPartnersToParent = toParent.getMates();
			var orderedAllPartnersTo = toParent.orderNodesByXdif(allPartnersToParent, toParent.p.x);
			
			this.multiplePartnerFrom = orderedAllPartnersFrom.indexOf(toParent.index) - 1;
			if (this.multiplePartnerFrom > 4) this.multiplePartnerFrom = 4; // max limit 4 due to physical limitations of node doodle dimensions
			this.multiplePartnerTo = orderedAllPartnersTo.indexOf(fromParent.index) - 1;
			if (this.multiplePartnerTo > 4) this.multiplePartnerTo = 4; // max limit 4 due to physical limitations of node doodle dimensions
			
			// if either partner is a multiple, co-partner flag must be at least 1...
			if (this.multiplePartnerFrom>0 && this.multiplePartnerTo<1) this.multiplePartnerTo = 1;
			else if (this.multiplePartnerTo>0 && this.multiplePartnerFrom<1) this.multiplePartnerFrom = this.multiplePartnerTo;
			
			if (conception.type == "mateConsang") this.startY += (PD.consangSeperationHeight * this.pedigree.zoomFactor);
		}
	
		else if (this.type == "sib") {
			this.generationHeight = PD.generationHeight * pedigree.zoomFactor;
		
			// if one of the nodes is of multipleBirth, alter of length of sibship line to midpoint of multipleBirth relation using sibshipXtra
			if (fromNode.multipleBirth) {
				var wombMates = fromNode.getWombMates();
				var midpoint = (fromNode.calculateSibshipMidpoint(wombMates) - 500) * pedigree.zoomFactor + pedigree.xDisplacement;
				this.sibshipXtra = midpoint - this.startX;
			}
			if (toNode.multipleBirth) {
				var wombMates = toNode.getWombMates();
				var midpoint = (toNode.calculateSibshipMidpoint(wombMates) - 500) * pedigree.zoomFactor + pedigree.xDisplacement;
				this.xOverhang = midpoint - this.endX;
			}
		}
		
		else if (this.type == "sibMZ" || this.type == "sibDZ") {
			var wombMates = toNode.getWombMates();
			this.sibshipXtra = ((toNode.calculateSibshipMidpoint(wombMates)) - 500) * pedigree.zoomFactor + pedigree.xDisplacement;
			
			this.generationHeight = PD.generationHeight * pedigree.zoomFactor;
		}
	
		else if (this.type =="mate" || this.type=="mateConsang" || this.type=="mateSep" || this.type=="mateDiv") {
			var allPartnersFrom = fromNode.getMates();
			var orderedAllPartnersFrom = fromNode.orderNodesByXdif(allPartnersFrom, startPnt.x);
			var allPartnersTo = toNode.getMates();
			var orderedAllPartnersTo = toNode.orderNodesByXdif(allPartnersTo, endPnt.x);
			
			this.multiplePartnerFrom = orderedAllPartnersFrom.indexOf(this.to) - 1;
			if (this.multiplePartnerFrom > 4) this.multiplePartnerFrom = 4; // max limit 4 due to physical limitations of node doodle dimensions
			this.multiplePartnerTo = orderedAllPartnersTo.indexOf(this.from) - 1;
			if (this.multiplePartnerTo > 4) this.multiplePartnerTo = 4; // max limit 4 due to physical limitations of node doodle dimensions
			
			// if either partner is a multiple, co-partner flag must be at least 1...
			if (this.multiplePartnerFrom>0 && this.multiplePartnerTo<1) this.multiplePartnerTo = 1;
			else if (this.multiplePartnerTo>0 && this.multiplePartnerFrom<1) this.multiplePartnerFrom = this.multiplePartnerTo;
			
		}
		
		// check to see if lines intersect with all previous relationships
		for (var a=0; a<_n; a++) {
			var previousRship = this.pedigree.relationshipArray[a];
			if (this.type=='parentChild') {
				var toSibs = toNode.getSiblings();
				// if single straight line: x = this.startX
// 				if (this.xOverhang + this.startX == this.endX + this.sibshipXtra) {
					if (toSibs.indexOf(previousRship.from)<0 && toSibs.indexOf(previousRship.to)<0 && previousRship.type=='sib' && previousRship.from!==this.to && previousRship.to!==this.to) {
					// if horizontal straight line: y = this.startY - this.generationHeight * 0.4
							// do lines intersect?
						if (((this.startX+this.xOverhang) > (previousRship.startX+previousRship.sibshipXtra) && (this.startX+this.xOverhang) < (previousRship.endX+previousRship.xOverhang))||((this.startX+this.xOverhang) < (previousRship.startX+previousRship.sibshipXtra) && (this.startX+this.xOverhang) > (previousRship.endX+previousRship.xOverhang)) && (this.startY>previousRship.startY)&&this.endY<previousRship.endY) {
/*
							var bridgeIndex = this.bridgePoints.length;
							this.bridgePoints[bridgeIndex] = new ED.Point(this.endX + this.sibshipXtra, this.endY - 0.4 * (this.generationHeight));
							previousRship.bridgePoints.push(new ED.Point(this.endX + this.sibshipXtra, this.endY - 0.4 * (this.generationHeight)));
							toNode.bridgeCap=true;
*/
						}
					}
// 				}
			}
/*
			else if (this.type=='sib') {
				var sibRents = toNode.getParents();
				// if single straight line: x = this.startX
// 				if (this.xOverhang + this.startX == this.endX + this.sibshipXtra) {
					if (previousRship.type=='parentChild' && previousRship.from!==this.to && previousRship.to!==this.to) {
					if (sibRents.mother!==previousRship.from&&sibRents.father!==previousRship.from) {
					// if horizontal straight line: y = this.startY - this.generationHeight * 0.4
							// do lines intersect?
						if (((previousRship.startX+previousRship.xOverhang) > (this.startX+this.sibshipXtra) && (previousRship.startX+previousRship.xOverhang) < (this.endX+this.xOverhang))||((previousRship.startX+previousRship.xOverhang) < (this.startX+this.sibshipXtra) && (previousRship.startX+previousRship.xOverhang) > (this.endX+this.xOverhang)) && (previousRship.startY<this.startY)&&previousRship.endY>this.endY) {
							var bridgeIndex = this.bridgePoints.length;
							this.bridgePoints[bridgeIndex] = new ED.Point(previousRship.endX + previousRship.sibshipXtra, previousRship.endY - 0.4 * (this.generationHeight));
							previousRship.bridgePoints.push(new ED.Point(previousRship.endX + previousRship.sibshipXtra, previousRship.endY - 0.4 * (previousRship.generationHeight)));
// 							toNode.bridgeCap=true;
						}
					}
					}
// 				}
			}
*/
		}
	}		
}


PD.Relationship.prototype.setEdgeSignificance = function() {
	this.significant = true;
	var found = false;
	var i = 0;
	
	while (i<this.pedigree.memberArray.length && !found) {
		var member = pedigree.memberArray[i]
		if ((member.index == this.from || member.index == this.to) && !member.significant) {
			this.significant = false;
			pedigree.nSignificantEdges -= 1;
			found = true;
		}
		i++;
	}	
}

PD.Relationship.prototype.setEdgeVisibility = function() {
	this.visible = true;
	
	var found = 0;
	var i = 0;
	
	while (i<this.pedigree.memberArray.length && found<2) {
		var member = this.pedigree.memberArray[i]
		if ((member.index == this.from || member.index == this.to)) {
			if (!member.visible) this.visible = false;
			found++;
		}
		i++;
	}
}

// apply attractive forces between connected nodes
PD.Relationship.prototype.applyHookesLaw = function() {
	var point1;
	var point2;
	for (var i = 0; i < pedigree.memberArray.length; i++) {
		if (pedigree.memberArray[i].index == this.from) point1 = pedigree.memberArray[i];
		if (pedigree.memberArray[i].index == this.to) point2 = pedigree.memberArray[i];
	}
	
	var spring = {
		length: 1,
		k: PD.kA,
	};
	
	if (this.type == "sib") spring.k = PD.kAsib;
	else if (this.type == "sibMZ" || this.type == "sibDZ") spring.k = PD.kAsibMB;
	else if (this.type == "mate" || this.type == "mateSep" || this.type == "mateConsang" || this.type=="mateDiv") spring.k = PD.kAmate;
	
	var d = point2.p.subtract(point1.p); // the direction of the spring
	var displacement = spring.length - d.magnitude();
	var direction = d.normalise();

	// apply force to each involved node
	point1.applyForce(direction.multiply(spring.k * displacement * -0.5));
	point2.applyForce(direction.multiply(spring.k * displacement * 0.5));
}



PD.Disorder = function(_value) {
	this.index = lastDisorderIndex;
	this.phenotype = _value;
	
	lastDisorderIndex++;	
}

// look-up associated code from various coding terminologies
PD.Disorder.prototype.lookUpCode = function(_terminology, _value) {
	var code;
	
	return code;
}

// TODO: functions may be part of OE EyeDraw already --> ED.Point ?
PD.Vector = function(_x, _y) {
	this.x = _x;
	this.y = _y;
}

PD.Vector.prototype.add = function(v2) {
	return new PD.Vector(this.x + v2.x, this.y + v2.y);
}

PD.Vector.prototype.subtract = function(v2) {
	return new PD.Vector(this.x - v2.x, this.y - v2.y);
}

PD.Vector.prototype.multiply = function(n) {
	return new PD.Vector(this.x * n, this.y * n);
}

// divides by parameter, n
	// && avoids 'dividing by 0' errors
PD.Vector.prototype.divide = function(n) {
	return new PD.Vector((this.x / n) || 0, (this.y / n) || 0);
}

// pythagorean distance
PD.Vector.prototype.magnitude = function() {
	return Math.sqrt(this.x*this.x + this.y*this.y);
}

// returns unit vector
PD.Vector.prototype.normalise = function() {
	return this.divide(this.magnitude());
}
