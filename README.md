# MMM-Deezer
A module for the [MagicMirror](https://github.com/MichMich/MagicMirror) using Deezer's webservice.

This module allows you to play music from [Deezer](https://www.deezer.com) with [puppeteer](https://pptr.dev/). That means you need at least a free account from Deezer. It is meant to be used with a speech recognition module like [MMM-GoogleAssistant](https://wiki.bugsounet.fr/en/MMM-GoogleAssistant), but it should work with other modules as long as you send the correct notifications as described below. Since this module opens up a chromium instance and navigates through the deezer website to play music in the background, it may take some time or you may get timeouts on low end hardware like a Raspberry Pi.

Confirmed working environment:
- Raspberry Pi 4 with Raspberry Pi OS Bullseye (32/64-Bit) with preinstalled chromium, a node installation and latest [MagicMirror](https://github.com/MichMich/MagicMirror) (v.2.25.0) with electron v.26.3.0 preinstalled.

### Screenshot
![](https://raw.githubusercontent.com/ptrk95/MMM-Deezer/master/img/Example.png)
## Installation

#### Have a look at the Troubleshooting section if it says "Initializing..." all the time or throws other errors

Install like that:

```
cd ~/MagicMirror/modules/
git clone https://github.com/lxne/MMM-Deezer.git
cd MMM-Deezer
npm install
```
It installs a puppeteer package with a chromium browser (~100mb-270mb). If you don't want to use the puppeteer browser or if you're running on a Raspberry Pi you may want to delete this extra chromium browser:

```
cd ~/MagicMirror/modules/MMM-Deezer/node_modules/puppeteer
rm -r .local-chromium
```


## Configuration

Copy the following to your config.txt:
```
{
	module: "MMM-Deezer",
	position: "upper_third",
	config: {
		chromiumPath : "/usr/bin/chromium-browser",  // chromiumPath : null, if you want to use puppeteer browser
		showCover : true,
		showBrowser : false,    // change to true if you want to see whats going on in the browser
		userDataDir : "/home/pi/.config/chromium" //the directory of your user data from the browser, default is for raspberry pi without changes
	 }
 },
```
# Update 17.03.2019 reCaptcha problem:

Since Deezer uses reCaptcha you need to use a preinstalled browser! 
Open up the browser you use for puppeteer (e.g. Pi users: chromium). Log in to Deezer. Close the Browser and make sure the next time you go to the Deezer website, you should already be logged in!

Change the userDataDir in your config file to your needs. For example the path of your user data directory using a Raspberry Pi without any changes should be: "/home/pi/.config/chromium" 


#### The module is now READY and should log you in, which looks similar to the screenshot! But you can't control it if you don't send any notifications to it, as described below.

## Setup
### This explains how to use the module but you can copy paste most of the time

The module's features:
- Play music 
- Pause music
- Play next title
- Play previous title (if available)
- Play Deezer Flow
- Play your favourite tracks randomly (may take a while to start, first song always the same)
- Stop music (closes browser, but module remains active)

#### Hint: Wait for initialization and log in process before sending any notifications to this module! When the module is ready it looks like the screenshot.

To use the above features you have to send predefined notifications to this module. This is a table of the notifications:

| Notification | payload | Description |
|:------------ |:------- |:----------- |
| "AtDeezer" | payload.message="Play" | Plays music |
| "AtDeezer" | payload.message="Pause" | Pauses music |
| "AtDeezer" | payload.message="Next" | Plays next Title |
| "AtDeezer" | payload.message="Previous" | Plays previous Title |
| "AtDeezer" | payload.message="Close" | Closes Browser |
| "AtDeezer" | payload.message="Flow" | Plays your personal soundtrack made by Deezer |
| "AtDeezer" | payload.message="Loved" | Plays your favourite tracks randomly |




## Troubleshooting

#### Preinstalled Chromium/Chrome not launching or "Initializing..." all the time
That's most likely a versioning error between puppeteer and your installation of Chromium/Chrome! 

Fix the versioning error. Sorry, haven't had the issue yet.

Make sure you set the correct path in the config.txt file. 

For Raspberry Pi 3 it is: "/usr/bin/chromium-browser"
