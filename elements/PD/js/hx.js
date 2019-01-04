var canvasHeight = 1001;
var canvasWidth = 1001;
var canvasEdit;
var drawingEdit;
var pedigree;
// var selectedDoodleIndex;
var activeRelationship = null;
var lastNodeIndex = 0;
var lastRelationshipIndex = 0;
var lastDisorderIndex = 0;
var inter;
var draggingCanvas = false;
var counter = 0;

var memberSet = [
	[0, '', "U", '', true, null, false, false, false, true, true, false, 0, new PD.Vector(0.5 * canvasWidth, 0.75 * canvasHeight)],
];

var relationshipSet = [
];

var disorderSet = [];

var geneSet = [];


function logData() {
// _index, _name, _gender, _dob, _isProband, _disorders, _deceased, _IUFD, _adopted, _orphan, _generationRank, _p
	console.log('Members:\n_index\t_gender\t_deceased\t_orphan\t_generationRank\t_pX\t_pY');
	for (var i=0; i<pedigree.memberArray.length; i++) {
		var m = pedigree.memberArray[i];
		console.log(m.index + '\t' + m.gender + '\t' + m.deceased + '\t' + m.orphan + '\t' + m.generationRank + '\t' + m.p.x + '\t' + m.p.y);
	}
	console.log('\nRelationships:\n_from\t_to\t_type\n');
	for (var j=0; j<pedigree.relationshipArray.length; j++) {
		var r = pedigree.relationshipArray[j];
		console.log(r.from + '\t' + r.to + '\t' + r.type);
	}
}


function savePedigree() {
	var cnvs = document.getElementById(pedigree.drawing.canvas.id);
    // set canvasImg image src to dataURL
	var dataURL = cnvs.toDataURL();

    this.href = dataURL;
}

function printPedigree() {
	pedigree.drawing.deselectDoodles();
	autoZoom();
	
	// open print dialogue
    window.print();
}


function autoZoom() {
	// get selected doodle
	var selDood = pedigree.drawing.selectedDoodle;
	
	// get min and max node points on each axis
	var minX;
	var minY;
	var maxX;
	var maxY;

	var c = 0;	
	for (var i=0; i<pedigree.memberArray.length; i++) {
		var node = pedigree.memberArray[i];
		node.setNodeVisibility();
		
		if (node.significant && node.visible) {
			if (c=="0") {
				minX = node.p.x;
				maxX = node.p.x;
				minY = node.p.y;
				maxY = node.p.y;
			}
			else {
				if (node.p.x<minX) minX = node.p.x;
				else if (node.p.x>maxX) maxX = node.p.x;
				if (node.p.y<minY) minY = node.p.y;
				else if (node.p.y>maxY) maxY = node.p.y;
			}
			c++;
		}
	}
	if (c=="0") {
		pedigree.drawFamily();
		return;	
	}
	var yDif = (maxY - minY);
	var xDif = (maxX - minX);
	
	
	// auto zoom	
	var difference = xDif;
	var d = pedigree.drawing.canvas.width / pedigree.drawing.scale;
	if (yDif>xDif) { 
		difference = yDif;
		d = pedigree.drawing.canvas.height / pedigree.drawing.scale;
	}
	
	if (difference == 0) pedigree.zoomFactor = PD.startZoom; // if only one node...
	else pedigree.zoomFactor = (d - PD.canvasBorder) / difference;
	if (pedigree.zoomFactor > PD.maxZoom) pedigree.zoomFactor = PD.maxZoom;
	
	// apply zoom
	pedigree.drawFamily();


	// get min and max node coordinates on each axis, in canvas plane (with applied zoom)
	var minX1;
	var minY1;
	var maxX1;
	var maxY1;
	
	var b = 0;
	for (var i=0; i<pedigree.memberArray.length; i++) {
		var node = pedigree.memberArray[i];
		if (node.significant && node.visible) {
			if (b=="0") {
				minX1 = node.doodle.originX;
				maxX1 = node.doodle.originX;
				minY1 = node.doodle.originY;
				maxY1 = node.doodle.originY;
			}
			if (node.doodle.originX<minX1) minX1 = node.doodle.originX;
			else if (node.doodle.originX>maxX1) maxX1 = node.doodle.originX;
			if (node.doodle.originY<minY1) minY1 = node.doodle.originY;
			else if (node.doodle.originY>maxY1) maxY1 = node.doodle.originY;
			
			b++;
		}
	}	
	
	// auto centre
	var cX1 = minX1 + 0.5 * (maxX1 - minX1);
	var cY1 = minY1 + 0.5 * (maxY1 - minY1);
	
	pedigree.xDisplacement -= cX1;
	pedigree.yDisplacement -= cY1;
	
	// apply centring
	pedigree.drawFamily();
	
	
	// reselect doodle if FamilyMember
	if (selDood && selDood.isNode) pedigree.drawing.selectDoodle(selDood);
	
}


function canvasZoomIn() {
	// get selected doodle
	var selDood = pedigree.drawing.selectedDoodle;
	
	pedigree.zoomFactor += 0.1;
	pedigree.drawFamily();
	
	// reselect doodle if FamilyMember
	if (selDood && selDood.isNode) pedigree.drawing.selectDoodle(selDood);
}
function startZoom () {
	inter=setInterval(canvasZoomIn, 100); 
}
function stopZoom() {
	clearInterval(inter);
}

