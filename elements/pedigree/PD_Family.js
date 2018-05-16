/**
 * Defines the Pedigree namespace
 * @namespace Namespace for all Pedigree classes
 */
if (PD == null || typeof(PD) != "object") { var PD = new Object();}

//var level = 0;

/*
 * Node dimensions and separation
 */
PD.NodeWidth = 2;
PD.NodeHeight = 2;
PD.PairWidth = 2;   // No separation around a pair node, so this setting is equivalent to separation between members of a pair
PD.SiblingSeparation = 2;
PD.SubTreeSeparation = 2;
PD.LevelSeparation = 4; // Distance between y coordinates of each level

/*
 * Padding around tree
 */
PD.PaddingLeft = 2;
PD.PaddingTop = 2;
PD.PaddingRight = 2;
PD.PaddingBottom = 2;

/*
 * Tree separation
 */
PD.TreeSeparation = 4;

/*
 * Scaling factor along x-axis to convert from tree plane to canvas plane
 */
PD.Scale = 16;
PD.XScale = 16;
PD.YScale = 16;

/*
 * Other dimensions
 */
PD.HaloMargin = 5;      // Margin from symbol to halo in canvas pixels

/*
 * Colours
 */
PD.SymbolColour = "gray";
PD.FontColour = "gray"
PD.ConnectionColour = "blue";
PD.LinkColourFemale = "pink";
PD.LinkColourMale = "lightblue";
PD.LinkColourUnknown = "lightgray";

/**
 * Gender
 */
// PD.Gender =  {
//     Female:0,
//     Male:1,
//     Unknown:2
// }

/*
 * Type of node in tree
 */
PD.NodeType = {
    Female:0,
    Male:1,
    Unknown:2,
    PlaceHolder:3,
    Pair:4,
    Root:5,
    Link:6,
}

/*
 * A family tree representing all members of a pedigree, including partners
 *
 * @property {String} name Name of the family
 * @property {Array} familyArray Stores the families list as pairs on names and family object
 
 */
PD.Family = function(_memberSet, _canvas, _drawing) {
    this.canvas = _canvas;
    this.drawing = _drawing;
    this.memberArray = new Array();
    this.pairArray = new Array();               // Array of PD.Pair objects
    this.descentArray = new Array();            // Array of descents making up this family
    this.selectedPerson = null;                 // The person object that the user has selected with the mouse
    this.duplicatePersonArray = new Array();    // Array of duplicate person objects (populated by createDescents method)
    this.isEditable = true;
    this.xScale = PD.XScale;
    this.yScale = PD.YScale;
    
    // Associative array linking name to member (used for assigning relationships)
    var nameToMemberArray = new Array();
    
    var i;
   
    // First iteration adding members to member array and populating nameToMemberArray
    for (i = 0; i < _memberSet.length; i++)
    {        
        // Create a new member and it to the member array
        var member = new PD.Member(i, _memberSet[i].name, _memberSet[i].gender, _memberSet[i].age, _memberSet[i].isProband, _memberSet[i].affected, _memberSet[i].deceased, _memberSet[i].condition);
        this.memberArray.push(member);
        
        // Add entry to associative array
        nameToMemberArray[member.name] = member;
    }

    // Second iteration adding relationships, and deriving gender
    for (i = 0; i < _memberSet.length; i++)
    {
        // Get member for this name
        var member = nameToMemberArray[_memberSet[i].name];

        // Set parents of this member and derive gender where possible
        if (typeof nameToMemberArray[_memberSet[i].mother] != 'undefined' && typeof nameToMemberArray[_memberSet[i].father] != 'undefined')
        {            
            // Get mother
            var mother = nameToMemberArray[_memberSet[i].mother];
            
            // Check gender and correct if necessary
            if (mother.gender != 'F')
            {
                console.log("ERROR - inconsistent data set. Gender reassigned for " + mother.name);
                mother.gender = 'F';
            }
            
            // Assign mother to this member
            member.mother = mother;
            
            // Add this member to childArray of mother
            mother.childArray.push(member);
            
            // Get father
            var father = nameToMemberArray[_memberSet[i].father];
            
            // Check gender and correct if necessary
            if (father.gender != 'M')
            {
                console.log("ERROR - inconsistent data set. Gender reassigned for " + father.name);
                father.gender = 'M';
            }
            
            // Assign father to this member
            member.father = father;     
            
            // Add this member to childArray of father
            father.childArray.push(member);
            
            // Add parents to partner array of each
            mother.addPartner(father);
            father.addPartner(mother);
            
            // Set hasNoAncestors flag
            member.hasNoAncestors = false;
        }
        else if (typeof nameToMemberArray[_memberSet[i].mother] == 'undefined' && typeof nameToMemberArray[_memberSet[i].father] == 'undefined')
        {
            // Set hasNoAncestors flag
            member.hasNoAncestors = true;
            continue;
        }
        else
        {
            console.log("ERROR - inconsistent data set. One parent missing for " + member.name);
        }
    }

    /*
     * At this point we have an arrray containing all known information for each member (mother, father, children)
     */
    
    // Put children into order of descending age
    for (i = 0; i < this.memberArray.length; i++)
    {
        var member = this.memberArray[i];
        
        member.sortChildrenByAgeDescending();
    }

    // Third iteration looking for roots of descents, and populating pair array
    for (i = 0; i < this.memberArray.length; i++)
    {
        var member = this.memberArray[i];
        
        for (var j in member.partnerArray)
        {
            if (member.gender == 'F')
            {
                var female = member;
                var male = member.partnerArray[j];
            }
            else
            {
                var male = member;
                var female = member.partnerArray[j];
            }
            
            // Create a new pair
            if (!this.pairArrayContains(female, male))
            {
                var isRoot = (female.hasNoAncestors && male.hasNoAncestors);
                
                // Create new pair
                var pair = new PD.Pair(female, male, isRoot)
                
                // Pair child array contains members common to child array of each parent
                for (var k = 0; k < female.childArray.length; k++)
                {
                    var child = female.childArray[k];
                    
                    for (var l = 0; l < male.childArray.length; l++)
                    {
                        if (child.index == male.childArray[l].index)
                        {
                            pair.childArray.push(child);
                        }
                    }
                }
                
                // Add to array
                this.pairArray.push(pair);
            }
        }
    }
    
    // Sort pair array putting potential consanguineous pairs last
    
    // Iterate through pair array creating a descent for each root pair
    for (i in this.pairArray)
    {
        var pair = this.pairArray[i];
        
        // Create a new descent for root pairs
        if (pair.isRoot)
        {
            var descent = new PD.Descent(this, pair);
            this.descentArray.push(descent);                    
        }
    }


}

