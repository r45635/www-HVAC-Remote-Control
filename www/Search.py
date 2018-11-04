#!/usr/bin/env python3
""" 	
	FUN With Broadlink IR Mini 
	https://github.com/r45635/HVAC-IR-Control
"""

#Script to locate Broadlink devices on local network by Graeme Brown Dec 23 2016
#These must be set up using the Broadlink app first!

import sys
sys.path.insert(1,'/usr/local/lib/python3.5/site-packages'); # Probaly diffrent for you (sudo pip3 install broadlink)
import broadlink
import time
from datetime import datetime

import binascii
import argparse
import math
import json

""" 
print("************************************************")
print("Using python library created by Matthew Garrett")
print("https://github.com/mjg59/python-broadlink")
print("************************************************")
print("Scanning network for Broadlink devices....")
"""
mydevices = broadlink.discover(timeout=5)
#print("Found " + str(len(mydevices )) + " broadlink devices")
time.sleep(1)
#print("...............")
#dataJson = "{ \"search\" : ["
dataJson = "["

for index, item in enumerate(mydevices):

  mydevices[index].auth()

  ipadd = mydevices[index].host
  ipadd = str(ipadd)
  
  s = str(mydevices[index].host)
  start = s.find('(\'') + 2
  end = s.find('\'', start)
  ip_host = s[start:end]
  start = s.find(',') + 1
  end = s.find(')', start)
  ip_port = s[start:end]

# s = 'gfgfdAAA1234ZZZuijjk'
# start = s.find('AAA') + 3
# end = s.find('ZZZ', start)
# s[start:end]
# '1234' --- ('192.168.2.100', 80)

  #print(mydevices[index].type)
  #print(" Device " + str(index + 1) + " Host address = " + ipadd[1:19])
  macadd = ''.join(format(x, '02x') for x in mydevices[index].mac[::-1])
  macadd = str(macadd)
 
  #mymacadd = macadd[:2] + ":" + macadd[2:4] + ":" + macadd[4:6] + ":" + macadd[6:8] + ":" + macadd[8:10] + ":" + macadd[10:12]
  mymacadd = macadd[:2] + "" + macadd[2:4] + "" + macadd[4:6] + "" + macadd[6:8] + "" + macadd[8:10] + "" + macadd[10:12]
  #print("Device " + str(index + 1) +" MAC address = " + mymacadd)
  
  if (index>0):
    dataJson = dataJson + ','
  
  dataJson = dataJson + " {\"Device_Id\" : " + str(index+1) +",\"Type\" : \"" + mydevices[index].type +"\",\"Host_IP\" : \"" + str(ip_host) +"\", \"Host_Port\" : \"" + str(ip_port)+ "\", \"Host_MAC\" : \""+ mymacadd + "\"}"
  #print("...............")


dataJson = dataJson + ']'

print(" { \"success\" : 1, \"data\" : " + dataJson + "}")

  