function canvasZoomOut() {
	// get selected doodle
	var selDood = pedigree.drawing.selectedDoodle;
	
	pedigree.zoomFactor -= 0.1;
	if (pedigree.zoomFactor < 0.1) pedigree.zoomFactor = 0.1;
	pedigree.drawFamily();
	
	// reselect doodle if FamilyMember
	if (selDood && selDood.isNode) pedigree.drawing.selectDoodle(selDood);
}
function startZoomO () {
	inter=setInterval(canvasZoomOut, 100); 
}
function stopZoomO() {
	clearInterval(inter);
}

function moveCanvasUp() {
	// get selected doodle
	var selDood = pedigree.drawing.selectedDoodle;
	
	pedigree.yDisplacement += 10;
	pedigree.drawFamily();
	
	// reselect doodle if FamilyMember
	if (selDood && selDood.isNode) pedigree.drawing.selectDoodle(selDood);
}
function startU () {
	inter=setInterval(moveCanvasUp, 100); 
}
function stopU() {
	clearInterval(inter);
}

function moveCanvasDown() {
	// get selected doodle
	var selDood = pedigree.drawing.selectedDoodle;
	
	pedigree.yDisplacement -= 10;
	pedigree.drawFamily();
	
	// reselect doodle if FamilyMember
	if (selDood && selDood.isNode) pedigree.drawing.selectDoodle(selDood);
}
function startD () {
	inter=setInterval(moveCanvasDown, 100); 
}
function stopD() {
	clearInterval(inter);
}

function moveCanvasLeft() {
	// get selected doodle
	var selDood = pedigree.drawing.selectedDoodle;
	
	pedigree.xDisplacement += 10;
	pedigree.drawFamily();
	
	// reselect doodle if FamilyMember
	if (selDood && selDood.isNode) pedigree.drawing.selectDoodle(selDood);
}
function startL () {
	inter=setInterval(moveCanvasLeft, 100); 
}
function stopL() {
	clearInterval(inter);
}

function moveCanvasRight() {
	// get selected doodle
	var selDood = pedigree.drawing.selectedDoodle;
	
	pedigree.xDisplacement -= 10;
	pedigree.drawFamily();
	
	// reselect doodle if FamilyMember
	if (selDood && selDood.isNode) pedigree.drawing.selectDoodle(selDood);
}
function startR () {
	inter=setInterval(moveCanvasRight, 100); 
}
function stopR() {
	clearInterval(inter);
}

function dragCanvas(_point,_pedigree) {

	if (!_pedigree.draggingCanvas) {
		_pedigree.oldPx = _point.x;
		_pedigree.oldPy = _point.y;
		_pedigree.draggingCanvas = true;
		
		var x = (_pedigree.oldPx - _point.x) / 10;
		if (Math.abs(x)>3) pedigree.xDisplacement += x;
		//pedigree.yDisplacement += (oldPy - _point.y) / 10 * pedigree.drawing.scale;
		pedigree.drawFamily();
	}
	if (_pedigree.draggingCanvas) {
		_pedigree.xDisplacement -= (_pedigree.oldPx - _point.x);
		_pedigree.yDisplacement -= (_pedigree.oldPy - _point.y);
		_pedigree.drawFamily();
		_pedigree.oldPx = _point.x;
		_pedigree.oldPy = _point.y;
	}
}


function setCanvasToScreen() {
	var w = $(window).width() * 0.75;
    var h = $(window).height();
    
    $("#canvasRE").css("width", w + "px");
    $("#canvasRE").css("height", h + "px"); 

	pedigree.drawing.canvas.width = w;
    pedigree.drawing.canvas.height= h;
    if (pedigree.drawing.scaleOn == 'height') {
		pedigree.drawing.scale = h / 1001;
	} else {
		pedigree.drawing.scale = w / 1001;
	}
	if (pedigree.generationsDoodle) pedigree.generationsDoodle.originX = -0.5*pedigree.drawing.canvas.width/pedigree.drawing.scale+20;
	if (pedigree.disorderKey) pedigree.disorderKey.originX = -0.5*pedigree.drawing.canvas.width/pedigree.drawing.scale+20;
}

function createFamily() {
    // Create a pedigree object from member data
    pedigree = new PD.Pedigree(memberSet, relationshipSet, disorderSet, canvasEdit, drawingEdit, canvasWidth, canvasHeight);
    
    // Set canvas size to window
	setCanvasToScreen();

	// add member doodles
    for (var k=0; k<pedigree.memberArray.length; k++) {
		var member = pedigree.memberArray[k];
		// add doodle to canvas and link to node
        var doodle = pedigree.drawing.addDoodle('FamilyMember');
        member.doodle = doodle;
		doodle.setNode(member);
// 		doodle.setPropertyDefaults();
	}
	// add relationship doodles
	for (var i=0; i<pedigree.relationshipArray.length; i++) {
		var rShip = pedigree.relationshipArray[i];
		var doodle = pedigree.drawing.addDoodle('MemberConnector');
		doodle.setEdge(rShip);
	}
	// add disorder key doodle
// 	pedigree.drawing.addDoodle('PedigreeDisordersKey');
	pedigree.drawing.addDoodle('PedigreeGenerations');
	pedigree.generationsDoodle = pedigree.drawing.lastDoodleOfClass('PedigreeGenerations');
	pedigree.generationsDoodle.originX = -0.5*pedigree.drawing.canvas.width/pedigree.drawing.scale+20;
	
	// autozoom canvas
	autoZoom();
	autoZoom();
	
	pedigree.drawing.selectDoodle(pedigree.drawing.lastDoodleOfClass("FamilyMember"));
}       

