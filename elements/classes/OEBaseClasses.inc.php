<?php
/**
 * OEBaseClasses.inc.php
 * 
 * This file contains base classes, enums and universal functions
 * 
 * OpenEyes is licensed by Moorfields Eye Hospital NHS Foundation Trust (the ÒLicensorÓ) under version 3 of 
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
 * and in any userÕs manual.
 * 
 * 		"This software uses elements of OpenEyes open source software (see http://www.openeyes.org.uk) Open Eyes is used and may only be 
 * 		used under the [GPL/OEPL] version [insert version number]"
 * 
 * @author Bill Aylward <bill.aylward@mac.com>
 * @license http://www.gnu.org/licenses/gpl.html GPLv3.0
 * @license http://www.openeyes.org.uk/licenses/oepl-1.0.html OEPLv1.0
 * @version 1.0
 * Modification date: 6th October 2010
 * @copyright Copyright (c) 2010 OpenEyes
 * @package Base
 */

/**
 * Import OpenEyes configuration file and language file
 */
require_once ('../../../config.inc.php');
require_once ('../languages/'.LANGUAGE.'.inc.php');

/**
 * Root class to provide generic functionality
 * 
 * @package Base
 */
class OEObject
{
	 /**
     * Array to hold object properties
     * 
     * @access protected
     * @var array
     */
	protected $properties = array();
	
	/**
	 * Constructor
	 */
	public function __construct()
	{
	}
	
	/**
	 * Destructor
	 */
	public function __destruct()
	{
	}

	/**
	 * Setter
	 * 
	 * @param string $key key 
	 * @param mixed $value value
	 */
	public function __set($key, $value)
	{
		$this->properties[$key] = $value;
		
		// If property is errorMessage and verbose debugging is on, write to log
		if (VERBOSE_DEBUGGING && $key == 'errorMessage' && strlen($value) > 0) error_log($value);
	}
	
	/**
	 * Getter
	 * 
	 * @param string $key key 
	 */
	// Getter (use & to make it return by reference, otherwise fails with array properties)
	public function &__get($key)
	{
		return $this->properties[$key];
	}
	
	/**
	 * Tests whether property is set
	 * 
	 * @param string $key key
	 * @return boolean
	 */
    public function __isset($key)
    {
        return isset($this->properties[$key]);
    }
    
	/**
	 * Unsets a property
	 * 
	 * @param string $key key
	 */
    public function __unset($key)
    {
        unset($this->properties[$key]);
    }

    /**
	 * Tests whether a property is empty
	 * (PHP empty() will not work on a function, so that empty($this->key) in a calling script will fail)
	 * 
	 * @param string $key key
	 * @return boolean
	 */
	public function isEmpty($key)
	{
		return empty($this->properties[$key]);
	}
	
	/**
	 * Returns name of script in which object was created
	 * 
	 * @return string
	 */ 
	public function scriptName()
	{
		$pathArray = explode('/', $_SERVER["SCRIPT_NAME"]);
		return $pathArray[count($pathArray) - 1];
	}

	/**
	 * Returns last error message
	 * 
	 * @return string
	 */ 
	public function errorMessage()
	{
		if ($this->errorMessage)
		{
			return $this->errorMessage;
		}
		else
		{
			return "No error";
		}
	}
	
	/**
	 * Prints out a list of properties and their values
	 */ 
	public function printDescription()
	{
		print '<pre>';
		print_r($this->properties);
		print '</pre>';
	}

	/**
	 * Returns an absolute URL, defaulting to login page (login.php)
	 * 
	 * @param string $page Page to redirect to
	 * @return string
	 */ 
	public function absoluteUrl ($page = 'login.php')
	{
		// URL is http:// plus host name plus current directory
		$url = WEB_PROTOCOL . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']);
		
		// Remove any trailing slashes
		$url = rtrim($url, '/\\');
		
		// Add the page:
		$url .= '/' . $page;
		
		// Return the result
		return $url;
	}

