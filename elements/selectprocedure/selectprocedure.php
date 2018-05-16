<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<?php
	// Include database class
	require_once ('../classes/OEDBConnectionClass.inc.php');
	
	// Connect to database
	$dbc = new OEDBConnection(OEDatabase::main);
	
	// Arrays
	$specialties = array();
?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
	<title>OpenEyes</title>
	
	<!-- CSS -->
	<link rel="stylesheet" href="../../css/openeyes.css" type="text/css" media="screen" />
	<link rel="stylesheet" href="styles.css" type="text/css" media="screen" />

    <!--   Javascript  -->	
	<script language="JavaScript" src="../../scripts/elements.js" type="text/javascript"></script>
	<script language="JavaScript" src="../../scripts/common.js" type="text/javascript"></script>	
	<script language="JavaScript" src="../../scripts/incrementalSearch.js" type="text/javascript"></script>
	<script language="JavaScript" src="procedures.js" type="text/javascript"></script>
	    
    <!--   This script handles the drawings for the page   -->
    <script type="text/javascript">
                            
        // Runs on page load
        function init()
        {
         	// Set select to Adnexal to start with
        	document.getElementById('specialty').selectedIndex = 1;
        	
       		// Populate select
        	updateSelect("common","Adjunctive");
        }

<?php
	// Output list of specialties as select options
	if ($dbc->isConnected())
	{				

		$q = "SELECT id, name FROM specialty ORDER BY name ASC";
		$success = $dbc->execute($q);
		
		if ($success)
		{
			$count = $dbc->recordCount();
			if ($count > 0)
			{
				$specialties = $dbc->resultArray();
			}
		}
	}
?>

		// Called when specialty changes;
		function specChanged(_id)
		{
			switch (_id)
			{		            
<?php
	foreach ($specialties as $specialty)
	{

		// Is there a subsection?
		$q = "SELECT * FROM specialty_subsection WHERE specialty_id = $specialty->id ORDER BY name ASC";
		$success = $dbc->execute($q);
		
		if ($success)
		{
			$count = $dbc->recordCount();
			if ($count > 0)
			{
				$subsections = $dbc->resultArray();
				echo '
				case "'.$specialty->id.'":
					document.getElementById("subsection").style.display = \'inline\';
					document.getElementById("subsection").selectedIndex = 0;			
					updateSelect("common","'.$subsections[0]->name.'");
					break;';
			}
		}					
	}
?>

				default:
					document.getElementById("subsection").style.display = 'none';
					updateSelect("common","All");	
					break;	
			}
		}
		
		// Change the options in the _select according to subsection
		function updateSelect(_selectId, _subsection)
		{
			// Get reference to the select
			var sel = document.getElementById(_selectId);
			
			var specialty_id = document.getElementById("specialty").value;
			
			// Remove all options
			sel.options.length = 0;
		
			// First title
			sel.options[sel.options.length] = new Option("Common procedures","");
						
			// Repopulate with correct format
			switch (specialty_id)
			{
			
<?php
	foreach ($specialties as $specialty)
	{
		echo '
				case"'.$specialty->id.'":';

		// Is there a subsection?
		$q = "SELECT * FROM specialty_subsection WHERE specialty_id = $specialty->id ORDER BY name ASC";
		$success = $dbc->execute($q);
		
		if ($success)
		{
			$count = $dbc->recordCount();
			
			// There is a subsection
			if ($count > 0)
			{
				$subsections = $dbc->resultArray();
				echo '
					switch (_subsection)
					{';
							
				foreach ($subsections as $subsection)
				{
					echo '
						case "'.$subsection->name.'":';
						
						
					$q = "SELECT term, short_format FROM proc, proc_specialty_subsection_assignment WHERE proc.id = proc_specialty_subsection_assignment.proc_id AND proc_specialty_subsection_assignment.specialty_subsection_id = $subsection->id ORDER BY term ASC";
					$success = $dbc->execute($q);
					if ($success)
					{
						$count = $dbc->recordCount();
						if ($count > 0)
						{
							$items = $dbc->resultArray();
							foreach ($items as $item)
							{
								echo '
							sel.options[sel.options.length] = new Option("'.$item->term.'", "'.$item->short_format.'");';
							}
						}
					}		
						
				
							
					echo '
							break;';
										
				}
				
					echo '
						default:
							console.log("default");
							break;
					}
					break;';
								

			}
			// NO subsection
			else
			{
				$q = "SELECT term, short_format FROM proc, proc_specialty_assignment WHERE proc.id = proc_specialty_assignment.proc_id AND proc_specialty_assignment.specialty_id = $specialty->id ORDER BY term ASC";
				$success = $dbc->execute($q);
				if ($success)
				{
					$count = $dbc->recordCount();
					if ($count > 0)
					{
						$items = $dbc->resultArray();
						foreach ($items as $item)
						{
							echo '
					sel.options[sel.options.length] = new Option("'.$item->term.'", "'.$item->short_format.'");';
						}
					}
				}					
				
				echo '
					break;';
			}
		}
						
	}
?>

			}
			
			// Set focus to select
			document.getElementById("common").focus();
		}


   </script>
</head>