// currently haven't assumed that when you add condition you want it selected for active node... probs should?
function addCondition(_disorder) {
	var condition = _disorder;
	var n=pedigree.disorderArray.length - 1;
	
	var parentContainer = document.getElementById('PD-condition-list');		
	createConditionRow(parentContainer, condition, n);
}

function addSibling(_gender, _order) {
	var siblingIndex = drawingEdit.selectedDoodle.pedigreeId;
	var sibling = drawingEdit.selectedDoodle.node;
	
	var newMember = sibling.addRelative('sib',_gender, pedigree);
	
	pedigree.drawFamily(newMember).done(function() {
		pedigree.drawing.deselectDoodles();
		var i = pedigree.drawing.doodleArray.length - 1;
		var doodle = pedigree.drawing.doodleArray[i];
// 		doodle.node.ensureVisibleOnCanvas();
		pedigree.drawing.selectDoodle(doodle);
	});
}

function addSpouse() {
	var spouseIndex = drawingEdit.selectedDoodle.pedigreeId;
	var spouseGender = drawingEdit.selectedDoodle.gender;
	var gender = (spouseGender == "Male") ? "F" : "M";
	
	var spouse = drawingEdit.selectedDoodle.node;
	var newMember = spouse.addRelative('mate', gender, pedigree);
	
	pedigree.drawFamily(newMember).done(function() {
		pedigree.drawing.deselectDoodles();
		var i = pedigree.drawing.doodleArray.length - 1;
		var doodle = pedigree.drawing.doodleArray[i];
		pedigree.drawing.selectDoodle(doodle);
	});
}

function addChild(_gender) {
	var parentId = drawingEdit.selectedDoodle.pedigreeId;
	var parent = drawingEdit.selectedDoodle.node;
	var newMember = parent.addRelative('child', _gender, pedigree);
	
	pedigree.drawFamily(newMember).done(function() {
		pedigree.drawing.deselectDoodles();
		var i = pedigree.drawing.doodleArray.length - 1;
		var doodle = pedigree.drawing.doodleArray[i];
		pedigree.drawing.selectDoodle(doodle);
	});
}

function addParents() {
	var childIndex = drawingEdit.selectedDoodle.pedigreeId;
	var child = drawingEdit.selectedDoodle.node;
	
	var newMember = child.addRelative('parents', "M", pedigree);
	
	pedigree.drawFamily(newMember).done(function() {
		pedigree.drawing.deselectDoodles();
		var i = pedigree.drawing.doodleArray.length - 1;
		var doodle = pedigree.drawing.doodleArray[i];
		pedigree.drawing.selectDoodle(doodle);
	});
}

function redefineRship(_drawing) {
	if (PD.LinkedNode1==null) {
		PD.LinkedNode1 = _drawing.selectedDoodle;
		PD.LinkedNode1.linked = true;
	}
	else {
		PD.LinkedNode2 = _drawing.selectedDoodle;
		PD.LinkedNode2.linked = true;
		showBlanket();
	}

}

function showBlanket() {
	document.getElementById('rType').focus(); // ?
	// search for relationship between two nodes
	var node1 = PD.LinkedNode1.pedigreeId;
	var node2 = PD.LinkedNode2.pedigreeId;
	var found = false;
	
	for (var i = 0; i < pedigree.relationshipArray.length; i++) {
		if (!found) {
			var rShip = pedigree.relationshipArray[i];
			if ((rShip.from == node1 && rShip.to == node2) || (rShip.to == node1 && rShip.from == node2)) {
				found = true;
				activeRelationship = pedigree.relationshipArray[i];
				document.getElementById('rType').value = activeRelationship.type;
			}
		}
	}
	document.getElementById('pd-blanket').style.display = 'block';	
}

function hideBlanket() {
	// reset menu
	document.getElementById('rType').value = "auto";
	document.getElementById('defineRelations').style.background = "rgba(255,255,255,1)";
	document.getElementById('defineLabel').style.display = 'none';
	document.getElementById('defineRelations').style.display = 'block';
	document.getElementById('pd-blanket').style.display = 'none';

	activeRelationship = null;
	PD.LinkedNode1 = null;
	PD.LinkedNode2 = null;
	
	$('.ed-doodle-popup').css( {zIndex: 1000});
	for (var i=0; i<pedigree.drawing.doodleArray.length; i++) {
		var dood = pedigree.drawing.doodleArray[i];
		dood.linked = false;
		dood.hasHoverMenu = true;
	}
	pedigree.checkConsang();
	pedigree.drawFamily();	
}

