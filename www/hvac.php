<?php
	/* ***********************************************************
	2018-11-04 Vincent(dot)Cruvellier(at)gmail(dot)com
	
	php interface to operate the Executable Python File SendHVACCmdToRM2.py
	Installation Warning: Please make sure that SendHVACCmdToRM2.py file has a +x execution file property defined
	
	*/
	$obj = json_decode($_POST["myData"]);
	$arg_str = "";
	if ($obj->HVAC_OnOff === "ptrue")  {
		$arg_str = "-p ";
	}
	$arg_str = $arg_str . "-t " . $obj->HVAC_Temperature;
	switch ($obj->HVAC_Mode) {
		case "hot":
			$arg_str = $arg_str . " -c H";
			break;
		case "cold":
			$arg_str = $arg_str . " -c C";
			break;
		case "dry":
			$arg_str = $arg_str . " -c D";
			break;
		default: // 'AUTO'
			$arg_str = $arg_str . " -c A";
	}	
	switch ($obj->HVAC_FAN) {
		case "auto":
			$arg_str = $arg_str . " -F A";
			break;
		case "speed1":
			$arg_str = $arg_str . " -F 1";
			break;
		case "speed2":
			$arg_str = $arg_str . " -F 2";
			break;
		case "speed3":
			$arg_str = $arg_str . " -F 3";
			break;
		case "speed4":
			$arg_str = $arg_str . " -F 4";
			break;
		case "speed5":
			$arg_str = $arg_str . " -F 5";
			break;
		case "silent":
			$arg_str = $arg_str . " -F S";
			break;
		default: // 'AUTO'
			$arg_str = $arg_str . " -F A";
	}
	$arg_str = $arg_str . " -host=" . $obj->HVAC_IP . " -mac=".$obj->HVAC_MAC;
	$output = shell_exec("./SendHVACCmdToRM2.py $arg_str 2>&1");
	if (strpos($output, 'RUN=OK') !== false) {
		$tmpjson=" { \"success\" : 1, \"data\" : \"$arg_str\"}";
		$a = json_decode($tmpjson);
		die(json_encode($a));
	} else { // error
		$snip = str_replace(array('.', ' ', "\n", "\t", "\r"), '', $output);
		$tmpjson=" { \"success\" : 0, \"data\" : \"". $snip . "\" }";
		//echo $tmpjson;
		$a = json_decode($tmpjson);
		die(json_encode($a));
	}
	//exec(`/usr/bin/python3 --version`, $outputArray); // You might use this command line for debug purpose
	//print_r($outputArray);
	//exec('ls -la', $outputArray);
	//print_r($outputArray);	
?>