PD.Family.prototype.preOrderTraversal = function(_member) {
    //console.log(_member.name + ":" + _member.index);

    for (var i in _member.childArray)
    {
        this.preOrderTraversal(_member.childArray[i]);
    }
}

/*
 * Carries out level order tranversal
 */
PD.Family.prototype.levelOrderTraversal = function(_member) {
    var queue = new Queue();
    var index = 0;
    var tempMemberArray = new Array();
    
    queue.enqueue(_member);
    while (queue.getLength() != 0)
    {
        var member = queue.dequeue();
        
        // Store node in temporary array in level traversal order
        tempMemberArray[index] = member;
        
        //console.log(member.name + " : " + member.age);
        
        // Increment index
        index++;
        
        // Continue with next node
        for (var i = 0; i < member.childArray.length; i++)
        {
            queue.enqueue(member.childArray[i]);
        }
    }
}


/*
 * Checks whether a pair is already in the array
 */
PD.Family.prototype.pairArrayContains = function(_female, _male) {
    returnValue = false;
    
    for (var i = 0; i < this.pairArray.length; i++)
    {
        var pair = this.pairArray[i];
        
        if (pair.female.index == _female.index && pair.male.index == _male.index)
        {
            returnValue = true;
            break;
        }
    }
    
    return returnValue;
}

/*
 * Scans pair array for next pair that contains the member which is not already in a descent
 * The order of delivery is arbitrary, meaning that there is no logic behind the choice of pairs for 
 * a member with multiple partners
 *
 * @param {PD.Member} _member The member to check for
 *
 * @returns {PD.Pair} The pair containing the member, or false if no result
 */
PD.Family.prototype.nextPairContainingMember = function(_member) {
    // Return value
    var nextPair = false;
    
    // Go through family pair array looking for pairs containing this member
    for (var i in this.pairArray)
    {
        var pair = this.pairArray[i];
        
        if (_member.gender == 'F')
        {
            if (pair.female.index == _member.index && !pair.isInTree)
            {
                nextPair = pair;
                pair.isInTree = true;
                break;
            }
        }
        else
        {
            if (pair.male.index == _member.index && !pair.isInTree)
            {
                nextPair = pair;
                pair.isInTree = true;
                break;
            }                    
        }
    }
    
    return nextPair;
}



/*
 * Draws all branches
 */
PD.Family.prototype.repaint = function() {
    // Resetting a dimension attribute clears the canvas and resets the context
	this.canvas.width = this.canvas.width;
	
	// But, might not clear canvas, so do it explicitly
	this.canvas.getContext('2d').clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw links between duplicates (before nodes so that link stops at boundary of node)
    //this.drawDuplicateLinks();
    
    // Draw nodes and connections for each descent
    for (var i in this.descentArray)
    {
        // Draw nodes
        this.descentArray[i].drawNodes();
        
        // Draw connections
        this.descentArray[i].drawConnections();
    }
}



/*
 * A member of a pedigree
 */
PD.Member = function(_index, _name, _gender, _age, _isProband, _affected, _deceased, _condition) {
    this.index = _index;
    this.name = _name;
    
    switch (_gender)
    {
        case 'F':
            this.gender = 'F';
            break;
        case 'M':
            this.gender = 'M';
            break;
        default:
            this.gender = 'U';
            break;
    }
    
    this.age = _age;
    
    if (typeof(_isProband) != 'undefined') {
    	this.isProband = _isProband;
    }
    else {
    	this.isProband = false;
    }
    
    if (typeof(_affected) != 'undefined') {
    	this.affected = _affected;
    }
    else {
    	this.affected = false;
    }
    
    if (typeof(_deceased) != 'undefined') {
    	this.deceased = _deceased;
    }
    else {
    	this.deceased = false;
    }

    if (typeof(_condition) != 'undefined') {
    	this.condition = _condition;
    }
    else {
    	this.condition = '';
    }
    
    this.father = null;
    this.mother = null;
    this.childArray = new Array();          // Biological children
    this.partnerArray = new Array();
    this.hasNoAncestors = null;             // Flag indicating whether potential root member of a descent
    
    this.preferredLeftNeighbour = null;     // For consanguineous families, child order may not be same as age
    this.preferredRightNeighbour = null;    //
    
    this.inTree = false;                    //Flag indicating member is already in a tree
    this.xCanvas = 0;
    this.yCanvas = 0;
    this.preOrder = 0;                      // The members position in a pre-order traversal
}

/*
 * Adds member to partner array if not already there
 *
 * @param {PD.Member} _member The member object to add to the partner array
 */
PD.Member.prototype.addPartner = function(_member) {
    var alreadyIn = false;
    
    for (var i in this.partnerArray)
    {
        if (_member.index == this.partnerArray[i].index)
        {
            alreadyIn = true;
            break;
        }
    }
    
    if (!alreadyIn)
    {
        this.partnerArray.push(_member);
    }
}

/*
 * Compares equality of member objects using unique index
 *
 * @param {PD.Member} _member The member object to compare to
 * @returns {Bool} True is members are equal
 */
PD.Member.prototype.isEqualTo = function(_member) {
    if (_member != null)
    {
        return (this.index == _member.index);
    }
    else
    {
        return false;
    }
}

/*
 * Compares parents with the member passed as an argument
 *
 * @param {PD.Member} _member The member to compare parents with
 *
 * @returns {Bool} True if both parents are not null and are equal
 */