function setRship() {
	var selector = document.getElementById('defineRelations');
	var type = document.getElementById('rType').value;
	
	var node1;
	var node2;
	for (var z=0; z<pedigree.memberArray.length; z++) {
		if (pedigree.memberArray[z].index == PD.LinkedNode1.pedigreeId) node1=pedigree.memberArray[z];
		else if (pedigree.memberArray[z].index == PD.LinkedNode2.pedigreeId) node2=pedigree.memberArray[z];
	}
	
	var pdgr = node1.pedigree;
	
	if (type!=='auto') {
	// if type == parentChild, with sibs - but must have same BOTH parents?! **TODO**
	// if type == mate, don't associate with children as may be from a different marriage! **TODO**
		if (activeRelationship == null) {
	// **TODO** only creating new, associated relationships if it's a new link, not if you're redefining an old one as probs won't redefine a different type therefore appropriate rShips shoudl exist!! Risky...
			if (type == "sib" || type == "sibMZ" || type == "sibDZ") {
				// create links with any existing parents
				if (PD.LinkedNode1.orphan == false) {
					node2.orphan = false;
		        	var parents = node1.getParents();
		        	var father = new PD.Relationship(pedigree.relationshipArray.length, parents.father, PD.LinkedNode2.pedigreeId, 'parentChild', pdgr);
					pedigree.relationshipArray.push(father);
					doodle = pedigree.drawing.addDoodle('MemberConnector');
					doodle.setEdge(father);
					var mother = new PD.Relationship(pedigree.relationshipArray.length, parents.mother, PD.LinkedNode2.pedigreeId, 'parentChild', pdgr);
					pedigree.relationshipArray.push(mother);
					doodle = pedigree.drawing.addDoodle('MemberConnector');
					doodle.setEdge(mother);
	        	}
	        	else if (PD.LinkedNode2.orphan == false) {
		        	var parents = node2.getParents();
	        		var father = new PD.Relationship(pedigree.relationshipArray.length, parents.father, PD.LinkedNode1.pedigreeId, 'parentChild', pdgr);
					pedigree.relationshipArray.push(father);
					doodle = pedigree.drawing.addDoodle('MemberConnector');
					doodle.setEdge(father);
					var mother = new PD.Relationship(pedigree.relationshipArray.length, parents.mother, PD.LinkedNode1.pedigreeId, 'parentChild', pdgr);
					pedigree.relationshipArray.push(mother);
					node1.orphan = false;
					doodle = pedigree.drawing.addDoodle('MemberConnector');
					doodle.setEdge(mother);
	        	}
	        	// and any existing sibs
	        	var sibs1 = node1.getSiblings();
				var sibs2 = node2.getSiblings();
				
				var minGenNode = (node1.generationRank < node2.generationRank) ? node1 : node2;
				node1.generationRank = minGenNode.generationRank;
				node1.p.y = minGenNode.p.y;
				node2.generationRank = minGenNode.generationRank;
				node2.p.y = minGenNode.p.y;
				
	        	if (sibs1.length > 0) {
		        	for (var i = 0; i < sibs1.length; i++) {
			        	var y=0;
			        	var found = false;
			        	while (y<pedigree.memberArray.length && !found) {
		        			if (pedigree.memberArray[y].index == sibs1[i]) {
			        			pedigree.memberArray[y].generationRank = minGenNode.generationRank;
								pedigree.memberArray[y].p.y = minGenNode.p.y;
								
								if (PD.LinkedNode2.orphan == false) {
									// create relationships with mother and father
									pedigree.memberArray[y].orphan = false;
									
									var father = new PD.Relationship(pedigree.relationshipArray.length, parents.father, sibs1[i], 'parentChild', pdgr);
									pedigree.relationshipArray.push(father);
									doodle = pedigree.drawing.addDoodle('MemberConnector');
									doodle.setEdge(father);
									
									var mother = new PD.Relationship(pedigree.relationshipArray.length, parents.mother, sibs1[i], 'parentChild', pdgr);
									pedigree.relationshipArray.push(mother);
									doodle = pedigree.drawing.addDoodle('MemberConnector');
									doodle.setEdge(mother);
								}
								
								found = true;
							}
							y++;
			        	}
			        	
			        	// create relationship with sibling
			        	var rShip = new PD.Relationship(pedigree.relationshipArray.length, sibs1[i], PD.LinkedNode2.pedigreeId, 'sib', pdgr);
						pedigree.relationshipArray.push(rShip);
						doodle = pedigree.drawing.addDoodle('MemberConnector');
						doodle.setEdge(rShip);
		        	}
	        	}
	        	if (sibs2.length > 0) {
		        	for (var j = 0; j < sibs2.length; j++) {
			        	var z=0;
			        	var found = false;
			        	while (z<pedigree.memberArray.length && !found) {
		        			if (pedigree.memberArray[z].index == sibs2[j]) {
			        			pedigree.memberArray[z].generationRank = minGenNode.generationRank;
								pedigree.memberArray[z].p.y = minGenNode.p.y;
								
								if (PD.LinkedNode1.orphan == false) {
									// create relationships with mother and father
									pedigree.memberArray[z].orphan = false;
									
									var father = new PD.Relationship(pedigree.relationshipArray.length, parents.father, sibs2[j], 'parentChild', pdgr);
									pedigree.relationshipArray.push(father);
									doodle = pedigree.drawing.addDoodle('MemberConnector');
									doodle.setEdge(father);
									
									var mother = new PD.Relationship(pedigree.relationshipArray.length, parents.mother, sibs2[j], 'parentChild', pdgr);
									pedigree.relationshipArray.push(mother);
									doodle = pedigree.drawing.addDoodle('MemberConnector');
									doodle.setEdge(mother);
								}
								
								found = true;
							}
							z++;
			        	}
// 			        	if (PD.LinkedNode1.orphan == false) pedigree.memberArray[sibs2[j]].orphan = false;
			        	var rShip = new PD.Relationship(lastRelationshipIndex, sibs2[j], PD.LinkedNode1.pedigreeId, 'sib', pdgr);
						pedigree.relationshipArray.push(rShip);
						doodle = pedigree.drawing.addDoodle('MemberConnector');
						doodle.setEdge(rShip);
		        	}
	        	}
			}
			// parentChild relationShip directional and coparent required...
			if (type == 'parentChild') {
				var p = (PD.LinkedNode1.originY < PD.LinkedNode2.originY) ? PD.LinkedNode1.node : PD.LinkedNode2.node;
				var c = (p == PD.LinkedNode1.node) ? PD.LinkedNode2.node : PD.LinkedNode1.node;
				c.orphan = false;
				
				activeRelationship = new PD.Relationship(lastRelationshipIndex, p.index, c.index, type, pdgr);
				pedigree.relationshipArray.push(activeRelationship);
				doodle = pedigree.drawing.addDoodle('MemberConnector');
				doodle.setEdge(activeRelationship);
				
				// check if coparent exists, if not create one
				var m = p.getMates();
				var coparent;
				if (m.length>0) coparent = m[m.length-1];
				else {
					var gender = (p.gender == 'M') ? 'F' : 'M';
					p.addRelative('mate',gender, pedigree);
					m = p.getMates();
					if (m.length>0) coparent = m[m.length-1];
				}
				// also add rShip with coparent
				var rs2 = new PD.Relationship(lastRelationshipIndex, coparent, c.index, type, pdgr);
				pedigree.relationshipArray.push(rs2);
				var d = pedigree.drawing.addDoodle('MemberConnector');
				d.setEdge(rs2);
				
				// also check to see if child has any siblings and create rShips with parents...
				var otherOffspring = c.getSiblingsNodes();
				if (otherOffspring.length>0) {
					for (var n=0; n<otherOffspring.length; n++) {
						
						var o = otherOffspring[n];
						
						// create relationship with parent
						var pShip = new PD.Relationship(lastRelationshipIndex, p.index, o.index, 'parentChild', pdgr);
						pedigree.relationshipArray.push(pShip);
						d = pedigree.drawing.addDoodle('MemberConnector');
						d.setEdge(pShip);
							
						// and coparent
						var cpShip = new PD.Relationship(lastRelationshipIndex, coparent, o.index, 'parentChild', pdgr);
						pedigree.relationshipArray.push(cpShip);
						d = pedigree.drawing.addDoodle('MemberConnector');
						d.setEdge(cpShip);
						
						// and toggle orphan
						o.orphan = false;
						
					}
				}
			} 
			else activeRelationship = new PD.Relationship(lastRelationshipIndex, PD.LinkedNode1.pedigreeId, PD.LinkedNode2.pedigreeId, type, pdgr);
			pedigree.relationshipArray.push(activeRelationship);
			doodle = pedigree.drawing.addDoodle('MemberConnector');
			doodle.setEdge(activeRelationship);
		}
		// otherwise if already exists just update relationship type
		else activeRelationship.type = type;
		
		if (type == "sib" || type == "sibMZ" || type == "sibDZ") {
			node1.singleton = false;
        	node2.singleton = false;
        	
        	if (type == "sibMZ" || type == "sibDZ") {
	        	if (node1.multipleBirth || node2.multipleBirth) {
		        	var multiplet = (node1.multipleBirth) ? node1 : node2;
		        	var other = (node1.multipleBirth) ? node2 : node1;
		        	
		        	var wombMates = multiplet.getWombMates();
		        	
		        	for (var h = 0; h < wombMates.length; h++) {
			        	var found = false;
			        	for (var i = 0; i < pedigree.relationshipArray.length; i++) {
				        	if (!found) {
					        	if ((pedigree.relationshipArray[i].from == other.index && pedigree.relationshipArray[i].to == wombMates[h]) || (pedigree.relationshipArray[i].to == other.index && pedigree.relationshipArray[i].from == wombMates[h])) {
						        	pedigree.relationshipArray[i].type = type;
						        	found = true;
					        	}
					        }	
			        	}
		        	}
		        	
	        	}
	        	node1.multipleBirth = true;
				node2.multipleBirth = true;
        	}
        }

		hideBlanket();
	}
	else selector.style.background = "#ead3d3";
}

