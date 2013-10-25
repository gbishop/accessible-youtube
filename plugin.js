
var locations = {
	DISPLAY: 'display',
	VIDEO: 'video'
}

var keys = {
	ENTER:13,
	SPACE:32,
	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40
}

// set keyIndex to 0
var keyIndex = 1;

// set last and current elements as null
var last;
var current;

var previewTimout;

var isUserSearching = true;

// set location to search bar
var myLocation = locations.SEARCH;

$(document).ready(function() {

	changeFontSize();

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

	});

});

function confirm() {
	if (myLocation == locations.DISPLAY) {
		if (keyIndex == -1) {}
		else if (keyIndex == 0) searchPrevPage();
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
			default: {};
		}
	}
}

function decrement() {

	if (keyIndex == -1) {
		if (pageIndex > 1) keyIndex = 0;
		else keyIndex = videoIDs.length + 1;
	}
	else keyIndex--;

	if (myLocation == locations.DISPLAY) {
		if (hasMoreVideos) {
			if (keyIndex < 0) keyIndex = videoIDs.length + 1;
			else if (keyIndex < 1) {
				if (pageIndex > 1) keyIndex = 0;
				else keyIndex = videoIDs.length + 1;
			}
		} else {
			if (keyIndex < 0) keyIndex = videoIDs.length
			else if (keyIndex < 1) {
				if (pageIndex > 1) keyIndex = 0;
				else keyIndex = videoIDs.length;
			}
		}
	} else if (myLocation == locations.VIDEO) {
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
				if (pageIndex > 1) keyIndex = 0;
				else keyIndex = 1;
			}
		} else {
			if (keyIndex > videoIDs.length) {
				if (pageIndex > 1) keyIndex = 0;
				else keyIndex = 1;
			}
		}
	} else if (myLocation == locations.VIDEO) {
		if (keyIndex > 3) {
			keyIndex = 0;
		}
	}
}

function showPreview() {

	if (! isUserSearching) {

		$('#preview').fadeIn('fast');

		var title = videoTitles[keyIndex - 1];
		//var description = videoDescriptions[video];

		if (videoIDs[keyIndex - 1] != undefined) {
			document.getElementById('preview').innerHTML = '<h2 title="' + title + '">' + title + '</h2>' +
				'<img src="https://img.youtube.com/vi/' + videoIDs[keyIndex - 1] + '/0.jpg" />'
		}

		clearTimeout(previewTimout);

		// hide preview after 8 seconds
		previewTimout = setTimeout(function() {
			hidePreview();
		}, 8000);
	}

}

function stylize() {

	//clearTimeout(previewTimout);

	if (myLocation == locations.DISPLAY) {

		if (last) last.removeClass('controlSelected');

		if (keyIndex == -1) hidePreview();
		else if (keyIndex == 0) {
			hidePreview();
			current = $('#lastPagePic');
		}
		else if (keyIndex <= videoIDs.length) {
			current = $('#videoPic' + (keyIndex - 1));
			showPreview();
		}
		else {
			hidePreview();
			current = $('#nextPagePic');
		}

		last = current;

		if (current) current.addClass('controlSelected');

	} else if (myLocation == locations.VIDEO) {

		if (last) {
			last.removeClass('controlSelected');
		}

		current = $('#controlButton' + keyIndex);

		last = current;

		// display tooltip
		if (keyIndex == 0) $('#tooltip').html('<h3>Play<br />or<br />Pause</h3>')
		else if (keyIndex == 1) {
			if (isVideoDone()) $('#tooltip').html('<h3>Watch<br />Video<br />Again</h3>');
			else $('#tooltip').html('<h3>Rewind<br />Ten Seconds</h3>');
		}
		else if (keyIndex == 2) {
			if (isSearchingPlaylist) $('#tooltip').html('<h3>Watch<br />Next<br />Video</h3>');
			else $('#tooltip').html('<h3>Watch Related Videos</h3>');
		}
		else if (keyIndex == 3) $('#tooltip').html('<h3>Back<br />to<br />Videos</h3>');

		current.addClass('controlSelected');
	}
}

function stylizeMouseHover() {

	if (myLocation == locations.DISPLAY) {

		if (last) last.removeClass('controlSelected');

		//clearTimeout(previewTimout);

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

		// display tooltip
		if (keyIndex == 0) $('#tooltip').html('<h3>Play<br />or<br />Pause</h3>')
		else if (keyIndex == 1) {
			if (isVideoDone()) $('#tooltip').html('<h3>Watch<br />Video<br />Again</h3>');
			else $('#tooltip').html('<h3>Rewind<br />Ten Seconds</h3>');
		}
		else if (keyIndex == 2) {
			if (isSearchingPlaylist) $('#tooltip').html('<h3>Watch<br />Next<br />Video</h3>');
			else $('#tooltip').html('<h3>Watch Related Videos</h3>');
		}
		else if (keyIndex == 3) $('#tooltip').html('<h3>Back<br />to<br />Videos</h3>');

		current.addClass('controlSelected');

	}
}