PD.Member.prototype.sameParentsAs = function(_member) {
    var returnValue = false;
    
    if (this.mother != null && this.father != null)
    {
        if (_member.mother != null && _member.father != null)
        {
            returnValue = (this.mother.index == _member.mother.index && this.father.index == _member.father.index);
        }
    }
    
    return returnValue;
}

/*
 * Sorts child array by decreasing age
 */
PD.Member.prototype.sortChildrenByAgeDescending = function() {
    this.childArray.sort(function compare(a,b){return ((a.age <= b.age)?1:-1);});
}

/*
 * Determines need to move subtrees close together to appose a married pair
 *
 */
PD.Member.prototype.moveMembers = function(_member1, _member2, _found1, _found2) {
    // Is this one of the two
    if (!_found1 && this.isEqualTo(_member1))
    {
        console.log("   Found member1");
        // If a preferred neighbour has not been allocated, make this a right neighbour
        if (_found2)
        {
            this.preferredLeftNeighbour = _member2;
        }
        // Otherwise its a right neighbour
        else
        {
            this.preferredRightNeighbour = _member2;
        }
        
        // No longer looking for this member
        _found1 = true;
    }
    // Is this the other one of the two
    else if (!_found2 && this.isEqualTo(_member2))
    {
        console.log("   Found member2");
        // If a preferred neighbour has not been allocated, make this a right neighbour
        if (_found1)
        {
            this.preferredRightNeighbour = _member1;
        }
        // Otherwise its a right neighbour
        else
        {
            this.preferredLeftNeighbour = _member1;
        }
        
        // No longer looking for this member
        _found2 = true;
    }
    
    // Call function recursively for children of this member
    if (this.childArray.length > 0)
    {
        for (var i in this.childArray)
        {
            this.childArray[i].moveMembers(_member1, _member2, _found1, _found2);
        }
    }
}

/*
 * A pairing of members of a pedigree that produces children
 */
PD.Pair = function(_female, _male, _isRoot) {
    // Creates an instance counter (similar to a static variable)
    if (typeof PD.Pair.index == 'undefined')
    {
        PD.Pair.index = 0;
    }
    
    // Assign unique index
    this.index = PD.Pair.index++;
    
    // Members of pairing
    this.female = _female;
    this.male = _male;
    
    // Flags
    this.isRoot = _isRoot;
    this.isConsanguineous = false;
    this.isInDescent = false; //Flag indicating whether the pair has already been used in a descent
            
    this.childArray = new Array();  // Array of members who are children of this pairing
}

PD.Pair.prototype.otherMemberTo = function(_member) {
    if (_member.gender == 'F')
    {
        return this.male;
    }
    else
    {
        return this.female;
    }
}

/*
 * A subset of the complete pedigree with its own root (ie a separate tree)
 *
 * @param {PD.Pair} _rootPair The pair at the root of the descent
 * @param {Family} _family The family object
 */
PD.Descent = function(_family, _rootPair) {
    this.family = _family;
    this.rootPair = _rootPair;
    this.memberArray = new Array();
    this.pairArray = new Array();
    
    this.rootNode;  // Reference to root node in node array
    this.nodeArray = new Array();
    this.tree = null;
    this.numberOfLoops = 0;       // Number of consanguineous loops
    this.consanguineousPairArray = new Array();

    // Populate member and pair arrays
    this.scan(_rootPair);
    
    // Look for consanguinous pairs
    for (var i in this.pairArray)
    {
        var pair = this.pairArray[i];
        
        // Test for consanguinity is that both members of a pair have parents in the same descent
        if (this.containsMember(pair.female.mother) && this.containsMember(pair.male.mother))
        {
            pair.isConsanguineous = true;
            this.consanguineousPairArray.push(pair);
            console.log("Consanguineous Pair - " + pair.female.name + ":" + pair.male.name);
            this.numberOfLoops++;
        }
    }
    
    // Deal with consanguineous loops
    if (this.numberOfLoops > 0)
    {
        // Only handle one loop for now
        if (this.numberOfLoops > 1)
        {
            console.log("ERROR - more than one consanguineous loop - await a later version!");
        }
        else
        {
            // Find the consanguineous pair and get its members
            for (var i in this.pairArray)
            {
                if (this.pairArray[i].isConsanguineous)
                {
                    this.conFemale = this.pairArray[i].female;
                    this.conMale = this.pairArray[i].male;
                }
            }
            
            //console.log(this.conFemale.name + ":" + this.conMale.name);
            
            // Work down from root of descent, determining which subtree each member of the pair is and moving them together (if possible)
            this.rootPair.female.moveMembers(this.conMale, this.conFemale, false, false);

        }
    }
}

/*
 * Scan through descendents to populate list of members and pairs for this descent
 *
 * @param {PD.Pair} _pair The pair to scan descendents of
 */
PD.Descent.prototype.scan = function(_pair) {
    // Add pair to pair array
    this.pairArray.push(_pair);
    
    // Add members of pair to member array, if not already there
    if (!this.containsMember(_pair.female))
    {
        this.memberArray.push(_pair.female);
    }
    if (!this.containsMember(_pair.male))
    {
        this.memberArray.push(_pair.male);
    }
    
    // Call function recursively for each child
    for (var i = 0; i < _pair.childArray.length; i++)
    {
        var member = _pair.childArray[i];
        
        // Get next pair with this member if available
        var pair = this.family.nextPairContainingMember(member);
        
        if (pair)
        {
            this.scan(pair);
        }
        else
        {
            if (!this.containsMember(member))
            {
                this.memberArray.push(member);
            }
        }
    }
}


PD.Descent.prototype.preOrderNodeTraversal = function(_node) {
    //console.log(_node.label + " level: " + _node.level);
    
    for (var i in _node.childArray)
    {
        this.preOrderNodeTraversal(_node.childArray[i]);
    }
}

/*
 * Scans member array to determine whether it contains this member
 *
 * @param {PD.Member} The member to test
 *
 * @returns {Bool} True if the array contains the member
 */