function redo() {
	pedigree.recalculatePositions().done(
		function() {
			pedigree.drawFamily();
		}
	);
}
function toggleShowAllMembers(_this) {
	var status;
	if ($(_this).hasClass("show")) {
		status = false;
		$(_this).removeClass("show");
	}
	else {
		status = true;
		// check all disorder keys checked
		$(".PD-condition-row").addClass("show");
	}
	pedigree.setVisibility("all", status);
}

function createConditionRow(_parentContainer, _condition, _n) {
	
	var childDiv = document.createElement("div");
	childDiv.className = "PD-condition-row show";
// 	childDiv.id = _condition + '-key';
	_parentContainer.appendChild(childDiv);
	
	var rowContents = "<span class='PD-condition-key'></span>" + _condition /* + " (<span id='conditionAffected" + _n + "'>unknown <i>N</i></span> affected)" */;
// 	var rowContents = "<span class='PD-condition-key'></span>" + _condition + " (<span id='conditionAffected" + _n + "'>unknown <i>N</i></span> affected of <span id='conditionMembers" + _n + "'>>unknown <i>N</i></span>)";

	childDiv.innerHTML = rowContents;
	
	// add disorder to pedigree
	var pedigreeDisorder = pedigree.disorderArray[_n-1];
	pedigreeDisorder.element = childDiv;
	pedigreeDisorder.visible = true;
	
	if (_n==1) pedigree.disorderKey = pedigree.drawing.addDoodle('PedigreeDisordersKey');
	pedigree.disorderKey.setDisorderKey(pedigree);
	pedigree.drawing.deselectDoodles();

	// create control doodle parameters
// 	for (var i=0; i<pedigree.memberArray.length; i++) {
/*
		var doodle = pedigree.memberArray[i].doodle;
		// disorder
		var dsrdr = "disorder" + _n;
		doodle.parameterValidationArray[dsrdr] = {
			kind: 'derived',
			type: 'bool',
			attribute: 'table-column',
			animate: true
		};
		var dL = {
			dsrdr : _condition,
		}
		doodle.controlParameterArray[dsrdr] = _condition;
*/
/*
		// status
		var dS = "disorderStatus" + _n;
		doodle.parameterValidationArray[dS] = {
			kind: 'derived',
			type: 'string',
			list: ['Unknown','Affected', 'Unaffected'],
			animate: false
		};
		doodle.controlParameterArray[dS] = "Status";
		// onset age
		var dO = "disorderOnset" + _n;
		doodle.parameterValidationArray[dO] = {
			kind: 'derived',
			type: 'freeText',
			animate: false
		};
		doodle.controlParameterArray[dO] = "Onset age";
		// gene
		var dG = "disorderGene" + _n;
		doodle.parameterValidationArray[dG] = {
			kind: 'derived',
			type: 'freeText',
			animate: false
		};
		doodle.controlParameterArray[dG] = "Gene";
*/
// 	}
	var currentDoodle = pedigree.drawing.selectedDoodle;
	pedigree.drawFamily(); // redraw to update N affected & total members for new disorder
	if (currentDoodle) pedigree.drawing.selectDoodle(currentDoodle);
	
/*
	childDiv.addEventListener('click', function() {
		var status = true;
		if ($(this).hasClass("show")) {
			$(this).removeClass("show");
			$("#pdShowAllKey").removeClass("show");
			status = false;
		}
		else $(this).addClass("show");
		
		pedigree.setVisibility(_condition, status, _n);
	});
*/
}