	/**
	 * Redirects to a new script. Must be called before any HTML is written
	 * 
	 * @param string $_redirectScript Script to redirect to
	 */ 
	public function redirect($_redirectScript)
	{
		if (!empty($_redirectScript))
		{
			$url = $this->absoluteUrl($_redirectScript);
			header("Location: $url");
			exit();			
		}
	}

	/**
	 * Generates a series of selects for editing a date
	 * 
	 * @param string $_datetimeString String containing datetime in YYYY-MM-DD format
	 * @param string $_inputName Name of hidden input value containing result
	 */ 
	public function echoDatetime($_datetimeString, $_inputName)
	{
		// Get year, month and day from current date
		$curYear = substr($_datetimeString,0,4);
		$curMonth = substr($_datetimeString,5,2);
		$curDay = substr($_datetimeString,8,2);
		
		// Create unique id related to name
		$hiddenId = 'hid_'.$_inputName;

		// Day
		echo '
					<select class="formdropdown" id="sel_day" onchange="updateDate(\''.$hiddenId.'\')">';
		for ($d = 1; $d < 32; $d++)
		{
			echo '
						<option '.($d == $curDay?"selected='TRUE' ":"").'value='.$d.'>'.$d."</option>";
		}
		echo '
					</select>';
							
		// Month
		echo '
					<select class="formdropdown" id="sel_month" onchange="updateDate(\''.$hiddenId.'\')">
						<option '.($curMonth-1 == 0?"selected='TRUE' ":"").'value=00>Jan</option>
						<option '.($curMonth-1 == 1?"selected='TRUE' ":"").'value=01>Feb</option>
						<option '.($curMonth-1 == 2?"selected='TRUE' ":"").'value=02>Mar</option>
						<option '.($curMonth-1 == 3?"selected='TRUE' ":"").'value=03>Apr</option>
						<option '.($curMonth-1 == 4?"selected='TRUE' ":"").'value=04>May</option>
						<option '.($curMonth-1 == 5?"selected='TRUE' ":"").'value=05>Jun</option>
						<option '.($curMonth-1 == 6?"selected='TRUE' ":"").'value=06>Jul</option>
						<option '.($curMonth-1 == 7?"selected='TRUE' ":"").'value=07>Aug</option>
						<option '.($curMonth-1 == 8?"selected='TRUE' ":"").'value=08>Sep</option>
						<option '.($curMonth-1 == 9?"selected='TRUE' ":"").'value=09>Oct</option>
						<option '.($curMonth-1 == 10?"selected='TRUE' ":"").'value=10>Nov</option>
						<option '.($curMonth-1 == 11?"selected='TRUE' ":"").'value=11>Dec</option>
					</select>';
		
		// Year					
		echo '
					<select class="formdropdown" id="sel_year" onchange="updateDate(\''.$hiddenId.'\')">';
		
		$nextYear = date("Y") + 1;
		for ($y = $nextYear; $y > $nextYear-90; $y--){
			echo '
						<option '.($y == $curYear?"selected='TRUE' ":"").'value='.$y.'>'.$y.'</option>';
		}
		echo '
					</select>';
							
		// Hidden input to store data to be saved (change type from hidden to text for debugging)
		echo '
					<input type="hidden" name="'.$_inputName.'" id="'.$hiddenId.'" value="'.$_datetimeString.'"/>';
	}
}

/**
 * Table class for displaying two dimensional arrays
 * id is written as an attribute of the <tr> element
 * datetime	is formatted according to the setting of LONG_DATEFORMAT in config.php
 * Each row will be displayed in colours according to urgency value 'low' - normal font colour, 'medium' - orange, 'high' - red
 * 
 * @package HTML
 * @property string $this->tableTitle Title of table
 * @property string $this->tableId id of table element
 * @property array $this->tableArray Two dimensional array of values to display, first column contains id
 * @property integer $this->width Width of the table in pixels
 * @property array $this->widthRatiosArray Contains integers, one per column, representing relative width
 * @property array $this->lablesArray Contains strings, one per column, displayed in Column Headers
 * @property array $this->editScript Script called by clicking on edit button
 * @property array $this->removeScript Script called by clicking on remove button
 */