PD.Descent.prototype.containsMember = function(_member) {
    var returnValue = false;
    
    if (_member != null)
    {
        for (var i in this.memberArray)
        {
            if (_member.index == this.memberArray[i].index)
            {
                returnValue = true;
                break;
            }
        }
    }
    
    return returnValue;
}

/*
 * Scans pair array for particular member and returns pair
 *
 *
 */
PD.Descent.prototype.pairContainingMember = function(_member) {
    var memberIsPartOfPair = false;
    var pair = false;
    
    // Iterate through pairs of this descent looking for one with this _member
    for (var i in this.pairArray)
    {
        pair = this.pairArray[i];
        
        if (_member.gender == 'F')
        {
            if (pair.female.index == _member.index)
            {
                memberIsPartOfPair = true;
                break;
            }
        }
        else
        {
            if (pair.male.index == _member.index)
            {
                memberIsPartOfPair = true;
                break;
            }                    
        }
    }
    
    // If one is found return it, otherwise return false
    if (memberIsPartOfPair)
    {
        return pair;        
    }
    else
    {
        return false;
    }
}
  


/*
 * Uses pre-order traversal of members and pairs to create nodes of a tree for this descent
 *
 * @param {Object} _point The starting point below which to create the nodes of the tree. Either a pair or a member object
 * @param {Bool} _isRoot Flag indicating that the passed _point object is the root of the tree
 *
 * @returns {Node} Returns a PD.Node object with children
 */
PD.Descent.prototype.createNode = function(_point, _isRoot) {
    var node = new PD.Node("");
    var childNode;
    var pairNode;
    
    // Top of descent (always a pair)
    if (_isRoot)
    {
        // Start with an invisible root
        node.type = PD.NodeType.Root;
        node.label = "Root";
        node.width = 0;
        
        // Add female
        var femaleNode = new PD.Node(_point.female.name);
        femaleNode.type = PD.NodeType.Female;
        femaleNode.member = _point.female;
        femaleNode.member.isInTree = true;
        node.addChild(femaleNode);
        
        // Add pair (note recursion to populate childArray of node)
        var pairNode = this.createNode(_point, false);
        node.width = 0;
        node.addChild(pairNode);
        
        // Add male
        var maleNode = new PD.Node(_point.male.name);
        maleNode.type = PD.NodeType.Male;
        maleNode.member = _point.male;
        maleNode.member.isInTree = true;
        node.addChild(maleNode);
    }
    // Other node, may be a pair or a leaf
    else
    {
        // Pair
        if (_point instanceof PD.Pair)
        {
            node.type = PD.NodeType.Pair;
            node.label = "Pair";
            node.width = PD.PairWidth;
            
            // Look ahead for any member movement
            var leftMostMember = null;
            var rightMostMember = null;
            
            for (var i = 0; i < _point.childArray.length; i++)
            {
                var child = _point.childArray[i];
                if (child.preferredLeftNeighbour != null)
                {
                    leftMostMember = child;
                }
                if (child.preferredRightNeighbour != null)
                {
                    rightMostMember = child;
                }
            }
            
            // Deal with a left moved member
            if (leftMostMember != null)
            {
                childNode = this.createNode(leftMostMember, false);
                node.addChild(childNode);                
            }
            
            // Add children
            for (var i = 0; i < _point.childArray.length; i++)
            {
                var child = _point.childArray[i];
                var partner;
                
                // Is child part of a pair?
                var childIsPartOfPair = false;
               
                // Get first pair with this child in it
                var pair = this.pairContainingMember(child);
                if (pair)
                {
                    childIsPartOfPair = true;
                    partner = pair.otherMemberTo(child);
                }
                
                // Add the pair to the tree, as long as its not part of a loop
                if (childIsPartOfPair && !pair.isConsanguineous)
                {
                    // Add a pair to the tree
                    childNode = this.createNode(child, false);
                    var pairNode = this.createNode(pair, false);
                    var partnerNode = this.createNode(partner, false);
                    
                    node.addChild(childNode);
                    node.addChild(pairNode);
                    node.addChild(partnerNode);
                }
                // Child node that needs to be moved
                else if (child.preferredLeftNeighbour != null || child.preferredRightNeighbour != null)
                {
                    childNode = this.createNode(child, false);
                    childNode.type = PD.NodeType.PlaceHolder;
                    
                    node.addChild(childNode);            
                }
                // Regular child node
                else
                {
                    childNode = this.createNode(child, false);
                    node.addChild(childNode);
                }
            }
            // Deal with a right moved member            
            if (rightMostMember != null)
            {
                childNode = this.createNode(rightMostMember, false);
                node.addChild(childNode);                
            }
        }
        // Leaf node
        else {
            node.member = _point;
            node.label = _point.name;
            switch (_point.gender) {
            	case 'F':
            		node.type = PD.NodeType.Female;
            		break;
            	case 'M':
            		node.type = PD.NodeType.Male;
            		break;
            	default:
            		node.type = PD.NodeType.Unknown;
            		break;            		
            }
            
            node.member.isInTree = true;
        }
    }
    
    // Add to node array
    this.nodeArray.push(node);
    
    // Return node
    return node;
}


PD.Descent.prototype.createTree = function(_xTopAdjustment, _yTopAdjustment) {
    // Create new tree object as property of this branch
    this.tree = new PD.Tree(this.rootNode);
    
    // Assign offset (Do this before walking tree)
    this.tree.xTopAdjustment += _xTopAdjustment;
    this.tree.yTopAdjustment += _yTopAdjustment;
    
    // Fill nodeArray of tree for convenient access to all nodes
    this.tree.fillNodeArray();
    
    // Call walker method (returns true if successful)
    this.tree.walker();
    
    // Calculate tree dimensions in tree units
    this.tree.calculateDimensions(this.tree.rootNode);
    
    // Calculate node coordinates in canvas plane
    //this.tree.calculateNodeCoordinates(this.family.canvas, this.family.xScale, this.family.yScale);
}

PD.Descent.prototype.drawNodes = function() {
    this.tree.drawNodes(this.family.canvas, this.family.drawing);
}

PD.Descent.prototype.drawConnections = function() {
    this.tree.drawConnections(this.family.canvas, this.family.drawing);
}