function setLabel() {
	
	pedigree.labelContent = {
		aa_pdId:false,
		names: false,
		age: false,
		disorders: false,
		comments: false
	}
	
	var values = $('#labelOptions').val();
	
	if (values) {
		for (var i=0; i<values.length; i++) {
			var item = values[i];
			pedigree.labelContent[values[i]] = true;
		}
	}
	pedigree.drawFamily();	
}
function defineLabel() {
	document.getElementById('pd-blanket').style.display = 'block';
	document.getElementById('defineLabel').style.display = 'block';
	document.getElementById('defineRelations').style.display = 'none';
}

function defineNewCondition() {
	var txtBox = document.createElement('input');
	txtBox.type = 'text';
	txtBox.className = 'PD-disorder-define';
	txtBox.id = 'defineDisorderTxt';
	
	document.getElementById('newCondition').appendChild(txtBox);
	txtBox.addEventListener("keyup", function(e) {
		if (e.keyCode == 13) addNewCondition();
	});
	
	var btn = document.createElement('div');
	btn.className = 'PD-add-button';
	btn.innerHTML = '+';
	btn.id = 'addDisorderBtn';
	
	document.getElementById('newCondition').appendChild(btn);
	btn.addEventListener("click", function(){
		addNewCondition();
	});
	
	txtBox.focus();
}
function addNewCondition() {
	
	var txtBox = document.getElementById('defineDisorderTxt');
	var condition = txtBox.value;
	
	if (condition!=="") {
		var disorder = {
			"value" : condition,			
		};
		pedigree.disorderArray.push(disorder);
		
		var n = pedigree.disorderArray.length;

		var parentContainer = document.getElementById('PD-condition-list');		
		var child;
		if (n==1) {
			// remove 'no disorders' warning
			child = document.getElementById('PD-condition-empty');
			parentContainer.removeChild(child);
		}
		else if (n==4) {
			// remove add disorder as currently limited to 4 ** TODO - does it need to be?
			child = document.getElementById('newCondition');
			document.getElementById('conditionSidebarContents').removeChild(child);
			if (pedigree.drawing.selectedDoodle) {
				var dood = pedigree.drawing.selectedDoodle;
				pedigree.drawing.deselectDoodles();
				pedigree.drawing.selectDoodle(dood);
			}
		}
		
		createConditionRow(parentContainer, condition, n);
			
		var btn = document.getElementById('addDisorderBtn');
		document.getElementById('newCondition').removeChild(btn);
		document.getElementById('newCondition').removeChild(txtBox);
		
		// move pedigree members box down
		document.getElementById('peddigreeMembersBox').style.top = 140 + (n-1)*20 + 'px';
		
		// deselct & reselect doodle
		if (pedigree.drawing.selectedDoodle) {
			var dood = pedigree.drawing.selectedDoodle;
			pedigree.drawing.deselectDoodles();
			pedigree.drawing.selectDoodle(dood);
		}
	}
}
function createConditionList() {
	var parentContainer = document.getElementById('PD-condition-list');
	
	if (pedigree.disorderArray.length<1) {
		parentContainer.innerHTML = "<div id='PD-condition-empty'><i>No associated disorders</i></div>"
	}
	else {
		for (var i=0; i<pedigree.disorderArray.length; i++) {
			var n=i+1;
			createConditionRow(parentContainer, pedigree.disorderArray[i].value, n);			
		}
		
		// change top of pedigrees box
		var m = pedigree.disorderArray.length;
		document.getElementById('peddigreeMembersBox').style.top = 120 + (m-1)*20 + 'px';
	}
}

