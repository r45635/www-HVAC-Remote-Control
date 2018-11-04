<?php
	/* ***********************************************************
	2018-11-04 Vincent(dot)Cruvellier(at)gmail(dot)com
	
	php interface to operate the Executable Python File Search.py
	Installation Warning: Please make sure that Search.py file has a +x execution file property defined
	
	*/
	$output = shell_exec("./Search.py 2>&1");
	$a = json_decode($output);
	die(json_encode($a));
?>