/*
 * A node of the tree
 *
 * @property {Int} index The node's unique numeric index
 * @property {String} label The node's value expressed as a string
 * @property {Int} type Type of node (Female, Male, Unknown, Pair, Root)
 * @property {Array} childArray List of the node's children
 * @property {Int} level The level in the tree, the root node being at level 0
 * @property {Node} parent The node's hierarchical parent
 * @property {Node} firstChild The node's leftmost offspring
 * @property {Node} leftSibling The node's closest sibling on the left
 * @property {Node} leftMostSibling The node's furthest sibling on the left (eldest)
 * @property {Node} rightSibling The node's closest sibling node on the right
 * @property {Node} rightMostSibling The node's furthest sibling node on the right (youngest)
 * @property {Node} leftNeighbour The node's non-sibling neighbour to the left, at the same level
 * @property {Float} width The width of the node (NB this can be altered later, for example for mating pairs in a family tree)
 * @property {Float} height The height of the node 
 * @property {Bool} isLeaf Flag indicating whether the node has no children 
 * @property {Float} x The node's x co-ordinate
 * @property {Float} y The node's y coordinate
 * @property {Float} xOffsetBottomConnector The offset from the x value for the bottom connector to start
 * @property {Float} yOffsetBottomConnector The offset from the y value for the bottom connector to start
 * @property {Float} xOffsetTopConnector The offset from the x value for the top connector to start
 * @property {Float} yOffsetTopConnector The offset from the y value for the top connector to start
 * @property {Float} prelim The node's preliminary x co-ordinate
 * @property {Float} modifier The node's modifier value
 * @property {PD.Member} member The member linked to this node (null for pair objects)
 * @param {Int} _index The node's unique numeric index
 * @param {String} _label The node's value expressed as a string
 */
PD.Node = function(_label) {
    // Creates an instance counter (similar to a static variable)
    if ( typeof PD.Node.index == 'undefined' )
    {
        PD.Node.index = 0;
    }
    this.index = PD.Node.index++;
    
    this.label = _label;
    
    this.type = PD.NodeType.Unknown;    // Type is set from information in personArray
    this.childArray = new Array();
    this.level = 0;
    this.parent = null;
    this.firstChild = null;
    this.leftSibling = null;
    this.leftMostSibling = null;
    this.rightSibling = null;
    this.rightMostSibling = null;
    this.leftNeighbour = null;
    this.width = PD.NodeWidth;
    this.height = PD.NodeHeight;
    this.isLeaf = false;
    this.x = 0;
    this.y = 0;
    this.xOffsetBottomConnector = 0;
    this.yOffsetBottomConnector = 1;
    this.xOffsetTopConnector = 0;
    this.yOffsetTopConnector = -1;
    this.prelim = 0;
    this.modifier = 0;
    
    this.member = null;
}

/*
 * Adds a child to the node, sets the level property
 *
 * @param {Node} _child The node to add as a child
 */
PD.Node.prototype.addChild = function(_child) {
    // Child level is one below parent
    _child.level = this.level + 1;
    
    // Add to child array
    this.childArray.push(_child);
}

/*
 * Carries out a pre-order traversal of the tree starting at this node (example structure only)
 */
PD.Node.prototype.preOrderTraversal = function() {
    //console.log(this.label);
    
    for (var i in this.childArray)
    {
        this.childArray[i].preOrderTraversal();
    }
}

/*
 * Carries out a post-order traversal of the tree starting at this node (example structure only)
 */
PD.Node.prototype.postOrderTraversal = function() {
    for (var i in this.childArray)
    {
        this.childArray[i].postOrderTraversal();
    }
    
    //console.log(this.label + ":" + this.prelim + ":" + this.modifier);
    //console.log(this.label + ":" + this.x + ":" + this.y);
}

//Carries out a post-order traversal of the tree starting at this node (example structure only)
PD.Node.prototype.levelOrderTraversal = function(_node) {
    var queue = new Queue();
    var index = 0;
    var tempNodeArray = new Array();
    
    queue.enqueue(_node);
    while (queue.getLength() != 0)
    {
        var node = queue.dequeue();
        
        // Store node in temporary array in level traversal order
        tempNodeArray[index] = node;
        
        // List node
        var flag = "";
        if (node.member != null) flag = node.member.isInTree;
        //console.log(node.label + flag);
        
        // Increment index
        index++;
        
        // Continue with next node using recursion
        for (var i in node.childArray)
        {
            queue.enqueue(node.childArray[i]);
        }
    }
}

/*
 * Sets the parent, child, level and other properties using a pre-order traversal
 */
PD.Node.prototype.setLinks = function() {
    // Assign first child
    if (this.childArray.length > 0)
    {
        this.firstChild = this.childArray[0];
    }
    
    // Set isLeaf property
    if (this.childArray.length == 0)
    {
        this.isLeaf = true;
    }
    else
    {
        this.isLeaf = false;
    }
    
    // Pre order traversal
    for (var i = 0; i < this.childArray.length; i++)
    {
        // Set parent
        this.childArray[i].parent = this;
        
        // Set level
        this.childArray[i].level = this.level + 1;
        this.childArray[i].setLinks();
        
        // Set left sibling and left most sibling
        if (i > 0)
        {
            this.childArray[i].leftMostSibling = this.childArray[0];
            this.childArray[i].leftSibling = this.childArray[i - 1];
        }
        
        // Set right sibling and rightmost sibling
        if (i < this.childArray.length - 1)
        {
            this.childArray[i].rightSibling = this.childArray[i + 1];
            this.childArray[i].rightMostSibling = this.childArray[this.childArray.length - 1];
            var x = 1;
        }
    }
}

/*
 * Carries out a post-order traversal assigning preliminary x coordinate value and modifiers
 * Corresponds to procedure FIRSTWALK in Figure 2 of Walker's paper
 * Modification to account for a right hand node that is in member nuclear family
 */
