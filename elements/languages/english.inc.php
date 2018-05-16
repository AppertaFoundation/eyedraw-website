<?php
/**
 * language.inc.php
 * 
 * This file contains the text of all user messages in OpenEyes
 * Include the version of this file for your chosen language, and edit setting in config.php
 * 
 * <b>Language:</b> UK English
 * <b>Mode:</b> login, admin, patient
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
 * @version 0.9
 * Modification date: 9th October 2010
 * @copyright Copyright (c) 2010 OpenEyes
 * @package Base
 */

/**
 * Document titles
 */
DEFINE ('LANG_LOGIN_PAGE_TITLE', 'Login Page');

/**
 * Navigation bar tooltips and values
 */
DEFINE ('LANG_FIND_PATIENT_KEY', 'F');
DEFINE ('LANG_FIND_PATIENT_TITLE', 'Find a patient');
DEFINE ('LANG_FIND_PATIENT_VALUE', 'Find patient');
DEFINE ('LANG_ADMINS_KEY', 'A');
DEFINE ('LANG_ADMINS_TITLE', 'Admin tools');
DEFINE ('LANG_ADMINS_VALUE', 'Admin');
DEFINE ('LANG_BOOKINGS_KEY', 'B');
DEFINE ('LANG_BOOKINGS_TITLE', 'See operating lists and other schedules');
DEFINE ('LANG_BOOKINGS_VALUE', 'Bookings');
DEFINE ('LANG_AUDIT_KEY', 'D');
DEFINE ('LANG_AUDIT_TITLE', 'Access outcome data for research and audit');
DEFINE ('LANG_AUDIT_VALUE', 'Audit');
DEFINE ('LANG_PROFILE_KEY', 'P');
DEFINE ('LANG_PROFILE_TITLE', 'Read and edit user preferences and settings');
DEFINE ('LANG_PROFILE_VALUE', 'Profile');
DEFINE ('LANG_HOME_PAGE_KEY', 'H');
DEFINE ('LANG_HOME_PAGE_TITLE', 'Home page');
DEFINE ('LANG_HOME_PAGE_VALUE', 'Home');
DEFINE ('LANG_LOGOUT_KEY', 'O');
DEFINE ('LANG_LOGOUT_TITLE', 'Logout of system, return to login page');
DEFINE ('LANG_LOGOUT_VALUE', 'Logout');
DEFINE ('LANG_SUMMARY_KEY', 'M');
DEFINE ('LANG_SUMMARY_TITLE', 'Summary of patient details');
DEFINE ('LANG_SUMMARY_VALUE', 'Summary');
DEFINE ('LANG_EVENTS_KEY', 'C');
DEFINE ('LANG_EVENTS_TITLE', 'Clinical details');
DEFINE ('LANG_EVENTS_VALUE', 'Clinical');
DEFINE ('LANG_DIAGNOSES_KEY', 'D');
DEFINE ('LANG_DIAGNOSES_TITLE', 'View diagnoses');
DEFINE ('LANG_DIAGNOSES_VALUE', 'Diagnoses');
DEFINE ('LANG_CONTACTS_KEY', 'T');
DEFINE ('LANG_CONTACTS_TITLE', 'Manage contacts for this patient');
DEFINE ('LANG_CONTACTS_VALUE', 'Contacts');

/**
 * Event titles
 */
DEFINE ('LANG_EXAMINATION_EVENT_TITLE', 'Clinical examination');
DEFINE ('LANG_FIELD_EVENT_TITLE', 'Visual field');
DEFINE ('LANG_LETTERIN_EVENT_TITLE', 'Received correspondence');
DEFINE ('LANG_LETTEROUT_EVENT_TITLE', 'Outgoing correspondence');
DEFINE ('LANG_OUTCOME_EVENT_TITLE', 'Outcome form');
DEFINE ('LANG_PAEDIATRIC_EVENT_TITLE', 'Paediatric Data Collection Form');
DEFINE ('LANG_PHOTOGRAPH_EVENT_TITLE', 'Photograph(s)');
DEFINE ('LANG_OCT_EVENT_TITLE', 'OCT');
DEFINE ('LANG_LASER_EVENT_TITLE', 'Laser');

