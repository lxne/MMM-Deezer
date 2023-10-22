"use strict";


const puppeteer = require('puppeteer');
var NodeHelper = require("node_helper");
var self;

module.exports = NodeHelper.create({

	start : function(){
		self = this;
		self.playingMusic = false;
		self.loggedIn = false;
		self.page;
		self.browser;
		self.config = {};
		self.AdsPlaying = false;
		self.closed = false;
	},

	socketNotificationReceived: function(notification, payload) {
		self.closed = false;
		switch(notification){
			case("CONFIG"):
				self.config = payload;
				LoginDeezer();
				break;
			case("PLAY"):
				playMusic();
				break;
			case("PAUSE"):
				pauseMusic();
				break;
			case("NEXT"):
				nextTitle();
				break;
			case("PREVIOUS"):
				previousTitle();
				break;
			case("Close"):
				closeBrowser(false);
				self.closed = true;
				break;
			case("FLOW"):
				playFlow();
				break;
			case("LOVED"):
				playLoved();
				break;
			default:
				break;			
		}
	}, 

	stop : function(){
		closeBrowser(true);
	}
});

async function closeBrowser(stop){
	try{
		if(!self.closed){
			if(!stop){
				self.sendSocketNotification("Closed", "");
			}
			self.loggedIn = false;
			self.playingMusic = false;
			await self.page.close();
			await self.browser.close();
		}
		
		
	}catch(error){
		console.error(error);
	}

}


async function LoginDeezer(){
	try{
		if(self.config.chromiumPath != null){
			self.browser = await puppeteer.launch({ args: ['--user-data-dir=' + self.config.userDataDir], defaultViewport: {width : 1920, height:  1080}, executablePath: self.config.chromiumPath, ignoreDefaultArgs: ['--mute-audio'], headless : !self.config.showBrowser }); // headless : false
		}else{
			self.browser = await puppeteer.launch({args: ['--user-data-dir=' + self.config.userDataDir], defaultViewport: {width : 1920, height:  1080}, ignoreDefaultArgs: ['--mute-audio'], headless : !self.config.showBrowser }); // headless : false
		}
	
		self.page = await self.browser.newPage();
		
		await self.page.setDefaultNavigationTimeout(120000);
		await self.page.goto("https://www.deezer.com/en/"); // Englische Seite aufrufen um entlische Selektoren für Klick-Befehle zu erzwingen

		//await self.page.waitForNavigation(); // somehow doesn't work, just sits there for ever
		self.sendSocketNotification("Ready", "");
		console.error("ready to play music");

		self.loggedIn = true;
		updateTitleAndArtist();
	}catch(error){
		console.error(error);
	}
	
    //await page.evaluate(()=>document.querySelector('.is-highlight').click())
}

async function update(){
	while(self.playingMusic){
		await updateTitleAndArtist();
		await delay(1000);
	}
}

function delay(time) {
	return new Promise(function(resolve) { 
		setTimeout(resolve, time)
	});
 }



async function getCover(){
	try{
		if(!self.playingMusic){
			if(!self.loggedIn){
				await LoginDeezer()
			}	
		} 
		await delay(1500);
		var link = await self.page.evaluate(()=>document.querySelector('#page_player div.player-options button.queuelist > figure > div > img').getAttribute('src'));
		//var link = await self.page.evaluate(()=>document.querySelector('#page_player > div > div.player-options > ul > li:nth-child(2) > button > figure > div > img').getAttribute('src'));
		var newlink = link.replace("28x28", "380x380");
		self.sendSocketNotification("Cover", newlink);
		console.error("got coverlink: " + newlink + " old Link: " + link); 
	}catch(error){
		console.error(error);
	}

}

async function playMusic (){
	try{
		if(!self.playingMusic){
			if(!self.loggedIn){
				await LoginDeezer()
			}
			await self.page.evaluate(()=>document.querySelector('#page_player div.player-controls button[aria-label="Play"]').click()); // EN-Selector
			//await self.page.evaluate(()=>document.querySelector('#page_player > div > div.player-controls > ul > li:nth-child(3) > button').click());
			self.playingMusic = true;
			update();
			console.error("playing music");
		}   
	}catch(error){
		console.error(error);
	}

}

async function pauseMusic (){
	try{
		if(self.playingMusic){
			if(!self.loggedIn){
				await LoginDeezer()
			}
			await self.page.evaluate(()=>document.querySelector('#page_player div.player-controls button[aria-label="Pause"]').click()); // EN-Selector, selbes Element anderes label
			//await self.page.evaluate(()=>document.querySelector('#page_player > div > div.player-controls > ul > li:nth-child(3) > button').click());  // yep, the same as playMusic()
			self.playingMusic = false;
			console.error("pause music");
		}  
	}catch(error){
		console.error(error);
	}

}