PD.Node.prototype.firstWalk = function() {
    var separation = PD.SiblingSeparation;
    
    // If its a leaf, assign prelim value
    if (this.isLeaf)
    {
        if (this.leftSibling != null)
        {
            // GWA modification to algorithm - No left separation if node is a pair
            if (this.leftSibling.type == PD.NodeType.Pair) separation = 0;
            
            this.prelim = this.leftSibling.prelim + separation + PD.meanNodeSize(this.leftSibling, this);
        }
        else
        {
            this.prelim = 0;
        }
    }
    else
    {
        // Recursively call children for a post order traversal. Puts prelim directly above middle of row of children      
        for (var i in this.childArray)
        {
            this.childArray[i].firstWalk();
        }

        // Work out right and left limits to centre parent pair over spread of children
        var left;
        var right;
        
        // GWA modification to algorithm - Adjust midpoint if right or left hand node is not a member node
        if (this.firstChild.rightMostSibling != null)
        {
            // Left adjust
            if (this.firstChild.type > PD.NodeType.PlaceHolder)
            {
                // Move left to point to one node to the right
                left = this.childArray[1].prelim;
            }
            else
            {
                left = this.firstChild.prelim;
            }
            
            // Right adjust
            var rightNode = this.firstChild.rightMostSibling;
            
            // Right most node does not have a member (ie its type is not female. male or unknown)
            if (rightNode.type > PD.NodeType.PlaceHolder)
            {
                // Move right by one node to the left
                right = this.childArray[this.childArray.length - 2].prelim;
            }
            // Right most node is an orphan (testing one parent sufficient)
            else if (rightNode.member.mother == null)
            {
                // Must be partner of last family member, so move two nodes to the left
                right = this.childArray[this.childArray.length - 3].prelim;
            }
            else
            {
                // Right is last node in array
                right = this.childArray[this.childArray.length - 1].prelim;
            }
        }
        else
        {
            left = this.firstChild.prelim;
            right = this.childArray[this.childArray.length - 1].prelim;            
        }
        
        // Original determination of left and right
        //left = this.firstChild.prelim;
        //right = this.childArray[this.childArray.length - 1].prelim;
        
        
        var midpoint = (left + right)/2;
        
        if (this.leftSibling != null)
        {
            // GWA modification to algorithm - No right separation if node is a pair
            if (this.type == PD.NodeType.Pair) separation = 0;
            
            this.prelim = this.leftSibling.prelim + separation + PD.meanNodeSize(this.leftSibling, this);
            this.modifier = this.prelim - midpoint;
            this.apportion();
        }
        else
        {
            this.prelim = midpoint;
        }
    }
    //console.log(this.label + " prelim: " + this.prelim + " mod: " + this.modifier + " type: " + this.type);
}

/*
 * Apportions space for left subtrees
 * Corresponds to procedure APPORTION in Figures 4 and 5 of Walker's paper (NB two errors in paper)
 */
PD.Node.prototype.apportion = function() {
    var leftMost = this.firstChild;
    var neighbour = leftMost.leftNeighbour;
    var compareDepth = +1;
    var depthToStop = +20; // TODO implement MaxDepth - this.level
    
    while (leftMost != null && neighbour != null && compareDepth <= depthToStop)
    {
        // Compute the location of leftMost and where it should be with respect to neighbour
        var leftModSum = 0;
        var rightModSum = 0;
        var ancestorLeftMost = leftMost;
        var ancestorNeighbour = neighbour;
        
        for (var i = 0; i < compareDepth; i++)
        {
            ancestorLeftMost = ancestorLeftMost.parent;
            ancestorNeighbour = ancestorNeighbour.parent;
            
            rightModSum += ancestorLeftMost.modifier;
            leftModSum += ancestorNeighbour.modifier;
        }
        
        var moveDistance = (neighbour == null?0:neighbour.prelim) + leftModSum + PD.SubTreeSeparation + PD.meanNodeSize(leftMost, neighbour) - ((leftMost == null?0:leftMost.prelim) + rightModSum);
        
        if (moveDistance > 0)
        {
            var node = this;
            var leftSiblingCount = +0;
            
            // Count siblings
            while (node != null && node != ancestorNeighbour)
            {
                leftSiblingCount++;
                node = node.leftSibling;
            }
            
            // Apply portions to appropriate left sibling subtrees
            if (node != null)
            {
                // Distribute movement evenly among subtrees
                var portion = moveDistance/leftSiblingCount;
                
                node = this;
                
                var jump = 0;
                
                // while (node == ancestorNeighbour) // This condition erroneous, we just want to walk left until no more siblings
                while (node != null)
                {
                    // Move node and its subtree
                    node.prelim += moveDistance;
                    node.modifier += moveDistance;
                    
                    // Next subtree to left moves proportionately less
                    moveDistance -= portion;
                    
                    // GWA modification - correction prevents pair nodes 'spreading out'
                    if (node.type == PD.NodeType.Pair)
                    {
                        node.prelim -= portion;
                        node.modifier -= portion;
                    }

                    // GWA modification -  correction prevents right siblings of pair nodes 'spreading out'
                    if (node.leftSibling != null && node.leftSibling.type == PD.NodeType.Pair)
                    {
                        node.prelim -= 2 * portion;
                        node.modifier -= 2 * portion;
                    }
          
                    // Move to next subtree along
                    node = node.leftSibling;
                }
            }
            else
            {
                return;
            }
        }
        
        // Determine the leftmost descendant of node at the next lower level to compare its positioning against that of its neighbour
        compareDepth++;
        
        // Assign new leftMost value
        if (leftMost.isLeaf)
        {
            leftMost = this.getLeftMost(0, compareDepth);
        }
        else
        {
            leftMost = leftMost.firstChild;
        }
        
        // Assign new neighbour (NB This line is missed from the description of the algorithm in the paper and took hours to debug!)
        neighbour = leftMost == null?null:leftMost.leftNeighbour;
    }
}

/*
 * Carries out a pre-order traversal assigning final x coordinate value by summing its prelim and the modifiers of its ancestors
 * Corresponds to procedure SECONDWALK in Figure 3 of Walker's paper (NB note error in assignment of yTemp)
 *
 * @param {Tree} Tree object passed to allow access to properties
 * @param {Int} _level The level to start
 * @param {Float} _modSum
 * @returns {Bool} True if successful
 */