/**
 * Messages
 */
DEFINE ('LANG_LOGIN_REQUEST', 'Please enter your username and password');
DEFINE ('LANG_FIRM_SELECT_REQUEST', 'Please select a firm');
DEFINE ('LANG_NO_PERMISSION', 'Insufficient permissions');
DEFINE ('LANG_NOT_RECORDED', 'Not recorded');

/**
 * Error messages
 */
DEFINE ('LANG_GENERAL_ERROR', 'An error has occurred');
DEFINE ('LANG_DATABASE_CONNECTION_FAILED', 'The connection to the OpenEyes database has failed');
DEFINE ('LANG_ERR_UNSPECIFIED', 'Unspecified error');
DEFINE ('LANG_ERR_PASDOWN', 'The link to the PAS is currently down');
DEFINE ('LANG_ERR_INVALID_HOSNUM', 'Attempted to retrieve a patient record using an invalid hospital number');
DEFINE ('LANG_ERR_HOSNUM_NOT_IN_PAS', 'Attempted to retrieve a patient record using a hospital number which is not in the PAS');
DEFINE ('LANG_ERR_SQL_DOWN', 'The link to the main OpenEyes database is currently down');
DEFINE ('LANG_ERR_SQL_ERROR', 'The database query failed unexpectedly');
DEFINE ('LANG_ERR_UNDER_CONSTRUCTION', 'This part of OpenEyes is still under construction');

/**
 * Form elements
 */
DEFINE ('LANG_OK_VALUE', 'OK');
DEFINE ('LANG_AGE_VALUE', 'Age');
DEFINE ('LANG_NEW_USER_KEY', 'N');
DEFINE ('LANG_NEW_USER_TITLE', 'Add a new user to the database (Ctrl-Alt-N)');
DEFINE ('LANG_NEW_USER_VALUE', 'New');
DEFINE ('LANG_NEW_CONTACT_KEY', 'N');
DEFINE ('LANG_NEW_CONTACT_TITLE', 'Add a new contact to the database (Ctrl-Alt-N)');
DEFINE ('LANG_NEW_CONTACT_VALUE', 'New');
DEFINE ('LANG_NEW_MACRO_KEY', 'M');
DEFINE ('LANG_NEW_MACRO_TITLE', 'Add a new macro (Ctrl-Alt-M)');
DEFINE ('LANG_NEW_MACRO_VALUE', 'New');
DEFINE ('LANG_EDIT_KEY', 'Edit');
DEFINE ('LANG_EDIT_TITLE', 'Edit this event (Ctrl-Alt-E)');
DEFINE ('LANG_EDIT_VALUE', 'Edit');
DEFINE ('LANG_SAVE_KEY', 'S');
DEFINE ('LANG_SAVE_TITLE', 'Save (Ctrl-Alt-S)');
DEFINE ('LANG_SAVE_VALUE', 'Save');
DEFINE ('LANG_CANCEL_KEY', 'K');
DEFINE ('LANG_CANCEL_TITLE', 'Cancel (Ctrl-Alt-K)');
DEFINE ('LANG_CANCEL_VALUE', 'Cancel');
DEFINE ('LANG_DELETE_KEY', 'Y');
DEFINE ('LANG_DELETE_TITLE', 'Delete (Ctrl-Alt-Y)');
DEFINE ('LANG_DELETE_VALUE', 'Delete');

/**
 * Letter phrases
 */
DEFINE ('LANG_IOP_UNITS', 'mmHg');
DEFINE ('LANG_ON_RIGHT', 'on the right');
DEFINE ('LANG_ON_LEFT', 'on the left');
DEFINE ('LANG_AND', 'and');

/**
 * Other tooltips 
 */
DEFINE ('LANG_TIP_ADD_PENDING', 'Add this item to the current episode for this patient?');

/**
 * Miscellaneous terms
 */
DEFINE ('LANG_NO_LASER', 'No laser');

?>