function createSidebar() {
	createConditionList();
	createHTMLrow();
}

function romanize (num) {
    if (!+num)
        return false;
    var digits = String(+num).split(""),
        key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM",
               "","X","XX","XXX","XL","L","LX","LXX","LXXX","XC",
               "","I","II","III","IV","V","VI","VII","VIII","IX"],
        roman = "",
        i = 3;
    while (i--)
        roman = (key[+digits.pop() + (i * 10)] || "") + roman;
    return Array(+digits.join("") + 1).join("M") + roman;
}

function createHTMLrow() {
	var parent = document.getElementById('pedigreeMemberList');
	parent.innerHTML = "";
	
	var childDivs = [];
	
	for (var i=0; i<pedigree.memberArray.length; i++) {
		var member = pedigree.memberArray[i]; 

		if (member.significant && member.doodle && member.visible) {
			var div = document.createElement("div");
			div.id = member.index + 'Row';
			div.className = "PD-sidebar-content PD-sidebar-member-row";
			
			var generation = romanize(pedigree.generationsArray.indexOf(member.generationRank) + 1);
			// find all members with equivalent generationRank
			var thisGen = [];
			for (var j=0; j<pedigree.memberArray.length; j++) {
				if (pedigree.memberArray[j].significant && pedigree.memberArray[j].generationRank == member.generationRank && pedigree.memberArray[j].index!==member.index) thisGen.push(pedigree.memberArray[j].index);
			}
			// sort members by X coord
			var orderedNodes = member.orderNodesByX(thisGen);
			// return index of member from ^^ + 1
			var generationN = orderedNodes.indexOf(member.index) + 1;
			
			if (generation==false) generation=1;
			member.aa_pdId = generation + '.' + generationN;
			
			var content = "<span id='" + member.index + "HeaderId' class='PD-row-header-first'>" + member.aa_pdId + "</span><span id='" + member.index + "HeaderName' class='PD-row-field-header'>" + member.personName + "</span><span class='PD-member-row-header-field' id='"  + member.index + "HeaderGender'>" + member.gender + "</span><span class='PD-member-row-header-field' id='" + member.index + "HeaderDob'>" + member.dob + "</span>";
			div.innerHTML = content;
			
			div.generation = generation;
			div.genN = generationN;
			div.pedigreeIndex = member.doodle.id;
			childDivs.push(div);
		}
	}
	
/*
	for (var z=0; z<pedigree.drawing.doodleArray.length; z++) {
		if (pedigree.drawing.doodleArray[z].className = 'pedigreeMember') {
			pedigree.drawing.doodleArray[z].setNode();
		}
	}
*/
	
	// order divs by generation, then by x coord
	childDivs.sort(function (a, b) {	
	    if(a.generation == b.generation) return (a.genN < b.genN) ? -1 : (a.genN > b.genN) ? 1 : 0;
	    else return (a.generation < b.generation) ? -1 : 1;
	});
	
	for (var h=0; h<childDivs.length; h++) {
		parent.appendChild(childDivs[h]);
		childDivs[h].addEventListener("mouseleave", function unhighlightNode() {
			if (!pedigree.drawing.selectedDoodle) {
				var k=0; 
				var found = false;
				while (!found && k<pedigree.drawing.doodleArray.length) {
					var doodle = pedigree.drawing.doodleArray[k];
					if (doodle.id == this.pedigreeIndex) {
						found = true;
						doodle.highlight = false;
						doodle.selectedInTable = false;
						pedigree.drawing.repaint();
					}
					k++;
				}
				createHTMLrow();
			}
		});
		childDivs[h].addEventListener("mouseenter", function highlightNode() {
			if (!pedigree.drawing.selectedDoodle) {
				var k=0; 
				var found = false;
				while (!found && k<pedigree.drawing.doodleArray.length) {
					var doodle = pedigree.drawing.doodleArray[k];
					if (doodle.id == this.pedigreeIndex) {
						found = true;
						doodle.highlight = true;
						doodle.selectedInTable = true;
						doodle.expandMemberTableRow();
						pedigree.drawing.repaint();
					}
					k++;
				}
			}
		});	
	}
}