PD.Node.prototype.secondWalk = function(_tree, _level, _modSum) {
    var returnValue = true;
    
    var xTemp = _tree.xTopAdjustment + this.prelim + _modSum;
    var yTemp = _tree.yTopAdjustment + (this.level * PD.LevelSeparation);
    
    // Check tree is in allowable range
    if (_tree.checkExtentsRange(xTemp, yTemp))
    {
        this.x = xTemp;
        this.y = yTemp;
        
        //console.log(this.label + " x: " + this.x + " y: " + this.y + " type: " + this.type);
        
        // Apply the modifier value for this node to all its children
        if (this.childArray.length > 0)
        {
            returnValue = this.firstChild.secondWalk(_tree, _level + 1, _modSum + this.modifier);
        }
        
        if (returnValue && this.rightSibling != null)
        {
             returnValue = this.rightSibling.secondWalk(_tree, _level + 1, _modSum);
        }
    }
    else
    {
        returnValue = false;
    }
    
    
    return returnValue;
}


/*
 * Gets leftmost descendant of a node at a given depth
 * Corresponds to procedure GETLEFTMOST in Figure 6 of Walker's paper
 *
 * @param {Int} _level The level below the node whose descendant is being found
 * @param {Int} _depth The depth at which to find the descendant
 * @returns {Node} The leftmost descendant node
 */
PD.Node.prototype.getLeftMost = function(_level, _depth) {
    if (_level >= _depth)
    {
        return this;
    }
    else if (this.isLeaf)
    {
        return null;
    }
    else
    {
        var rightMost = this.firstChild;
        var leftMost = rightMost.getLeftMost(_level + 1, _depth);
        
        // Do a post order walk of the subtree below this node
        while (leftMost == null && rightMost.rightSibling != null)
        {
            rightMost = rightMost.rightSibling;
            leftMost = rightMost.getLeftMost(_level + 1, _depth);
        }
        
        return leftMost;
    }   
}


/*
 * Draws the node in the canvas plane, and a connecting line for mating pairs
 *
 * @param {Canvas} _canvas The HTML canvas element that the node is drawn in
 */
PD.Node.prototype.draw = function(_canvas, _drawing) {
    if (this.type != PD.NodeType.Root) {
    	var doodle;
        
        var x = this.x * PD.XScale;
        var y = (this.y  - PD.LevelSeparation) * PD.YScale;  // Remove one unit of level separation since root is not shown
        var w = this.width * PD.XScale;
        var h = this.height * PD.YScale;
        
        // Increase scale for eyedraw
        x = this.x * PD.NodeWidth * PD.Scale;
        y = this.y * PD.NodeWidth * PD.Scale;
        
        // Draw shape according to gender
        switch (this.type) {
            case PD.NodeType.Female:
                doodle = _drawing.addDoodle('FamilyMember', {originX:x, originY:y, dimension:PD.NodeWidth * PD.Scale});
                doodle.setNode(this);
                break;
            case PD.NodeType.Male:
                doodle = _drawing.addDoodle('FamilyMember', {originX:x, originY:y, dimension:PD.NodeWidth * PD.Scale});
                doodle.setNode(this);
                break;
            case PD.NodeType.Unknown:
                doodle = _drawing.addDoodle('FamilyMember', {originX:x, originY:y, dimension:PD.NodeWidth * PD.Scale});
                doodle.setNode(this);
                break;
            case PD.NodeType.Pair:
                doodle = _drawing.addDoodle('MemberConnector', {originX:x, originY:y, type:'Pair', length:2 * PD.NodeWidth * PD.Scale});
                //doodle.setNode(this);
                break;
            default:
                break;
        }
        
        // Store id for later selection
        latestDoodleId = doodle.id;
        
        // Upwards connecting line
        if (this.member != null)  {
            // Check that parents exists (mother check sufficient, since members cannot have only one parent)
            if (this.member.mother != null) {
				doodle.drawStub = true;
            }
        }
    }
}

/*
 * Calculates the mean size of the two passed nodes
 * Corresponds to procedure MEANNODESIZE in Figure 7 of Walker's paper
 *
 * @param {Node} _leftNode The left node
 * @param {Node} _rightNode The right node
 * @returns {Float} The mean size
 */
PD.meanNodeSize = function(_leftNode, _rightNode) {
    var nodeSize = 0;
    
    if (_leftNode != null)
    {
        nodeSize += _leftNode.width/2;
    }
    if (_rightNode != null)
    {
        nodeSize += _rightNode.width/2;
    }

    return nodeSize;
}
       
    

/*
 * Implementation of a general tree
 * Tree drawing functions make use of Walker's algorithm from
 * Walker JQ II: A node-positioning algorithm for general trees. Software Pract Exp 1990; 20: 685–705.
 *
 * @property {Array} modeArray Stores the nodes of the tree
 * @property {Float} xTopAdjustment X co-ordinate of leftmost node
 * @property {Float} yTopAdjustment Y co-ordinate of topmost node
 * @param {Array} _nodeArray
 */
PD.Tree = function(_rootNode) {
    this.rootNode = _rootNode;
    this.nodeArray = null;
    this.xTopAdjustment = PD.NodeWidth/2;
    this.yTopAdjustment = PD.NodeHeight/2;
    this.height = 0;
    this.width = 0;
}

/*
 * Makes all the method calls to apply Walker's algorithm and layout the tree
 *
 * @returns {Bool} Flag indicating success
 */
PD.Tree.prototype.walker = function() {
    // Walker's algorithm
    this.rootNode.setLinks();
    this.setLeftNeighbours(this.rootNode);
    this.rootNode.firstWalk(this.rootNode);
    this.rootNode.secondWalk(this, 0, 0);
    
    // Adjustment to make all x cordinates positive
    this.adjustX();
}

/*
 * Double walk to deal with 'bug' in Walker's alorithm for pyramid shaped trees
 */