class OETable extends OEObject
{
	/**
	 * Constructor
	 * 
	 * @param string $_tableTitle Title of table
	 * @param string $_tableId id of table element
	 * @param array $_tableArray Two dimensional array of values to display, first column contains id
	 * @param integer $_width Width of the table in pixels
	 * @param array $_widthRatiosArray Contains integers, one per column, representing relative width
	 * @param array $_lablesArray Contains strings, one per column, displayed in Column Headers
	 * @param array $_editScript Script called by clicking on edit button
	 * @param array $_removeScript Script called by clicking on remove button
	 */
	public function __construct($_tableTitle, $_tableId, $_tableArray, $_width, $_widthRatiosArray, $_lablesArray, $_editScript, $_removeScript)
	{
		// Title
		$this->tableTitle = $_tableTitle;
		
		// Id
		$this->tableId = $_tableId;
		
		// Multidimensional array containing table data
		$this->tableArray = $_tableArray;
		
		// Width of table in pixels, defaulting to 800
		$this->width = isset($_width)?$_width:800;
		
		// Array of numbers representing ratios of widths
		$this->widthRatiosArray = array();
		if (isset($_widthRatiosArray))
		{
			$this->widthRatiosArray = $_widthRatiosArray;
		}
		else
		{
			// Get number of columns from first row of tableArray
			$arrayCount = Count($this->tableArray[0]);
			foreach($this->tableArray[0] as $field => $value)
			{
				$this->widthRatiosArray[$field] = 1;
			}
		}
		
		// Array containing lables for table header
		$this->lablesArray = array();
		if (isset($_lablesArray))
		{
			$this->lablesArray = $_lablesArray;
		}
		else
		{
			foreach($this->tableArray[0] as $field => $value)
			{
				$this->lablesArray[$field] = $field;
			}
		}
		
		// Edit script
		$this->editScript = $_editScript;
		
		// Remove script
		$this->removeScript = $_removeScript;
	}
	
	/**
	 * Outputs HTML for the table
	 */ 
	public function echoTable()
	{
		// Widths are expressed in table columns as percentages
		$widthPercentArray = array();
		$totalWidthRatios = 0;

		// Total width of table in pixels
		$totalWidth = $this->width;

		// Get total of each width ratio
		foreach ($this->widthRatiosArray as $field => $widthRatio)
		{
	    	$totalWidthRatios = $totalWidthRatios + $widthRatio;
		}
		
		// Go through calculating percentages and storing in array with key of field name
		foreach ($this->widthRatiosArray as $field => $widthRatio)
		{
			$widthPercentArray[$field] = (100 * $widthRatio/$totalWidthRatios);
		}

		// Table Title
		echo PHP_EOL.'	<h2>'.$this->tableTitle.'</h2>';
		
		// Table header
		echo '	
		<table cellspacing="0" width="'.$totalWidth.'" ';
		if (isset($this->tableId)) echo 'id="'.$this->tableId.'"';
		echo '>';
		echo '
			<thead class="tabletitles">
				<tr>';
			
		// Go through labels and write out table titles
		foreach ($this->lablesArray as $field => $title)
		{
			if ($widthPercentArray[$field] > 0)
			{
				echo '
					<td align="left" width="'.number_format($widthPercentArray[$field],0).'%">'.$title.'</td>';
			}
		}
		
		// Complete table titles
		if (isset($this->editScript)) echo '
					<td align="left"></td>';
		if (isset($this->removeScript)) echo '
					<td align="left"></td>';
		echo '
				</tr>';
		echo '		
			</thead>';
		
		// Write out table cells
		echo '
			<tbody>';
		for ($i = 0; $i < Count($this->tableArray); $i++)
		{
			echo '		
				<tr';
			// Store id as an attribute of the <tr> element
			if (isset($this->tableArray[$i]->id)) echo ' id="'.$this->tableArray[$i]->id.'"';
			
			// If an urgency key is passed, include a class for the row
			if (isset($this->tableArray[$i]->urgency))
			{
				if ($this->tableArray[$i]->urgency == 'Medium') echo ' class="orangetext"';
				if ($this->tableArray[$i]->urgency == 'High') echo ' class="redtext"';
			}
			echo '>';
			
			// Write out table cells, but only those that are specified in lablesArray
			foreach($this->lablesArray as $field => $value)
			{
				if (isset($widthPercentArray[$field]) && $widthPercentArray[$field] > 0)
				{
					// Format datetime object according to format in configuration file **TODO** this won't work!
					if ($field == 'datetime')
					{
						$dateObject = new DateTime($this->tableArray[$i]->$field);
						$value = $dateObject->format(SHORT_DATEFORMAT);
					}
					
					echo '
					<td align="left">'.$this->tableArray[$i]->$field.'</td>';
				}
			}
			
			// Optional edit hyperlink
			if (isset($this->editScript))
			{
				$value = $this->tableArray[$i];
				echo '<td align="left"><a href="'.$this->editScript.'?id='.$value->id.'">Edit</a></td>';
			}
			
			// Optional remove hyperlink
			if (isset($this->removeScript))
			{
				$value = $this->tableArray[$i];
				echo '<td align="left"><a href="'.$this->removeScript.'?id='.$value->id.'">Remove</a></td>';
			}
			
			echo '
				</tr>';
		}
		echo '
			</tbody>';
		
		// Close table element
		echo '	
		</table>';

	}
}