// Controller class
function eyeDrawController() {
    drawingEdit = ED.Checker.getInstanceByIdSuffix('Hx');
    this.drawing = drawingEdit;

    // Specify call back function
    this.callBack = callBack;
    
    // Register for notifications with drawing object
    this.drawing.registerForNotifications(this, 'callBack', []);

    // Method called for notification
    function callBack(_messageArray) {
        switch (_messageArray['eventName']) {
            // Eye draw image files all loaded
            case 'ready':
                break;
                
            case 'doodleAdded':
//                 console.log('doodle added');
                break;					

            case 'doodleDeleted':
/*
	            var doodle = pedigree.drawing.lastSelectedDoodle;
                if (doodle.className = "FamilyMember") {
	                var children = doodle.node.getChildren();
	                if (children) {
		                alert("Cannot delete a family member with children");
						// readd doodle to canvas
						
						return;
		            }
	                else {
		                // remove from pedigree member array
	                
						// remove all associated relationships
						for (var j=0; j<doodle.node.pedigree.relationshipArray.length; j++) {
							var rShip = doodle.node.pedigree.relationshipArray[j];
							if (rShip.from == doodle.familyId || rShip.to == doodle.familyIf) {
								
							}
						}
					}
                }
*/
                break;	
                                        
            case 'parameterChanged':
                //console.log('parameterChanged');
                var param = _messageArray['object']['parameter'];
                var doodle = _messageArray['selectedDoodle'];
//                 console.log(doodle.parameterValidationArray[param]['attribute']);
                
                // limits to 4 disorders
                if (param == "disorder1" || param == "disorder2" || param == "disorder3" || param == "disorder4") doodle.node.pedigree.drawFamily();
                doodle.drawing.selectDoodle(doodle);
                
                if (param == 'dob') {
	                var doodle = _messageArray['selectedDoodle'];
	                doodle.node.pedigree.nSignificantNodes += 1;
	                doodle.node.pedigree.drawFamily();
	                doodle.drawing.selectDoodle(doodle);
	            }
                
                break;
                
            case 'mouseup':
                //console.log('mouseUp');
                break;
              
            case 'doodleSelected':
            	var dood = _messageArray['selectedDoodle'];
            	
/*
            	if (!dood.significant) {
	            	pedigree.drawing.deselectDoodles();
	            	return;
	            }
*/
            	// ^^ shouldn't happen ever...
            	
				if (dood.highlight) dood.highlight = false;	
							
				if (dood.className == "FamilyMember") {
					pedigree.drawing.moveToFront();					
					dood.drawing.canvas.style.cursor = "pointer";
					dood.moveMemberTableRow();
					dood.editMemberTableRow();

				}
				break;
			
			case 'doodleDeselected':
				if (!pedigree.drawing.selectedDoodle) { 
					createHTMLrow();
					if (draggingCanvas) pedigree.drawing.canvas.style.cursor = "-webkit-grabbing";
					else pedigree.drawing.canvas.style.cursor = "-webkit-grab";
				}
				else pedigree.drawing.canvas.style.cursor = "pointer";
				break;
        }
    }
    // Create pedigree and draw it
	createFamily();

    createSidebar();
    
	autoZoom();    

    // resize the canvas to fill browser window dynamically
	$(window).bind("resize", function(){
		setCanvasToScreen();
		pedigree.drawFamily();
	});
	
// 	document.getElementById('saveBtn').addEventListener('click', savePedigree, false);

	function download() {
		pedigree.drawing.deselectDoodles();
		autoZoom();
	    		
		// create image
		var cnvs = document.getElementById(pedigree.drawing.canvas.id);
	    var dt = cnvs.toDataURL();
	    
	    var html = "<html><head></head><body><div><img src='" + dt + "'></div></body></html>";
	    
/*
		var newTab = window.open(dt, 'Image');
		newTab.focus();
*/
           var w = window.open("", "");
		   $(w.document.body).html(html);
//         console.log(html);
        
	    
	};
	downloadLnk.addEventListener('click', download, false);

	document.getElementById("downloadLnk").addEventListener("click", download);

	document.getElementById("canvasCentre").addEventListener("click", autoZoom);
	
	document.getElementById("canvasZoomIn").addEventListener("click", canvasZoomIn);
	document.getElementById("canvasZoomIn").addEventListener("mousedown", startZoom);
	document.getElementById("canvasZoomIn").addEventListener("mouseup", stopZoom);
	
	document.getElementById("canvasZoomOut").addEventListener("click", canvasZoomOut);
	document.getElementById("canvasZoomOut").addEventListener("mousedown", startZoomO);
	document.getElementById("canvasZoomOut").addEventListener("mouseup", stopZoomO);
	
	document.getElementById("canvasMoveUp").addEventListener("click", moveCanvasUp);
	document.getElementById("canvasMoveUp").addEventListener("mousedown", startU);
	document.getElementById("canvasMoveUp").addEventListener("mouseup", stopU);
	
	document.getElementById("canvasMoveDown").addEventListener("click", moveCanvasDown);
	document.getElementById("canvasMoveDown").addEventListener("mousedown", startD);
	document.getElementById("canvasMoveDown").addEventListener("mouseup", stopD);
	
	document.getElementById("canvasMoveLeft").addEventListener("click", moveCanvasLeft);
	document.getElementById("canvasMoveLeft").addEventListener("mousedown", startL);
	document.getElementById("canvasMoveLeft").addEventListener("mouseup", stopL);
	
	document.getElementById("canvasMoveRight").addEventListener("click", moveCanvasRight);
	document.getElementById("canvasMoveRight").addEventListener("mousedown", startR);
	document.getElementById("canvasMoveRight").addEventListener("mouseup", stopR);
}