async function updateTitleAndArtist(){
	if(!self.loggedIn){
		await LoginDeezer()
	}
	try{
	//await page.waitForSelector('#page_player > div > div.player-track > div > div.track-heading > div.track-title > div > div > div > a:nth-child(1)');
	var title = await self.page.evaluate(()=>document.querySelector('#page_player > div > div.player-track > div > div.track-heading > div.track-title > div > div > div > a:nth-child(1)').textContent);
	//await page.waitForSelector('#page_player > div > div.player-track > div > div.track-heading > div.track-title > div > div > div > a:nth-child(2)');
	var artist = await self.page.evaluate(()=>document.querySelector('#page_player > div > div.player-track > div > div.track-heading > div.track-title > div > div > div > a:nth-child(2)').textContent); //a.track-link:nth-child(2)
	var currentTime = await self.page.evaluate(()=>document.querySelector('#page_player > div > div.player-track > div > div.track-seekbar > div > div.slider-counter.slider-counter-current').textContent);
	var maxTime = await self.page.evaluate(()=>document.querySelector('#page_player > div > div.player-track > div > div.track-seekbar > div > div.slider-counter.slider-counter-max').textContent);
	//self.sendSocketNotification("Title", text);
	//self.sendSocketNotification("Artist", artist);
	if(self.AdsPlaying){
		await getCover();
		self.AdsPlaying = false;
	}
	self.sendSocketNotification("Update", {
		Artist: artist,
		Title: title,
		CurrentTime: currentTime,
		MaxTime: maxTime,
	});
	getCover();
	}catch(error){
		self.sendSocketNotification("Ads", "");
		self.AdsPlaying = true;
		return;
	}

}

async function nextTitle(){
	try{
		if(!self.loggedIn){
			await LoginDeezer()
		}
		await self.page.evaluate(()=>document.querySelector('#page_player div.player-controls button[aria-label="Next"]').click()); // EN-Selector
		if(!self.playingMusic){
			self.playingMusic = true;
			update();
		}
		console.error("next title");
	}catch(error){
		console.error(error);
	}

}

async function previousTitle (){
	try{
		if(!self.loggedIn){
			await LoginDeezer()
		}
		await self.page.evaluate(()=>document.querySelector('#page_player div.player-controls button[aria-label="Back"]').click()); // EN-Selector
		if(!self.playingMusic){
			self.playingMusic = true;
			update();
		}
		console.error("previous title");
	}catch(error){
		console.error(error);
	}

}

async function playFlow (){
	try{
	//	if(!self.playingMusic){
			if(!self.loggedIn){
				await LoginDeezer()
			}
			await self.page.click('#dzr-app a.logo[aria-label="Deezer"]'); // Zur Hauptseite, falls nicht dort
			await self.page.waitForSelector('#page_content > div.channel div[data-testid="flow-config-default"] button');
			await self.page.evaluate(()=>document.querySelector('#page_content > div.channel div[data-testid="flow-config-default"] button[aria-label="Play"]').click()); // EN-Selector; Abspielen
			self.playingMusic = true;
			update();
			console.error("play flow");
	//	}
	}catch(error){
		console.error(error);
	}

}

async function playLoved (){
	try{
		if(!self.loggedIn){
			await LoginDeezer()
		}
		const [response] = await Promise.all([
			self.page.waitForNavigation(), // The promise resolves after navigation has finished
			self.page.click('#page_sidebar a.sidebar-nav-link[href$="loved"]'), // Clicking the link will indirectly cause a navigation
		]);
	//	self.page.click('#page_sidebar a.sidebar-nav-link[href$="loved"]'); // zu Lieblingssongs wechseln
	//	await delay(1000);
		await self.page.waitForSelector('#page_content div.loved-heading div[data-testid="play"]');
		await self.page.evaluate(()=>document.querySelector('#page_content button.chakra-button[data-testid="playlist-play-button"]').click()); // Abspielen
		await self.page.waitForSelector('#page_player button[aria-label$="Shuffle"]');
		if(self.page.querySelector('#page_player button[aria-label$="Shuffle"]').getAttribute('aria-label')=="Turn on Shuffle"){
			await self.page.evaluate(()=>document.querySelector('#page_player button[aria-label="Turn on Shuffle"]').click()); // EN-Selector; Zufallswiedergabe an
			await delay(300);
		}
		if(self.page.querySelector('#page_player button[aria-label*="epeat"]').getAttribute('aria-label')=="Turn off repeat"){
			await self.page.evaluate(()=>document.querySelector('#page_player button[aria-label="Turn off repeat"]').click()); // EN-Selector; Klicken falls Ein-Song-Wiederholung an
			await delay(300);
		}
		if(self.page.querySelector('#page_player button[aria-label*="epeat"]').getAttribute('aria-label')=="Repeat all tracks in list"){
			await self.page.evaluate(()=>document.querySelector('#page_player button[aria-label="Repeat all tracks in list"]').click()); // EN-Selector; Zufallswiedergabe an
		}
		if(!self.playingMusic){
			self.playingMusic = true;
			update();
		}
		console.error("play loved");
	}catch(error){
		console.error(error);
	}

}