/**
 * Message class for information at top of HTML document
 * 
 * @package HTML
 * @property string $this->messageString String containing text of message
 * @property integer $this->messageType Alert or error
 */
class OEMessage extends OEObject
{
	/**
	 * Constructor
	 * 
	 * @param string $_messageString String containing text of message
	 * @param integer $_messageType Alert or error
	 */
	public function __construct($_messageString, $_messageType)
	{
		// Message String
		$this->messageString = $_messageString;
		
		// MessageType
		$this->messageType = $_messageType;
	}
}

/**
 * Field class has properties reflecting generic features of a table's field
 * 
 * @package HTML
 * @property string $this->name Name of field
 * @property integer $this->type Data type of field
 * @property integer $this->length Length of field
 * @property array $this->enumArray Array of enum values
 * @property mixed $this->default Default value
 */
class OEField extends OEObject
{
	/**
	 * Constructor
	 */
	public function __construct()
	{
		// Object properties and default values
		$this->name = "Default field";
		$this->type = OEFieldType::text;
		$this->length = 0;
		$this->enumArray = array();
		$this->default = NULL;
	}
}

/**
 * Enumeration of OpenEyes databases
 * 
 * @package Enumeration
 */
class OEDatabase
{
	const main = 0;
	const rbac = 1;
	const complog = 2;
}

/**
 * Enumeration of user modes
 * 
 * @package Enumeration
 */
class OEUserMode
{
    const login = 0;
    const admin = 1;
    const patient = 2;
}

/**
 * Enumeration of message types
 * 
 * @package Enumeration
 */
class OEMessageType
{
    const alert = 0;
    const error = 1;
}

/**
 * Enumeration of form submission status
 * 
 * @package Enumeration
 */
class OEFormSubmitStatus
{
	const unsubmitted = 0;
    const cancel = 1;
    const invalid = 2;
    const error = 3;
    const success = 4;
}

/**
 * Enumeration of view events contexts
 * 
 * @package Enumeration
 */
class OEViewEventsContext
{
	const view = 0;
    const display = 1;
    const edit = 2;
    const newe = 3;		// NB new is a PHP reserved word so use newe instead
    const save = 4;
    const cancel = 5;
}

/**
 * Enumeration of view admins contexts
 * 
 * @package Enumeration
 */
class OEViewAdminsContext
{
	const view = 0;
    const display = 1;
    const edit = 2;
    const save = 3;
    const cancel = 4;
}

/**
 * Enumeration of visual acuity format
 * 
 * @package Enumeration
 */
class OEAcuityFormat
{
	const ETDRS = 0;
	const SnellenFoot = 1;
	const SnellenMetre = 2;
	const Decimal = 3;
	const LogMar = 4;
}

/**
 * Enumeration of table field data types
 * 
 * @package Enumeration
 */
