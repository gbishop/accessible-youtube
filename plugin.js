
var locations = {
	DISPLAY: 'display',
	VIDEO: 'video',
	SEARCH: 'search'
};

var keys = {
	ENTER:13,
	SPACE:32,
	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40
};

var keyIndex = 1;

var buttonSettings = {'playPause': true, 'rewind': true, 'related': true, 'next': true};

var last;
var current;

var previewTimeout;

var isUserSearching = true;
var isBrowserNavigation = true;

var textToSpeechEnabled = false;
var tempMute = false;

var myLocation = locations.SEARCH;

window.onhashchange = function() {
	if (isBrowserNavigation) {
		load();
	} else {
		isBrowserNavigation = true;
	}
};

function buildHash() {
	var q = encodeURIComponent($('#query').val());

	return '?q=' + q + '&isWatchingVideo=' + isWatchingVideo + '&pageIndices=[' + pageIndices + ']&nextPageTokens=[' +
		nextPageTokens + ']&prevPageTokens=[' + prevPageTokens + ']&currPageTokens=[' + currPageTokens +
		']&hasMoreVideos=' + hasMoreVideos + '&isSearchingRelatedVideos=' + isSearchingRelatedVideos +
		'&relatedVideoIDs=[' + relatedVideoIDs + ']&isSearchingPlaylist=' + isSearchingPlaylist + '&playlistID=' +
		playlistID + '&videoID=' + videoID;
}

function activateSettings() {
	$('#settings').click(function() {
		$('#settingsContainer').slideToggle();
	});

	// Hide text to speech if it is not supported
	if (! 'speechSynthesis' in window) {
		$('#textToSpeechSetting').hide();
	}

	$('#settingsContainer').find('input').click(function() {
		// Handle text to speech toggle
		if (this.id == 'textToSpeechSetting') {
			textToSpeechEnabled = ! textToSpeechEnabled;
			return;
		}

		// Handle video button
		var shouldShow = $(this).is(':checked');
		var buttonID = this.id.split('Setting')[0];

		buttonSettings[buttonID] = shouldShow;

		showButtonsFromSettings();
	});
}

function showButtonsFromSettings() {
	var keys = Object.keys(buttonSettings);

	for (var i = 0; i < keys.length; i++) {
		var buttonID = keys[i];
		var shouldShow = buttonSettings[buttonID];
		var button = $('#' + buttonID).parent();

		console.log(buttonID + ": " + shouldShow);

		if (shouldShow) button.show();
		else button.hide();
	}

	keyIndex = getFirstVisibleControlIndex();

	if (keyIndex == -1) $('#tooltip').hide();
	else $('#tooltip').show();

	stylize();
}

function getFirstVisibleControlIndex() {
	var controls = $('#controls').find('.controlDiv a');
	if (controls.filter(':visible').length == 0) return -1;
	else return controls.index(controls.filter(':visible')[0]);
}