<body onload="init();">
<div id="screen" align="center">
	<div id="content">

		<!-- Logo -->
		<img id="logo" src="../../images/OpenEyes_logo.png" align="left" alt="OpenEyes - an open source electronic patient record" />
		
		<!-- Navigation bar -->
		<div id="main_nav">
			<ul>
				<li><a id="home" href="../../index.html">Home</a></li>
				<li><a id="news" href="../../news.html">News</a></li>
				<li><a id="screenshots" href="../../screenshots.html">Screenshots</a></li>
				<li><a id="documentation" href="../../documentation.html">Documentation</a></li>
				<li><a id="contributors" href="../../contributors.html">Contributors</a></li>
				<li><a id="development_selected" href="../../development.html">Development</a></li>
				<li><a id="contact" href="../../contact.html">Contact us</a></li>
			</ul>
		</div>
		
		<!-- Text -->
		<h2>Enter Procedure Element</h2>

		<div class="section">
			<h4>Description:</h4>
			<p>This element allows the rapid entry of one of more coded procedures. Searching for procedures among a large set of possible values can be slow compared with direct text entry.</p>
			<p>The approach illustrated here is based on the "90:10" rule, and the fact that most medical sub-specialties have a limited number of common procedures which they encounter 90% of the time. In this example, those common procedures are available in a drop down menu, and all other ophthalmic procedures are available using the incremental search box.</p>
			<p>Power users who are familiar with the system can enter a procedure with a minimum of key strokes. Alternatively simply select from the drop down menu. For other procedures, tab to the incremental search box and start typing.</p>
			<p>The specialty is set at logon, but for the purposes of this demonstration can be changed using the drop-down menu in the settings section. Specialties also have the option of having subsections if they have a large number of common procedures. This is indicated here for  Adnexal</p>
			<p>Possible enhancements would include a full hierarchical procedure browser.</p>
			<p>Status: <b>Alpha</b></p>
		</div>
	
		<!-- Settings section -->
		<div class="section" style="height:76px;" align="left">
			<h4>Settings:</h4>
			<table cellspacing="0" width="620" >
				<tbody>				
					<tr>
						<td align="left" width="60%"><p class="complable" >Specialty:</p></td>
						<td align="left" width="40%">
							<select id="specialty" style="width: auto;" onchange="specChanged(this.value);">
<?php
	foreach ($specialties as $specialty)
	{
		echo '								<option value="'.$specialty->id.'">'.$specialty->name.'</option>'."\n";

	}
?>
							</select>
						</td>
					</tr>
				</tbody>
			</table>
		</div>


		<!-- Edit mode section -->
		<div class="section" style="height:310px;" align="left">

			<!-- Overall width -->
			<div style ="width:620; float:left;">			
				<h4>Edit mode:</h4>
				
					<!-- Two column layout -->
					<div style="float:left; width: 220px; height: 120px;">
					
						<!-- Select for category -->
						<select style="display:inline;" class="sidebar" id="subsection" title="Subsections for your specialty" onchange="updateSelect('common',this.value);" onkeyup="selectKeyUp(event);">
							<option value="Ancillary">Ancillary</option>
							<option value="Corneoplastic">Corneoplastic</option>						
							<option value="Lacrimal">Lacrimal</option>
							<option value="Lid">Lid</option>
							<option value="Orbit">Orbit</option>
							<option value="Socket & eye removal">Socket & eye removal</option>
						</select>
							
						<!-- Select for common procedures -->
						<select class="sidebar" id="common" title="Common procedures for your specialty" onchange="setProcedure(this.value)" onkeyup="selectKeyUp(event);">
						</select>
						
						<!-- text box for incremental search -->
						<input type="text" class="entrytext" id="is_entry" title="Any procedure can be found by typing here" onkeyup="entryKeyUp(event);"><br/>	
						<div id="results"></div>
					</div>
					<div style="float:right; width: 320px; height: 120px;">
						<table cellspacing="0" width="540" >
						<tbody>		
							<tr height="40px">
								<td align="left" width="20%">Operation:</td>
								<td align="left" width="80%" style="border: none; padding-left: 8px; padding-bottom: 4px;">
									<p id="procedure_display"></p>
						        </td>
						    </tr>
						    <tr>
						    	<td></td>
								<td align="left"><button id="clearButton" style="padding: 5px;margin: 0px; display:none;" onclick="clearProcedure();">Clear</button></td>
							</tr>
						</tbody>	
						</table>
					</div>				
			</div>
		</div>						

		<!-- Display mode section -->
		<div class="section" style="height:70px;" align="left">
		
			<!-- Overall width -->
			<div style ="width:540; float:left;">
				<h4>Display mode:</h4>
				<div style="float:left; width: 120px; height: 50px;">
					<p>Operation:</p>
				</div>
				<div style="float:right; width: 420px; height: 50px;">
					<p>Vitrectomy/peel/gas</p>
				</div>
			</div>
	

		<!-- End of Display mode section -->
		</div>	

		<!-- Steering Group -->			
		<div class="section" align="left">
			<h4>Steering Group:</h4>
			<p>General</p>
		</div>
		
		<!-- Blank Line -->
		<div class="section">
		</div>

	</div>
</div>

<script type="text/javascript">

  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-26543772-1']);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();

</script>
</body>
</html>