PD.Tree.prototype.adjustX = function() {
    // Determine minumum value of x (may be negative for pyramid shaped trees
    var xMin = 0;
    for (var i in this.nodeArray)
    {
        if (this.nodeArray[i].x < xMin) xMin = this.nodeArray[i].x;
        
    }

    // Apply correction for negative values
    for (var i in this.nodeArray)
    {
        if (xMin < 0)
        {
            this.nodeArray[i].x -= xMin - PD.NodeWidth/2 - PD.PaddingLeft;
        }
        else
        {
            this.nodeArray[i].x += PD.PaddingLeft;
        }
    }
}

/*
 * Walks tree populating nodeArray in level traversal order
 */
PD.Tree.prototype.fillNodeArray = function() {
    var queue = new Queue();
    var index = 0;
    this.nodeArray = new Array();
    
    queue.enqueue(this.rootNode);
    
    while (queue.getLength() != 0)
    {
        var node = queue.dequeue();
        
        // Store node in array in level traversal order
        this.nodeArray[index] = node;
        
        // Increment index
        index++;
        
        // Continue with next node using recursion
        for (var i in node.childArray)
        {
            queue.enqueue(node.childArray[i]);
        }
    }
}

/*
 * Uses a level order traverse to calculate maximum dimensions (Call after walker method to ensure x coordinates are calculated)
 *
 * @param {PD.Node} _root Node of tree to start the traverse from
 */
PD.Tree.prototype.calculateDimensions = function(_root) {
    var xMax = 0;
    var yMax = 0;
    
    var queue = new Queue();
    
    queue.enqueue(_root);
    while (queue.getLength() != 0)
    {
        var node = queue.dequeue();
        
        // Determine maximum x and y coordinates
        xMax = node.x > xMax?node.x:xMax;
        yMax = node.y > yMax?node.y:yMax;
        
        for (var i in node.childArray)
        {
            queue.enqueue(node.childArray[i]);
        }
    }
    
    // Set height (root node is not drawn, so its level is subtracted) - 1
    this.width = xMax + PD.NodeWidth/2 + PD.PaddingRight;
    this.height = yMax -PD.LevelSeparation + PD.NodeHeight/2 + PD.PaddingBottom;
}

/*
 * Draws all the nodes in the tree on a canvas
 *
 * @param {Canvas} HTML canvas element
 */
PD.Tree.prototype.drawNodes = function(_canvas, _drawing) {
	var node;
	var offsetX;
	var offsetY;

	// Centre proband
    for (var i in this.nodeArray) {
    	node = this.nodeArray[i];
        //if (node.label == 'Proband') {
        if (node.member && node.member.isProband) {
        	offsetX = node.x;
        	offsetY = node.y;
        }       
    }
    
    // Draw nodes with offset
    for (var i in this.nodeArray) {
    	node = this.nodeArray[i];
    	node.x = node.x - offsetX;
    	node.y = node.y - offsetY;
        node.draw(_canvas, _drawing);        
    }
}

/*
 * Draw connections using
 */
PD.Tree.prototype.drawConnections = function(_canvas, _drawing) {
    // Iterate through node array looking for leftmost and rightmost siblings of a pair
    for (var i in this.nodeArray) {
        var node = this.nodeArray[i];
        
        if (node.type == PD.NodeType.Pair && node.childArray.length > 1)
        {
            // Find first node that is associated with a member
            var j = 0;
            while(node.childArray[j].member == null)
            {
                j++;
            }
            var leftMember = node.childArray[j].member;
            
            // Find rightmost sibling
            for (var j = node.childArray.length - 1; j > 0; j--)
            {
                var rightMember = node.childArray[j].member;
                if (rightMember != null)
                {
                    if (leftMember.sameParentsAs(rightMember))
                    {
                        break;
                    }
                }
            }
            
            // Iterate through drawing doodle array looking for corresponding doodles
            if (leftMember && rightMember) {
            	var leftX;
            	var rightX;
				var length;
				var originX;
				var originY;
				
				for (var j in _drawing.doodleArray) {
					if (_drawing.doodleArray[j].node) {
				
						//console.log(_drawing.doodleArray[j].node);
						if (leftMember.index == _drawing.doodleArray[j].node.member.index) {
							leftX = _drawing.doodleArray[j].originX;
						}
						if (rightMember.index == _drawing.doodleArray[j].node.member.index) {
							rightX = _drawing.doodleArray[j].originX;
							originY = _drawing.doodleArray[j].originY - 2 * PD.NodeWidth * PD.Scale;
						}    		
					}
				}
				
				// Calculate position and add doodle

				length = rightX - leftX;
				originX = leftX + length/2;
				_drawing.addDoodle('MemberConnector', {originX:originX, originY:originY, length:length, type:'Sibling'});
			}
        }
    }
}

/*
 * Carries out a level order traversal and sets the left neighbour value for each node
 * Requires level and parent values to be set, so this must be called after the setLinks method
 *
 * @param {Node} _root The node at the top of the subtree to process
 */
PD.Tree.prototype.setLeftNeighbours = function(_root) {
    var queue = new Queue();
    var index = 0;
    var tempNodeArray = new Array();
    
    queue.enqueue(_root);
    while (queue.getLength() != 0)
    {
        var node = queue.dequeue();
        
        // Store node in temporary array in level traversal order
        tempNodeArray[index] = node;
        
        // Assign left neighbour
        if (index > 0)
        {
            // Get reference to previous node
            var previousNode = tempNodeArray[index - 1];
            
            // If its at same left and is not a sibling, assign it as left neighbour
            if (previousNode.level == node.level && previousNode.parent.index != node.parent.index)
            {
                node.leftNeighbour = previousNode;
                //console.log(index + ":" + node.label + ":" + node.level + " : " + node.leftNeighbour.label);
            }
        }
        
        // Increment index
        index++;
        
        // Continue with next node using recursion
        for (var i in node.childArray)
        {
            queue.enqueue(node.childArray[i]);
        }
    }
}

/*
 * Tests to see that coordinates of tree are within allowable range
 */
PD.Tree.prototype.checkExtentsRange = function(_x, _y) {
    // ***TODO*** implement this!
    return true;
}

