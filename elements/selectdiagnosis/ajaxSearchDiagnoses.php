<?php
/**
 * ajaxSearchDiagnoses.php
 * 
 * Responds to AJAX request with a select containing diagnoses
 * 
 * <b>GET Parameters:</b><br>
 * string <var>txt</var> Text for incremental search (mandatory)<br>
 * string <var>select</var> Name of select in which to display results (optional) - defaults to 'namelist'<br>
 * 
 * OpenEyes is licensed by Moorfields Eye Hospital NHS Foundation Trust (the “Licensor”) under version 3 of 
 * the GNU General Public Licence (GPL), and version 1 of the Open Eyes Proprietary Licence (OEPL).
 * 
 * You can choose the licence that most suits your intended use of OpenEyes. If you wish to contribute to the OpenEyes open source project
 * or incorporate OpenEyes into your own open source project, version 3 of the GNU General Public Licence or any later version shall apply.
 * If you wish to use OpenEyes for commercial purposes, the terms of the OpenEyes Proprietary Licence shall apply; 
 * 
 * A plain text version of the OpenEyes Proprietary Licence is distributed with this software. The Licensor reserves the right to publish
 * revised and/or new versions of the OpenEyes Proprietary Licence from time to time. Each version will be given a distinguishing version number.
 * 
 * When using OpenEyes in your commercial application, or open source application you are required to distribute your chosen 
 * licence (GPLv3 or OEPLv1) with your application and ensure the following acknowledgement is contained within both the program 
 * and in any user’s manual.
 * 
 * 		"This software uses elements of OpenEyes open source software (see http://www.openeyes.org.uk) Open Eyes is used and may only be 
 * 		used under the [GPL/OEPL] version [insert version number]"
 * 
 * @author Bill Aylward <bill.aylward@mac.com>
 * @license http://www.gnu.org/licenses/gpl.html GPLv3.0
 * @license http://www.openeyes.org.uk/licenses/oepl-1.0.html OEPLv1.0
 * @version 0.8
 * Modification date: 10th October 2010
 * @copyright Copyright (c) 2010 OpenEyes
 * @package Clinical
 */

/**
 * Import OpenEyes class files
 */

require_once ('../classes/OEDBConnectionClass.inc.php');

// Check for valid text passed as GET parameter
if (isset($_GET['txt']) && is_string($_GET['txt']))
{
	$searchText = $_GET['txt'];
	$selectName = isset($_GET['select'])?$_GET['select']:'namelist';
}
else exit();

// Minimum search length
$minimumStringLength = 2;

// Declare array (in case search is negative)
$diagnoses = array();

// Incremental search
if (strlen($searchText) > $minimumStringLength)
{
	// Connect to database
	$dbc = new OEDBConnection(OEDatabase::main);
	
	if ($dbc->isConnected())
	{					
		// Search for matching diagnoses
		$q = "
		SELECT d.disorder_id AS code, d.term 
		FROM disorders AS d 
		WHERE d.term LIKE '%".$searchText."%' AND d.type = 'Ophthalmic'
		ORDER BY term ASC
		";

		// Execute query
		$success = $dbc->execute($q);
		
		// Get results into an array
		if ($success)
		{
			$count = $dbc->recordCount();
			if ($count > 0)
			{
				$diagnoses = $dbc->resultArray();
			}
		}
	}
}

// Write diagnoses that were found into a select ondblclick="nameSelected(namelist.value);"
if (Count($diagnoses) > 0)
{
	echo '
			<select class="diagnosesDisplay" name="'.$selectName.'" id="'.$selectName.'" size=10 ondblclick="nameSelected(this.id, this.innerHTML);" onkeydown="namelistKeyPress(event, this.id, this.value);">';

	foreach ($diagnoses as $diagnosis)
	{
		echo '
				<option value="'.$diagnosis->code.'">'.$diagnosis->term.'</option>'."\n";
	}
	
	echo '
			</select>';
}

?>