function load() {

	var url = document.URL;

	var isNewPage;
	var hash;

	try {
		// Works if "index.html" is appended
		hash = url.match(/index\.html.*/g)[0].substring(10);
	} catch (error) {
		// Exception, if "index.html" is not appended
		if (! window.location.hash) hash = url.match(/#.*/g)[0].substring(0);
	}

	// Determine if the page loaded is a new page
	if (! hash) { // URL = ./
		isNewPage = true;
	} else if (hash == '#') { // URL = ./index.html#
		isNewPage = true;
	} else isNewPage = hash == '';

	// Evaluate parameters
	var parameters = hash.split(/[\&\?]+/);
	for (var i = 1; i < parameters.length; i++) {
		try {
			eval(parameters[i]);
		} catch (error) { // If parameter is string and string is treated as variable (otherwise undefined)
			var splitParam = parameters[i].split('=');

			// Parameter is an array
			if (splitParam[1][0] == '[') {
				splitParam[1] = splitParam[1].substring(1, splitParam[1].length-1);
				var tempArray = splitParam[1].split(',');

				var tempString = '';

				for (var j=0; j < tempArray.length; j++) {
					if (j == (tempArray.length -1 ) ) {
						tempString = tempString + '"' + tempArray[j] + '"';
					} else {
						tempString = tempString + '"' + tempArray[j] + '",';
					}
				}

				eval(splitParam[0] + '=' + '[' + tempString + ']');
			}

			// Parameter is a regular variable
			else eval(splitParam[0] + '="' + splitParam[1] + '"');
		}
	}

	if (isWatchingVideo) {
		$('#query').val(decodeURIComponent(q));
		change(videoID);

		$('#query').blur();
	} else if(isNewPage) {
		// Decide what to do if a new page is loaded, if applicable
	} else {
		$('#query').val(decodeURIComponent(q));

		$('#query').blur();

		if (isSearchingPlaylist) {
			searchCurrPagePlaylist(true);
		} else {
			searchCurrPage(true);
		}
	}

}

$(document).ready(function() {

	// Make control buttons fade out; hide rest of video controls
	for (var button=0; button < 4; button++) $('#control' + button).fadeTo(0, 0);
	$('#controls').hide();
	$('#tooltip').hide();

	changeFontSize();
	activateSettings();

	// on page load, focus is set to video search box
	$('#query').focus();

	$('#query').click(function() {
		isUserSearching = true;
	});

	$('#query').select(function() {
		isUserSearching = true;
	});

	$('#query').focusout(function() {
		isUserSearching = false;
	});

	// a key is pressed
	$('body').keydown(function(event) {
		var key = event.keyCode;

		if (isUserSearching) {
			if (key == keys.ENTER) {
				search();
			}
			else {}
		}
		else if (key == keys.RIGHT || key == keys.SPACE) increment();
		else if (key == keys.UP) decrement();
		else if (key == keys.LEFT || key == keys.ENTER || key == keys.DOWN) confirm();
		else return;

		if (! iDeviceMode) stylize();
		else destylize();

		// Undo temporary muting of text to speech in confirm() function
		tempMute = false;
	});

});

function confirm() {
	tempMute = true;

	if (myLocation == locations.DISPLAY) {
		if (keyIndex == -1) {}
		else if (keyIndex == 0) {
			if (isSearchingRelatedVideos) seekBackRelatedVideos();
			else searchPrevPage();
		}
		else if (keyIndex > videoIDs.length) searchNextPage();
		else {
			videoIndex = [keyIndex - 1];
			change(videoIDs[videoIndex]);
		}
	} else if (myLocation == locations.VIDEO) {
		switch (keyIndex) {
			case 0: togglePause(); break;
			case 1: {
				if (isVideoDone()) startVideoOver();
				else rewindTenSeconds();
			} break;
			case 2: {
				if (isSearchingPlaylist) nextVideo();
				else searchRelatedVideos();
			} break;
			case 3: backToVideos(); break;
			default: {}
		}
	}
}

function decrement() {
	if (keyIndex == -1) {
		if (pageIndices[relatedVideoIDs.length] > 1) keyIndex = 0;
		else if (isSearchingRelatedVideos) keyIndex = 0;
		else keyIndex = videoIDs.length + 1;
	}
	else keyIndex--;

	if (myLocation == locations.DISPLAY) {
		if (hasMoreVideos) {
			if (keyIndex < 0) keyIndex = videoIDs.length + 1;
			else if (keyIndex < 1) {
				if (pageIndices[relatedVideoIDs.length] > 1) keyIndex = 0;
				else if (isSearchingRelatedVideos) keyIndex = 0;
				else keyIndex = videoIDs.length + 1;
			}
		} else {
			if (keyIndex < 0) keyIndex = videoIDs.length
			else if (keyIndex < 1) {
				if (pageIndices[relatedVideoIDs.length] > 1) keyIndex = 0;
				else if (isSearchingRelatedVideos) keyIndex = 0;
				else keyIndex = videoIDs.length;
			}
		}
	} else if (myLocation == locations.VIDEO) {
		// If no buttons are visible, do nothing
		if ($('#controls').find('.controlDiv a:visible').length == 0) return;

		// Account for buttons that are hidden
		while (isCurrentButtonHidden()) {
			keyIndex--;
			if (keyIndex < 0) {
				keyIndex = 3;
			}
		}

		if (keyIndex < 0) {
			keyIndex = 3;
		}
	}
}

function destylize() {

	hidePreview();

	if (myLocation == locations.DISPLAY) {

		if (last) {
			last.removeClass('selected');
			last.removeClass('controlSelected');
		}

		if (keyIndex == 0) current = $('#lastPagePic');
		else if (keyIndex <= videoIDs.length) current = $('#videoPic' + (keyIndex - 1))
		else current = $('#nextPagePic');

		last = current;

		//current.css('border', '');
		current.removeClass('selected');
		current.removeClass('controlSelected');

	} else if (myLocation == locations.VIDEO) {

		if (last) {
			last.css('border', '');
			last.removeClass('controlSelected');
			last.removeClass('selected');
		}

		current = $('#controlButton' + keyIndex);

		last = current;

		//current.css('border', '');
		current.removeClass('selected');
		current.removeClass('controlSelected');

	}
}

function hidePreview() {
	$('#preview').fadeOut('fast');
}

function increment() {
	if (keyIndex == -1) keyIndex = 1;
	else keyIndex++;

	if (myLocation == locations.DISPLAY) {
		if (hasMoreVideos) {
			if (keyIndex > (videoIDs.length + 1)) {
				if (pageIndices[relatedVideoIDs.length] > 1) keyIndex = 0;
				else if (isSearchingRelatedVideos) keyIndex = 0;
				else keyIndex = 1;
			}
		} else {
			if (keyIndex > videoIDs.length) {
				if (pageIndices[relatedVideoIDs.length] > 1) keyIndex = 0;
				else if (isSearchingRelatedVideos) keyIndex = 0;
				else keyIndex = 1;
			}
		}
	} else if (myLocation == locations.VIDEO) {
		// If no buttons are visible, do nothing
		if ($('#controls').find('.controlDiv a:visible').length == 0) return;

		// Account for buttons that are hidden
		while (isCurrentButtonHidden()) {
			keyIndex++;
			if (keyIndex > 3) {
				keyIndex = 0;
			}
		}

		if (keyIndex > 3) {
			keyIndex = 0;
		}
	}
}

function showPreview() {

	if (! isUserSearching) {

		$('#preview').fadeOut('fast', function() {
			$('#preview').fadeIn('fast');

			var title = videoTitles[keyIndex - 1];
			//var description = videoDescriptions[video];

			if (videoIDs[keyIndex - 1] != undefined) {
				document.getElementById('preview').innerHTML = '<h2 title="' + title + '">' + title +
					'</h2>' + '<img src="https://img.youtube.com/vi/' + videoIDs[keyIndex - 1] +
					'/0.jpg" />'
			}

			speakText(title);

			clearTimeout(previewTimeout);

			// hide preview after 8 seconds
			previewTimeout = setTimeout(function() {
				hidePreview();
			}, 8000);
		});
	}

}

function stylize() {

	//clearTimeout(previewTimeout);

	if (myLocation == locations.DISPLAY) {

		if (last) last.removeClass('controlSelected');

		if (keyIndex == -1) hidePreview();
		else if (keyIndex == 0) {
			hidePreview();
			current = $('#lastPagePic');
			speakText('Last Page');
		} else if (keyIndex <= videoIDs.length) {
			current = $('#videoPic' + (keyIndex - 1));
			showPreview();
		} else {
			hidePreview();
			current = $('#nextPagePic');
			speakText('Next Page');
		}

		last = current;

		if (current) current.addClass('controlSelected');

	} else if (myLocation == locations.VIDEO) {

		if (last) {
			last.removeClass('controlSelected');
		}

		current = $('#controlButton' + keyIndex);

		last = current;

		displayTooltip();

		current.addClass('controlSelected');
	}
}

function stylizeMouseHover() {

	if (myLocation == locations.DISPLAY) {

		if (last) last.removeClass('controlSelected');

		//clearTimeout(previewTimeout);

		if (keyIndex == -1) {}
		else if (keyIndex == 0) {
			current = $('#lastPagePic');
			hidePreview();
		} else if (keyIndex <= videoIDs.length) {
			current = $('#videoPic' + (keyIndex - 1));
			hidePreview();
		} else if (keyIndex > videoIDs.length) {
			current = $('#nextPagePic');
			hidePreview();
		}

		last = current;

		if (current) current.addClass('controlSelected');

	} else if (myLocation == locations.VIDEO) {

		if (last) {
			last.removeClass('controlSelected');
		}

		current = $('#controlButton' + keyIndex);

		last = current;

		displayTooltip();

		current.addClass('controlSelected');
	}
}

function displayTooltip() {
	var text = '';
	// display tooltip
	if (keyIndex == 0) {
		var state = player.getPlayerState();
		if (state == PAUSED) text = 'Play';
		else if (state == DONE) text = 'Play';
		else if (state == PLAYING) text = 'Pause';
	}
	else if (keyIndex == 1) {
		if (isVideoDone()) text = 'Watch Video Again';
		else text = 'Rewind Ten Seconds';
	}
	else if (keyIndex == 2) {
		if (isSearchingPlaylist) text = 'Watch Next Video';
		else text = 'Watch Related Videos';
	}
	else if (keyIndex == 3) text = 'Back to Videos';

	$('#tooltip').html('<p>' + text + '</p>');
	speakText(text);
}

function isCurrentButtonHidden() {
	return ! $($('#controls').find('.controlDiv a')[keyIndex]).is(':visible')
}

function speakText(text) {
	if (! textToSpeechEnabled || tempMute) return;

	stopSpeaking();

	setTimeout(function() {
		var msg = new SpeechSynthesisUtterance(text);
		window.speechSynthesis.speak(msg);
	}, 100);
}

function stopSpeaking() {
	window.speechSynthesis.cancel();
}