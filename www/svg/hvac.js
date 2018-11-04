// ********************************************************************
// HVAC.JS
// 2018-11-04, Vincent(dot)Cruvellier(at)gmail(dot)com
// Javascript Code for the Mitusbishi HVAC Remote commands
//		Dependencies: 
//			search.php 	: Script to localize RM MIni Bridge device on the network
//			hvac.php	: Script To call for requesting data to be sent to RM device
//

$(window).load(function(){

// Global Constants Declarations
const VANNE_mode = {AUTO:'auto',LEVEL1:'level1',LEVEL2:'level2',LEVEL3:'level3',LEVEL4:'level4',LEVEL5:'level5',SWING:'swing'}
const HVAC_vanne_circ = ['auto','level1','level2','level3','level4','level5','swing', 'auto']
const FAN_mode = {AUTO:'auto', SPEED1: 'speed1', SPEED2: 'speed2', SPEED3: 'speed3', SPEED4: 'speed4', SPEED5: 'speed5',SILENT:'silent' }
const HVAC_fan_circ = ['auto','speed1', 'speed2','speed3','speed4','silent', 'auto']
const HVAC_mode = { HOT: 'hot', COLD: 'cold', AUTO: 'auto', DRY: 'dry'}
const HVAC_mode_circ = ['hot','cold','auto','dry','hot']
// Global Variables Declarations
var hvac_fan
var hvac_mode
var hvac_vanne
var Temperature
var actualMode
var configuration_modified = false
var myVarTimeOut
var found = false

// This block of Javascript contain all elements to initiate the HVAC remote command init
// Check Local Web Storage Capability 
// We use this features to keep the last HVAC remote status / User preferences
if (typeof(Storage) !== "undefined") { // Check the Storage Capability
    // Code for localStorage/sessionStorage 
	
	// Host IP/MAC
	if (localStorage.LAST_HVAC_HOST_IP) {
		var select = document.getElementById("Host_Id_Adress");
		select.options.length=0;
		select.options[select.options.length] = new Option(localStorage.LAST_HVAC_HOST_IP,localStorage.LAST_HVAC_HOST_MAC, false, false);
		select.options[select.options.length] = new Option('Search Network','0', false, false);
	}
	// Temperature
    if (localStorage.HVAC_Temperature) {
        Temperature = localStorage.HVAC_Temperature;
    } else { Temperature = 21; }
    // actualMode
    if (localStorage.HVAC_OnOff) {
        actualMode = localStorage.HVAC_OnOff;
    } else { actualMode = false;}
    // hvac_mode
    if (localStorage.HVAC_Mode) {
        hvac_mode = localStorage.HVAC_Mode;
    } else {hvac_mode = HVAC_mode.AUTO; }
    // hvac_fan
    if (localStorage.HVAC_FAN) {
        hvac_fan = localStorage.HVAC_FAN;
    } else { hvac_fan = FAN_mode.AUTO;}
    // hvac_vanne
    if (localStorage.HVAC_VANNE) {
        hvac_vanne = localStorage.HVAC_VANNE;
    } else {hvac_vanne = VANNE_mode.AUTO;}    
} else {
    // Sorry! No Web Storage support..
    // We propose default values
    Temperature = 21;
    actualMode = false;
    hvac_mode = HVAC_mode.AUTO;
    hvac_fan = FAN_mode.AUTO;
    hvac_vanne = VANNE_mode.AUTO;
} // End Of if Storage

// Display the Interface considering values
showMode();
showFan();
showVanne();
hideDataToSend();
updateTextWithJQuery("hvac_temp_id", Temperature);
showTemp();

// Initialize the OnClick to the SVG elements
var svgElement = document.getElementById("cacheButton");
svgElement.addEventListener("click", function() { showCommands();})

var svgElement = document.getElementById("dataToSendButton");
svgElement.addEventListener("click", sendData)

var svgElement = document.getElementById("Button_Mode");
svgElement.addEventListener("click", function() { Click_HVAC_mode();}) 

var svgElement = document.getElementById("Button_Fan");
svgElement.addEventListener("click", function() { Click_HVAC_fan();}) 

var svgElement = document.getElementById("Button_Vanne");
svgElement.addEventListener("click", function() { Click_HVAC_vanne();}) 

var svgElement = document.getElementById("Ico_TempPlus");
svgElement.addEventListener("click", IncTemp);

var svgElement = document.getElementById("Ico_TempMoins");
svgElement.addEventListener("click", DecTemp);

var svgElement = document.getElementById("Ico_OnOff");
svgElement.addEventListener("click", switchOnOff) 


// End Of Init Block; Below are Functions declarations

/* ********************************************************************
/   Function:   Toast
/   Paremeters: msg
/   Purpose/Return: Display a short message to UI and disaper
/* ********************************************************************/
var toast=function(msg){ //https://gist.github.com/kamranzafar/3136584
	$("<div class='ui-loader ui-overlay-shadow ui-body-e ui-corner-all'><h3>"+msg+"</h3></div>")
		.css({ display: "block", 
			opacity: 0.90, 
			position: "fixed",
			padding: "7px",
			"background-color": "gray",
			"text-align": "center",
			width: "320px",
			left: ($(window).width() - 320)/2,
			top: $(window).height()/2 })
		.appendTo( $(Remote_HVAC_block )).delay( 1500 )
		.fadeOut( 400, function(){
			$(this).remove();
		});
} // End Of Toast()

/* ********************************************************************
/   Function:   ToastErr
/   Paremeters: msg
/   Purpose/Return: Display a short message to UI and disaper
/* ********************************************************************/
var toastErr=function(msg){ //https://gist.github.com/kamranzafar/3136584
	$("<div class='ui-loader ui-overlay-shadow ui-body-e ui-corner-all'><h3>"+msg+"</h3></div>")
		.css({ display: "block", 
			opacity: 0.90, 
			position: "fixed",
			padding: "7px",
			"background-color": "red",
			"text-align": "center",
			width: "600px",
			left: ($(window).width() - 600)/2,
			top: $(window).height()/2 })
		.appendTo( $(Remote_HVAC_block )).delay( 500 )
		.fadeOut( 4000, function(){
			$(this).remove();
		});
} // End Of Toast()

// **********************************************************************************
// AJAX Function: SearchRMBridge
// 	parameters: 
//          none
//
function SearchRMBridge() {

	if ($("#Host_Id_Adress>option:selected").html() != 'Search Network') { 
		return; // Return if Slection is diffrent from 'Search Network' function
	}
	toast('Launch of Network Discovery Request...'); // Inform User
	if (window.XMLHttpRequest) {
		// code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp = new XMLHttpRequest();
	} else {
		// code for IE6, IE5
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) { // If success call
			var myObj = JSON.parse(this.responseText); // Parse JSon Object returned
			if ( myObj.success ) { // Check returned status
				toast('Found ' + myObj.data.length + ' devices.'); // Inform User of Number of devices found
				var select = document.getElementById("Host_Id_Adress"); // Empty and Fill-In the Host Selection
				select.options.length = 0; // Erase All
				for (i = 0; i < myObj.data.length; i++) { // Iterate to add host IP and Mac information
					select.options[select.options.length] = new Option(myObj.data[i].Host_IP, myObj.data[i].Host_MAC, false, false);
					// https://memorynotfound.com/dynamically-add-remove-options-select-javascript/
				}
				found = true;
				select.options[select.options.length] = new Option('Search Network','0', false, false); // Re Add the Search Option
			} else
			{
				toast('Error:'+ myObj.data); // Error returned
			}
		}
	};
	xmlhttp.open("POST","search.php?f_func=40&type=M&t="+Math.random(),true); // Call the search function
	xmlhttp.send();
} // End Of SearchRMBridge()

// *******************************************************************************
// function Click_HVAC_mode
//		Called When User click on the HVAC Mode Ico
//	Parameters:	None
//	Return: None
// *******************************************************************************
function Click_HVAC_mode() {
	if (!(actualMode)) { return; }
  for (var i = 0; i < HVAC_mode_circ.length; i++) {
    if (HVAC_mode_circ[i]==hvac_mode) 
    	{
      	hvac_mode=HVAC_mode_circ[i+1];
        break;
      }
  }
	showDataToSend();
	showMode();
}

// *******************************************************************************
// function Click_HVAC_fan
//		Called When User click on the HVAC Fan Ico
//	Parameters:	None
//	Return: None
// *******************************************************************************
function Click_HVAC_fan() {
	if (!(actualMode)) { return; }
  for (var i = 0; i < HVAC_fan_circ.length; i++) {
    if (HVAC_fan_circ[i]==hvac_fan) 
    	{
      	hvac_fan=HVAC_fan_circ[i+1];
        break;
      }
  }
	showDataToSend();
	showFan();
}

// *******************************************************************************
// function Click_HVAC_vanne
//		Called When User click on the HVAC Vanne Ico
//	Parameters:	None
//	Return: None
// *******************************************************************************
function Click_HVAC_vanne() {
	if (!(actualMode)) { return; }
	configuration_modified = true;
  for (var i = 0; i < HVAC_vanne_circ.length; i++) {
    if (HVAC_vanne_circ[i]==hvac_vanne) 
    	{
      	hvac_vanne=HVAC_vanne_circ[i+1];
        break;
      }
  }
  showDataToSend();
	showVanne();
}

// *******************************************************************************
// function showCommands
//		Display HVAC Commands Area Mode/Fan/Vanne Ico
//		There is a 5s Timer before hidding it again to protect bad click
//	Parameters:	None
//	Return: None
// *******************************************************************************
function showCommands() {
  if (!(myVarTimeOut)) { clearTimeout(myVarTimeOut); }
  if (!(actualMode)) { return; }
  document.getElementById("cacheButton").style.visibility = 'hidden';
  myVarTimeOut = setTimeout(hideCommands, 5000);
}

// *******************************************************************************
// function hideCommands
//		Hide HVAC Commands Area Mode/Fan/Vanne Ico
//	Parameters:	None
//	Return: None
// *******************************************************************************
function hideCommands() {
  document.getElementById("cacheButton").style.visibility = 'visible';
}

// *******************************************************************************
// function sendData
//		Prepare and Send Data To The RM Mini Device
//	Parameters:	None
//	Return: None / User Toast Information
// *******************************************************************************
function sendData() {
	hideDataToSend();
	if (!(myVarTimeOut)) { clearTimeout(myVarTimeOut); }
	hideCommands();
	localStorage.setItem("HVAC_Temperature",Temperature);  
	localStorage.setItem("HVAC_OnOff",actualMode);
	localStorage.setItem("HVAC_Mode",hvac_mode);
	localStorage.setItem("HVAC_FAN",hvac_fan);
	localStorage.setItem("HVAC_VANNE",hvac_vanne);
	var RM_Mini_Ip_Selected = $("#Host_Id_Adress>option:selected").html();
	var RM_Mini_Mac_Selected = $("#Host_Id_Adress").val();
	localStorage.setItem("LAST_HVAC_HOST_IP",RM_Mini_Ip_Selected);  
	localStorage.setItem("LAST_HVAC_HOST_MAC",RM_Mini_Mac_Selected);  
	k(40,233,100); k(30,603,200);
	makeRequest(); // Call the function to call the RM Mini device
} // End Of sendData()

// *******************************************************************************
// function makeRequest
//		Send Data To The RM Mini Device
//	Parameters:	None
//	Return: None / User Toast Information
// *******************************************************************************
function makeRequest() {

	var RM_Mini_Ip_Selected = $("#Host_Id_Adress>option:selected").html();
	var RM_Mini_Mac_Selected = $("#Host_Id_Adress").val();
	var myData = {
		HVAC_OnOff: 'p'+actualMode, 
		HVAC_Temperature: Temperature, 
		HVAC_Mode: hvac_mode, 
		HVAC_FAN: hvac_fan, 
		HVAC_VANNE: hvac_vanne,
		HVAC_IP: RM_Mini_Ip_Selected,
		HVAC_MAC: RM_Mini_Mac_Selected
		}; 
    var dataString = JSON.stringify(myData); 
	$.ajax({
		type:"POST",
		url:"hvac.php",
		data: {myData: dataString},
		success : function(code_html, statut){ 
			var myObj = JSON.parse(code_html)
			if ( myObj.success ) {
				toast('IR Command Executed.\n' + myObj.data);
			} else {
				toastErr('IR Command Error.\n' + myObj.data);
			}
		},
		error : function(resultat, statut, erreur){
			alert ("Error" + statut);
		}    
	});
} // End Of makeRequest()

// *******************************************************************************
// function showDataToSend
//		Show the 'Data To Send' Ico (In Red)
//		That Ico is displayed anytime configuration has changed.
//		When User click on that Ico then the Data is send to the selected RM Mini
//	Parameters:	None
//	Return: None 
// *******************************************************************************
function showDataToSend() {
	configuration_modified = true;
	k(30,480,6); // Probably the ugly part to let user enable/disbale
	if (!(myVarTimeOut)) { clearTimeout(myVarTimeOut); }
	document.getElementById("dataToSend").style.visibility = 'visible';
	document.getElementById("dataToSendButton").style.visibility = 'visible';
} // End Of showDataToSend()

// *******************************************************************************
// function hideDataToSend
//		Show the 'Data To Send' Ico (in Red)
//	Parameters:	None
//	Return: None
// *******************************************************************************
function hideDataToSend() {
	configuration_modified = false;
	document.getElementById("dataToSend").style.visibility = 'hidden';
	document.getElementById("dataToSendButton").style.visibility = 'hidden';
} // End Of hideDataToSend()

// *******************************************************************************
// function showVanne
//		Show the Actual selected Vanne Mode Ico
//	Parameters:	None
//	Return: None
// *******************************************************************************
function showVanne() {
      document.getElementById("Ico_Vanne_Ico").style.visibility = 'hidden';
      document.getElementById("Ico_Vanne_Level1").style.visibility = 'hidden';
      document.getElementById("Ico_Vanne_Level2").style.visibility = 'hidden';
      document.getElementById("Ico_Vanne_Level3").style.visibility = 'hidden';
      document.getElementById("Ico_Vanne_Level4").style.visibility = 'hidden';
      document.getElementById("Ico_Vanne_Level5").style.visibility = 'hidden';
      document.getElementById("Ico_Vanne_Auto").style.visibility = 'hidden';
      document.getElementById("Ico_Vanne_Swing").style.visibility = 'hidden';

      if (actualMode) {
      		//alert("event fired! " + hvac_vanne);
          document.getElementById("Ico_Vanne_Ico").style.visibility = 'visible';
          switch(hvac_vanne){
              case VANNE_mode.AUTO:
                  document.getElementById("Ico_Vanne_Auto").style.visibility = 'visible';
                  break;
							case VANNE_mode.LEVEL1:
                  document.getElementById("Ico_Vanne_Level1").style.visibility = 'visible';
                  break;
							case VANNE_mode.LEVEL2:
                  document.getElementById("Ico_Vanne_Level2").style.visibility = 'visible';
                  break;  
							case VANNE_mode.LEVEL3:
                  document.getElementById("Ico_Vanne_Level3").style.visibility = 'visible';
                  break;  
							case VANNE_mode.LEVEL4:
                  document.getElementById("Ico_Vanne_Level4").style.visibility = 'visible';
                  break;  
							case VANNE_mode.LEVEL5:
                  document.getElementById("Ico_Vanne_Level5").style.visibility = 'visible';
                  break;                    
              case VANNE_mode.SWING:
                  document.getElementById("Ico_Vanne_Level1").style.visibility = 'visible';
      						document.getElementById("Ico_Vanne_Level2").style.visibility = 'visible';
      						document.getElementById("Ico_Vanne_Level3").style.visibility = 'visible';
      						document.getElementById("Ico_Vanne_Level4").style.visibility = 'visible';
      						document.getElementById("Ico_Vanne_Level5").style.visibility = 'visible';
                  document.getElementById("Ico_Vanne_Swing").style.visibility = 'visible';
                  break;
				 }
      }
} // End Of showVanne()

// *******************************************************************************
// function showFan
//		Show the Actual selected Fan Mode Ico
//	Parameters:	None
//	Return: None
// *******************************************************************************
function showFan() {
      document.getElementById("Ico_Fan_Auto").style.visibility = 'hidden';
      document.getElementById("Fan_Speed1").style.visibility = 'hidden';
      document.getElementById("Fan_Speed2").style.visibility = 'hidden';
      document.getElementById("Fan_Speed3").style.visibility = 'hidden';
      document.getElementById("Fan_Speed4").style.visibility = 'hidden';
      document.getElementById("Ico_Ventilateur").style.visibility = 'hidden';
      //document.getElementById("Fan_Auto").style.visibility = 'hidden';
      document.getElementById("Ico_Silent").style.visibility = 'hidden';

      if (actualMode) {
      	//alert("event fired!" + hvac_fan);
        document.getElementById("Ico_Ventilateur").style.visibility = 'visible';
        switch(hvac_fan){
            case FAN_mode.AUTO:
                document.getElementById("Ico_Fan_Auto").style.visibility = 'visible';
                break;
			case FAN_mode.SILENT:
                document.getElementById("Ico_Silent").style.visibility = 'visible';
                break;
			case FAN_mode.SPEED1:
                document.getElementById("Fan_Speed1").style.visibility = 'visible';
                break;  
			case FAN_mode.SPEED2:
                document.getElementById("Fan_Speed1").style.visibility = 'visible';
				document.getElementById("Fan_Speed2").style.visibility = 'visible';
                break;  
			case FAN_mode.SPEED3:
                document.getElementById("Fan_Speed1").style.visibility = 'visible';
				document.getElementById("Fan_Speed2").style.visibility = 'visible';
                document.getElementById("Fan_Speed3").style.visibility = 'visible';
                break;  
			case FAN_mode.SPEED4:
                document.getElementById("Fan_Speed1").style.visibility = 'visible';
				document.getElementById("Fan_Speed2").style.visibility = 'visible';
                document.getElementById("Fan_Speed3").style.visibility = 'visible';
				document.getElementById("Fan_Speed4").style.visibility = 'visible';
				break;  
			case FAN_mode.SPEED5:
                document.getElementById("Fan_Speed1").style.visibility = 'visible';
				document.getElementById("Fan_Speed2").style.visibility = 'visible';
                document.getElementById("Fan_Speed3").style.visibility = 'visible';
				document.getElementById("Fan_Speed4").style.visibility = 'visible';
				document.getElementById("Fan_Speed5").style.visibility = 'visible';
				break;                    
		}
      }
} // End Of showFan()

// *******************************************************************************
// function showMode
//		Show the Actual selected HVAC Mode Ico
//	Parameters:	None
//	Return: None
// *******************************************************************************
function showMode() { //Button_Mode

      document.getElementById("Mode_Hot").style.visibility = 'hidden';
      document.getElementById("Mode_Cold").style.visibility = 'hidden';
      document.getElementById("Mode_Auto").style.visibility = 'hidden';
      document.getElementById("Mode_Dry").style.visibility = 'hidden';

      if (actualMode) {
      	  //alert("event fired!" + hvac_mode);
          switch(hvac_mode){
              case HVAC_mode.AUTO:
                  document.getElementById("Mode_Auto").style.visibility = 'visible';
                  break;
              case HVAC_mode.HOT:
                  document.getElementById("Mode_Hot").style.visibility = 'visible';
                  break;
              case HVAC_mode.COLD:
                  document.getElementById("Mode_Cold").style.visibility = 'visible';
                  break;
              case HVAC_mode.DRY:
                  document.getElementById("Mode_Dry").style.visibility = 'visible';
                  break;
          }
      }

 } // End Of showMode()

// *******************************************************************************
// function showTemp
//		Display the Temperature
//	Parameters:	None
//	Return: None
// *******************************************************************************
function showTemp() {
	var svgElement = document.getElementById("Temperature")
  if (actualMode) { svgElement.style.visibility ='visible'; } else {svgElement.style.visibility ='hidden'; }
} // End Of showTemp()

// *******************************************************************************
// function IncTemp
//		Increase The Temperature of 1 deg 
//	Parameters:	None
//	Return: None
// *******************************************************************************
function IncTemp() {
	if (actualMode) {
  	configuration_modified = true;
  	showDataToSend();
  	Temperature++;
  	updateTextWithJQuery("hvac_temp_id", Temperature);
  }
} // End Of IncTemp()

// *******************************************************************************
// function DecTemp
//		Increase The Temperature of 1 deg 
//	Parameters:	None
//	Return: None
// *******************************************************************************
function DecTemp() {
	if (actualMode) {
		configuration_modified = true;
  	showDataToSend();
		Temperature--;
  	updateTextWithJQuery("hvac_temp_id", Temperature); 
  }
} // End Of DecTemp()

// *******************************************************************************
// function updateTextWithJQuery
//		Modify the text in a specific div within the SVG
//	Parameters:	
//		tspanId: div id to affect
//		txt: text value to set
//	Return: None
// *******************************************************************************
function updateTextWithJQuery(tspanId, txt) {
	$("#"+tspanId).text(txt+'°c');
} // End Of updateTextWithJQuery()

// *******************************************************************************
// function switchOnOff
//		Update the remote when user click On/Off Ico
//	Parameters:	None
//	Return: None
// *******************************************************************************
function switchOnOff() {
	//alert("Click event fired!" + actualMode);
	actualMode = !(actualMode);
  configuration_modified = true;
  showTemp();
  showMode();
  showFan();
  showVanne();
  showDataToSend();  
} // End Of switchOnOff()


// gain, frequency, duration
a=new AudioContext()

// *******************************************************************************
// function k
//		Make a beep
//	Parameters:	w,x,y : Freguencies
//	Return: None
// *******************************************************************************
function k(w,x,y){
  //console.log(w+x+y)
  v=a.createOscillator()
  u=a.createGain()
  v.connect(u)
  v.frequency.value=x
  v.type="square"
  u.connect(a.destination)
  u.gain.value=w*0.01
  v.start(a.currentTime)
  v.stop(a.currentTime+y*0.001)
} // End Of k()

});