class OEFieldType
{
    const char = 0;
    const text = 1;
    const int = 2;
    const bool = 3;
    const float = 4;
    const decimal = 5;
    const date = 6;
    const enum = 7;
}

/**
 * Enumeration of specialties (must correspond with ids in specialties table)
 * 
 * @package Enumeration
 */
class OESpecialtyId
{
	const AccidentAndEmergency = 1;
	const Adnexal = 2;
	const Anaesthetics = 3;
	const Cataract = 4;
	const Cornea = 5;
	const External = 6;
	const Glaucoma =7;
	const MedicalRetina = 8;
	const NeuroOphthalmology = 9;
	const Oncology = 10;
	const Paediatrics = 11;
	const PrimaryCare = 12;
	const Strabismus = 13;
	const Uveitis = 14;
	const Vitreoretinal = 15;
	const Refractive = 16;
	const Ophthalmology = 17;
}

/**
 * Removes double spaces and vertical white space
 * 
 * @param string $_str Text to trim 
 * @return string
 */
function trimText($_str) 
{ 
    $_str = trim($_str); 
    $_str = preg_replace('/\h+/', ' ', $_str); 
    $_str = preg_replace('/\v{3,}/', PHP_EOL.PHP_EOL, $_str); 

    return $_str; 
}

/**
 * Replaces line endings in stored data with <br /> elements
 * 
 * @param string $_string Text to process 
 * @return string
 */
function replaceLineEndings($_string)
{
	 return preg_replace('/\n/', '<br />', $_string);
}
	
/**
 * Takes a variable number of string arguments and returns a comma separated string
 * 
 * @return string
 */
function concatWithCommas()
{
	$returnString = "";
	
	// Get number of argmumentsAdd each argument with comma and space if appropriate
    $num = func_num_args();
    
    if ($num > 0)
    {
    	// Add first one to return string
    	$returnString = func_get_arg(0);
    	
    	// Add others
    	for ($index = 1; $index < $num; $index++)
    	{
    		$arg = func_get_arg($index);
    		if (strlen($arg) > 0)
    		{
    			$returnString = $returnString.(strlen($returnString) > 0?', ':'').$arg;
    		}
    	}
    }
    
    return trim($returnString);
}

/**
 * Takes a variable number of string arguments and returns a comma separated string
 * 
 * @return string
 */
function concatWithSpaces()
{
	$returnString = "";
	
	// Get number of argmumentsAdd each argument with comma and space if appropriate
    $num = func_num_args();
    
    if ($num > 0)
    {
    	// Add first one to return string
    	$returnString = func_get_arg(0);
    	
    	// Add others
    	for ($index = 1; $index < $num; $index++)
    	{
    		$arg = func_get_arg($index);
    		if (strlen($arg) > 0)
    		{
    			$returnString = $returnString.(strlen($returnString) > 0?' ':'').$arg;
    		}
    	}
    }
    
    return trim($returnString);
}

/**
 * Echos a string, adding a <br /> element if the line is not blank
 * 
 * @param string $_string Text to process 
 * @return string
 */
function echoLine($_string)
{
	// Trim string
	$line = trim($_string);
	
	// Echo if not blank
	if (strlen($line) > 0)
	{
		echo $line."<br />";
	}
}

if (!function_exists('mb_ucfirst'))
{
	/**
	 * Multibyte version of ucfirst
	 * 
	 * @param string $str Text to process
	 * @param string $encoding Encoding type 
	 * @param boolean $lower_str_end True if remainder of string should be lowercase
	 * @return string
	 */
	function mb_ucfirst($str, $encoding = "UTF-8", $lower_str_end = false)
	{
		$first_letter = mb_strtoupper(mb_substr($str, 0, 1, $encoding), $encoding);
		$str_end = "";
		if ($lower_str_end)
		{
			$str_end = mb_strtolower(mb_substr($str, 1, mb_strlen($str, $encoding), $encoding), $encoding);
		}
		else
		{
			$str_end = mb_substr($str, 1, mb_strlen($str, $encoding), $encoding);
		}
		$str = $first_letter . $str_end;
		return $str;
	}
}

?>
