
// kascba yields 1 video
// sadhsad yields 3 videos
// dsmadn yields 13 videos (4 scenarios)

var videoIDs = [];
var videoTitles = [];
var videoDescriptions = [];

var player;
var videoIndex = 0;
var pageIndex = 1;
var nextPageToken;
var prevPageToken;
var currPageToken;
var hasMoreVideos;

var iDeviceMode = false;
var fixedPixelsPortrait;
var fixedPixelsLandscape;

var relatedVideoId;
var playlistId;
var isSearchingRelatedVideos = false;
var isSearchingPlaylist = false;

// constants defining video states
const DONE = 0;
const PLAYING = 1;
const PAUSED = 2;

$(window).resize(function() {
	changeFontSize();
});

function backToVideos() {
	searchCurrPage();
}

// Helper function to display JavaScript value on HTML page.
function build(data, noDisplay) {
	//var str = JSON.stringify(data);
	//$('#search-container').html('<pre>' + str + '</pre>');

	// Clear video arrays
	videoIDs.length = 0;
	videoTitles.length = 0;
	videoDescriptions.length = 0;

	nextPageToken = data.nextPageToken;
	prevPageToken = data.prevPageToken;

	data.items.forEach(function(entry) {
		videoIDs.push(entry.id.videoId);
		videoTitles.push(entry.snippet.title);
		videoDescriptions.push(entry.snippet.description);
	});

	if (noDisplay) {}
	else display();
}

function buildPlaylist(data, noDisplay) {
	//var str = JSON.stringify(data);
	//$('#search-container').html('<pre>' + str + '</pre>');

	// Clear video arrays
	videoIDs.length = 0;
	videoTitles.length = 0;
	videoDescriptions.length = 0;

	nextPageToken = data.nextPageToken;
	prevPageToken = data.prevPageToken;

	data.items.forEach(function(entry) {
		videoIDs.push(entry.snippet.resourceId.videoId);
		videoTitles.push(entry.snippet.title);
		videoDescriptions.push(entry.snippet.description);
	});

	if (noDisplay) {}
	else display();
}

function change(video) {
	keyIndex = 0;
	myLocation = locations.VIDEO;

	document.getElementById("huge").innerHTML='<iframe id="player" style="width:46.88em; height:26.39em;" src="https://www.youtube.com/embed/' +
		video + '?autoplay=1&rel=0" frameborder="0" allowfullscreen></iframe>';
	document.getElementById('playPause').src='pics/pause.png';

	if (isSearchingPlaylist) document.getElementById('control2').innerHTML =
		"<a title='Watch Next Video' href='#' onclick='nextVideo();'" +
			" class='controlButton' id='controlButton2'> <img id='next' class='controlPic' " +
			"src='pics/next.png' /></a>";
	else document.getElementById('control2').innerHTML =
		"<a title='Watch Related Videos' href='#' onclick='searchRelatedVideos();' " +
			"class='controlButton' id='controlButton2'> <img id='related' class='controlPic' " +
			"src='pics/related.png' /></a>";

	hidePreview();

	$('#videos').hide();
	$('#controls').show();

	createPlayer();

}

function changeFontSize() {
	var screenHeight = window.innerHeight;
	var screenWidth = window.innerWidth;
	var pixels;

	if ((navigator.userAgent.indexOf('iPhone') != -1) || (navigator.userAgent.indexOf('iPod') != -1) ||
		(navigator.userAgent.indexOf('iPad') != -1)) {

		iDeviceMode = true;
		if (iDeviceMode) fixedPixelsPortrait = (screenWidth / 65);
		if (iDeviceMode) fixedPixelsLandscape = (screenHeight / 65);
	}

	// portrait mode (iDevice regular orientation)
	if (screenHeight > screenWidth) {

		if (iDeviceMode) pixels = fixedPixelsPortrait;
		else pixels = (screenWidth / 65);

		/*if (screenHeight < (screenWidth / 65) * 65) { // screenWidth < width of page in pixels
			pixels = (screenHeight / 40);
		}*/

	}

	// landscape mode (Laptop, iDevice flipped sideways)
	else if (screenWidth >= screenWidth) {

		if (iDeviceMode) pixels = fixedPixelsLandscape;
		else {
			pixels = (screenHeight / 40);

			if (screenWidth < (screenHeight / 40) * 65) { // screenWidth < width of page in pixels
				pixels = (screenWidth / 65);
			}
		}

	}

	if (iDeviceMode) { // CHECK FOR LANDSCAPE VS PORTRAIT MODE?
		destylize();
	} else {
		document.body.style.fontSize = (pixels + 'px');
		stylizeMouseHover();
	}

}

function checkForPlaylistVideos() {

	var q = $('#query').val();
	q = encodeURIComponent(q); //This encodes the search for the URL

	if (nextPageToken) {
		return $.ajax('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&pageToken=' +
			nextPageToken + '&playlistId=' + playlistID + '&key=AIzaSyBY7FMm-5Bt_LcZygKzAbuu1G1eNjnKQ5I',
			{type: 'GET',
				cache: false,
				timeout:1000,
				success: function (data, status, jqxhr) {
					var numVideos = data.items.length;
					hasMoreVideos = numVideos > 0;
				},
				error: function (data, status, jqxhr) {
					//alert('Unable to reach server! Are you connected to the internet?');
					hasMoreVideos = false;
				}
			});
	} else {
		hasMoreVideos = false;
		return 0;
	}
}

function checkForVideos() {

	if (isSearchingRelatedVideos) {
		if (nextPageToken) {
			return $.ajax('https://www.googleapis.com/youtube/v3/search?part=snippet&pageToken=' +
				nextPageToken + '&relatedToVideoId=' + relatedVideoId +
				'&type=video&key=AIzaSyBY7FMm-5Bt_LcZygKzAbuu1G1eNjnKQ5I',
				{type: 'GET',
					cache: false,
					timeout:1000,
					success: function (data, status, jqxhr) {
						var numVideos = data.items.length;
						hasMoreVideos = numVideos > 0;
					},
					error: function (data, status, jqxhr) {
						//alert('Unable to reach server! Are you connected to the internet?');
						hasMoreVideos = false;
					}
				});
		} else {
			hasMoreVideos = false;
			return 0;
		}
	}

	var q = $('#query').val();
	q = encodeURIComponent(q); //This encodes the search for the URL

	if (nextPageToken) {
		return $.ajax('https://www.googleapis.com/youtube/v3/search?part=snippet&pageToken=' + nextPageToken +
			'&q=' + q + '&type=video&key=AIzaSyBY7FMm-5Bt_LcZygKzAbuu1G1eNjnKQ5I',
			{type: 'GET',
				cache: false,
				timeout:1000,
				success: function (data, status, jqxhr) {
					var numVideos = data.items.length;
					hasMoreVideos = numVideos > 0;
				},
				error: function (data, status, jqxhr) {
					//alert('Unable to reach server! Are you connected to the internet?');
					hasMoreVideos = false;
				}
			});
	} else {
		hasMoreVideos = false;
		return 0;
	}
}

function createPlayer() {
	player = new YT.Player('player', {
		events: {
			'onReady': onPlayerReady,
			'onError': onPlayerError
		}
	});
}

function display() {

	$('#query').blur();
	myLocation = locations.DISPLAY;
	keyIndex = -1;

	$('#huge').hide();
	$('#controls').hide();
	$('#tooltip').hide();
	$('#videos').fadeIn('fast');
	$('#nextPage').fadeTo(0, 0);
	$('#lastPage').fadeTo(0, 0);

	if (player != null) {
		player.stopVideo();
	}

	for (var button=0; button < 4; button++) $('#control' + button).fadeTo(0, 0);

	var element = document.getElementById('videos');
	//element.innerHTML = '';

	if (isSearchingPlaylist) {
		element.innerHTML = "<div id='lastPage' href='#' style='opacity:0' " +
			"onclick='searchPrevPagePlaylist();'><img id='lastPagePic' class='navPic' " +
			"src='pics/back.png' /></div>";
	} else {
		element.innerHTML = "<div id='lastPage' href='#' style='opacity:0' " +
			"onclick='searchPrevPage();'><img id='lastPagePic' class='navPic' " +
			"src='pics/back.png' /></div>";
	}

	for (var video = 0; video < videoIDs.length; video++) {
		var id = videoIDs[video];
		var fullTitle = videoTitles[video];
		//var description = videoDescriptions[video];
		var title = '';

		if (fullTitle.length > 65) title = fullTitle.substring(0, 63) + "...";
		else title = fullTitle;

		element.innerHTML = element.innerHTML +
			"<div style='opacity:0' class='video' id='video" + video + "'><h2 title='" + fullTitle +
			"'>" + title + "</h2>" + "<img class='videoPic' id='videoPic" + video +
			"' onclick='videoIndex=" + video + ";change(\"" + id + "\");' src='https://img.youtube.com/vi/" + id +
			"/0.jpg' /></div>"; // + "<p>" + description + "</p></div>";
	}

	if (isSearchingPlaylist) {
		element.innerHTML = element.innerHTML +
			"<div id='nextPage' href='#' style='opacity:0' onclick='searchNextPagePlaylist();'>" +
			"<img id='nextPagePic' class='navPic' src='pics/next.png' />" +
			"</div>";

		// Sets hasMoreVideos to be true or false
		$.when(checkForPlaylistVideos()).then(function() {
			if (hasMoreVideos) {
				$('#nextPage').fadeTo('slow', 1);
			}

			if (pageIndex > 1) {
				$('#lastPage').fadeTo('slow', 1);
			}
		});
	} else {
		element.innerHTML = element.innerHTML +
			"<div id='nextPage' href='#' style='opacity:0' onclick='searchNextPage();'>" +
			"<img id='nextPagePic' class='navPic' src='pics/next.png' />" +
			"</div>";

		// Sets hasMoreVideos to be true or false
		$.when(checkForVideos()).then(function() {
			if (hasMoreVideos) {
				$('#nextPage').fadeTo('slow', 1);
			}

			if (pageIndex > 1) {
				$('#lastPage').fadeTo('slow', 1);
			}
		});
	}

	if (videoIDs.length == 0) {
		element.innerHTML = '<h1>No results found!</h1>';
	}

	for (var video = 0; video < videoIDs.length; video++) $('#video' + video).fadeTo(200*(video+1), 1);

	setJQuery();

}

function isVideoDone() {
	if (player) return (player.getPlayerState() == DONE);
}

function nextVideo() {

	videoIndex++;
	if (videoIndex < videoIDs.length) {
		var id = videoIDs[videoIndex];
		change(id);
	} else {
		$.when(checkForPlaylistVideos()).then(function() {
			if (hasMoreVideos) {
				$.when(searchNextPagePlaylist(true)).then(function() {
					videoIndex = 0;
					change(videoIDs[videoIndex]);
				})
			} else {
				// alert('none');
			}
		});
	}

}

function onPlayerError() {
	//nextVideo();
}

function onPlayerReady() {

	$('#tooltip').fadeIn('fast');

	$('.controlDiv').each(function(index, button) {
		$(button).fadeTo(200*(index+1), 1)
	});

	$('#huge').show();

	setJQuery();

	if (! iDeviceMode) stylize();
}

function rewindTenSeconds() {
	var current = player.getCurrentTime();
	current -= 10;
	if (current < 0) current = 0;
	player.seekTo(current);
}

function search() {

	isSearchingPlaylist = false;
	isSearchingRelatedVideos = false;
	pageIndex = 1;

	var q = $('#query').val();
	q = encodeURIComponent(q); //This encodes the search for the URL

	// check whether query is a playlist id
	if ( (q.substring(0, 2) == "PL") && (q.length == 18 || q.length == 34) ) {
		playlistID = q;
		searchPlaylist();
	} else {
		return $.ajax('https://www.googleapis.com/youtube/v3/search?part=snippet&q=' + q +
			'&type=video&videoEmbeddable=true&key=AIzaSyBY7FMm-5Bt_LcZygKzAbuu1G1eNjnKQ5I',
			{type: 'GET',
				cache: false,
				success: function (data, status, jqxhr) {
					build(data);
				},
				error: function (data, status, jqxhr) {
					alert('Unable to reach server! Are you connected to the internet?');
				}
			}
		);
	}
}

function searchRelatedVideos() {

	isSearchingRelatedVideos = true;

	relatedVideoUrl= player.getVideoUrl();
	relatedVideoId = relatedVideoUrl.match(/v=.........../g)[0].substring(2);

	pageIndex = 1;
	currPageToken = undefined;

	return $.ajax('https://www.googleapis.com/youtube/v3/search?part=snippet&type=video'+
		'&relatedToVideoId=' + relatedVideoId + '&videoEmbeddable=true&key=AIzaSyBY7FMm-5Bt_LcZygKzAbuu1G1eNjnKQ5I',
		{type: 'GET',
			cache: false,
			success: function (data, status, jqxhr) {
				build(data);
			},
			error: function (data, status, jqxhr) {
				alert('Unable to reach server! Are you connected to the internet?');
			}
		}
	);
}

function searchPlaylist() {

	pageIndex = 1;
	isSearchingPlaylist = true;

	return $.ajax('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet' +
		'&playlistId=' + playlistID + '&key=AIzaSyBY7FMm-5Bt_LcZygKzAbuu1G1eNjnKQ5I',
		{type: 'GET',
			cache: false,
			success: function (data, status, jqxhr) {
				buildPlaylist(data);
			},
			error: function (data, status, jqxhr) {
				alert('Unable to reach server! Are you connected to the internet?');
			}
		}
	);

}

function searchCurrPage() {

	if (isSearchingPlaylist) {
		searchCurrPagePlaylist();
		return;
	}

	if (isSearchingRelatedVideos) {
		if (currPageToken) {
			return $.ajax('https://www.googleapis.com/youtube/v3/search?pageToken=' + currPageToken +
				'&part=snippet&relatedToVideoId=' + relatedVideoId +
				'&type=video&key=AIzaSyBY7FMm-5Bt_LcZygKzAbuu1G1eNjnKQ5I',
				{type: 'GET',
					cache: false,
					success: function (data, status, jqxhr) {
						build(data);

					},
					error: function (data, status, jqxhr) {
						alert('Unable to reach server! Are you connected to the internet?');
					}
				}
			);
		} else {
			return $.ajax('https://www.googleapis.com/youtube/v3/search?part=snippet' +
				'&relatedToVideoId=' + relatedVideoId +
				'&type=video&key=AIzaSyBY7FMm-5Bt_LcZygKzAbuu1G1eNjnKQ5I',
				{type: 'GET',
					cache: false,
					success: function (data, status, jqxhr) {
						build(data);

					},
					error: function (data, status, jqxhr) {
						alert('Unable to reach server! Are you connected to the internet?');
					}
				}
			);
		}

	} else {
		if (currPageToken) {
			var q = $('#query').val();
			q = encodeURIComponent(q); //This encodes the search for the URL

			return $.ajax('https://www.googleapis.com/youtube/v3/search?pageToken=' + currPageToken +
				'&part=snippet&q=' + q + '&type=video&key=AIzaSyBY7FMm-5Bt_LcZygKzAbuu1G1eNjnKQ5I',
				{type: 'GET',
					cache: false,
					success: function (data, status, jqxhr) {
						build(data);

					},
					error: function (data, status, jqxhr) {
						alert('Unable to reach server! Are you connected to the internet?');
					}
				}
			);
		} else {
			var q = $('#query').val();
			q = encodeURIComponent(q); //This encodes the search for the URL

			return $.ajax('https://www.googleapis.com/youtube/v3/search?part=snippet&q='
				+ q + '&type=video&key=AIzaSyBY7FMm-5Bt_LcZygKzAbuu1G1eNjnKQ5I',
				{type: 'GET',
					cache: false,
					success: function (data, status, jqxhr) {
						build(data);

					},
					error: function (data, status, jqxhr) {
						alert('Unable to reach server! Are you connected to the internet?');
					}
				}
			);
		}

	}
}

function searchCurrPagePlaylist() {

	if (currPageToken) {
		return $.ajax('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&pageToken=' +
			currPageToken + '&playlistId=' + playlistID + '&key=AIzaSyBY7FMm-5Bt_LcZygKzAbuu1G1eNjnKQ5I',
			{type: 'GET',
				cache: false,
				success: function (data, status, jqxhr) {
					buildPlaylist(data);
					},
				error: function (data, status, jqxhr) {
					alert('Unable to reach server! Are you connected to the internet?');
				}
			}
		);
	} else {
		return $.ajax('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet' +
			'&playlistId=' + playlistID + '&key=AIzaSyBY7FMm-5Bt_LcZygKzAbuu1G1eNjnKQ5I',
			{type: 'GET',
				cache: false,
				success: function (data, status, jqxhr) {
					buildPlaylist(data);
				},
				error: function (data, status, jqxhr) {
					alert('Unable to reach server! Are you connected to the internet?');
				}
			}
		);
	}
}



function searchNextPage(noDisplay) {

	if (isSearchingPlaylist) {
		searchNextPagePlaylist();
		return;
	}

	if (isSearchingRelatedVideos) {
		return $.ajax('https://www.googleapis.com/youtube/v3/search?pageToken=' + nextPageToken +
			'&part=snippet&relatedToVideoId=' + relatedVideoId +
			'&type=video&key=AIzaSyBY7FMm-5Bt_LcZygKzAbuu1G1eNjnKQ5I',
			{type: 'GET',
				cache: false,
				success: function (data, status, jqxhr) {
					pageIndex++;
					currPageToken = nextPageToken;
					build(data, noDisplay);

				},
				error: function (data, status, jqxhr) {
					//alert('Unable to reach server! Are you connected to the internet?');
				}
			}
		);
	}

	var q = $('#query').val();
	q = encodeURIComponent(q); //This encodes the search for the URL

	return $.ajax('https://www.googleapis.com/youtube/v3/search?pageToken=' + nextPageToken +
		'&part=snippet&q=' + q + '&type=video&key=AIzaSyBY7FMm-5Bt_LcZygKzAbuu1G1eNjnKQ5I',
		{type: 'GET',
			cache: false,
			success: function (data, status, jqxhr) {
				pageIndex++;
				currPageToken = nextPageToken;
				build(data, noDisplay);

			},
			error: function (data, status, jqxhr) {
				//alert('Unable to reach server! Are you connected to the internet?');
			}
		}
	);
}

function searchNextPagePlaylist(noDisplay) {

	return $.ajax('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&pageToken=' +
		nextPageToken + '&playlistId=' + playlistID + '&key=AIzaSyBY7FMm-5Bt_LcZygKzAbuu1G1eNjnKQ5I',
		{type: 'GET',
			cache: false,
			timeout:1000,
			success: function (data, status, jqxhr) {
				pageIndex++;
				currPageToken = nextPageToken;
				buildPlaylist(data, noDisplay);
			},
			error: function (data, status, jqxhr) {
				//alert('Unable to reach server! Are you connected to the internet?');
			}
	});
}

function searchPrevPage() {

	if (isSearchingPlaylist) {
		searchPrevPagePlaylist();
		return;
	}

	if (isSearchingRelatedVideos) {
		return $.ajax('https://www.googleapis.com/youtube/v3/search?pageToken=' + prevPageToken +
			'&part=snippet&relatedToVideoId=' + relatedVideoId +
			'&type=video&key=AIzaSyBY7FMm-5Bt_LcZygKzAbuu1G1eNjnKQ5I',
			{type: 'GET',
				cache: false,
				success: function (data, status, jqxhr) {
					pageIndex--;
					currPageToken = prevPageToken;
					build(data);

				},
				error: function (data, status, jqxhr) {
					//alert('Unable to reach server! Are you connected to the internet?');
				}
			}
		);
	}

	var q = $('#query').val();
	q = encodeURIComponent(q); //This encodes the search for the URL

	return $.ajax('https://www.googleapis.com/youtube/v3/search?pageToken=' + prevPageToken +
		'&part=snippet&q=' + q + '&type=video&key=AIzaSyBY7FMm-5Bt_LcZygKzAbuu1G1eNjnKQ5I',
		{type: 'GET',
			cache: false,
			success: function (data, status, jqxhr) {
				pageIndex--;
				currPageToken = prevPageToken;
				build(data);

			},
			error: function (data, status, jqxhr) {
				//alert('Unable to reach server! Are you connected to the internet?');
			}
		}
	);
}

function searchPrevPagePlaylist() {

	return $.ajax('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&pageToken=' +
		prevPageToken + '&playlistId=' + playlistID + '&key=AIzaSyBY7FMm-5Bt_LcZygKzAbuu1G1eNjnKQ5I',
		{type: 'GET',
			cache: false,
			timeout:1000,
			success: function (data, status, jqxhr) {
				pageIndex--;
				currPageToken = prevPageToken;
				buildPlaylist(data);
			},
			error: function (data, status, jqxhr) {
				//alert('Unable to reach server! Are you connected to the internet?');
			}
		});
}

function setJQuery() {
	// stylizing for mouse over of videos
	$('.videoPic').mouseenter(function() {

		// get index of hovered element, add 1, and assign it to global keyIndex
		var idString = $(this).attr('id');
		keyIndex = 1 + Number(idString.substring(idString.length - 1, idString.length));

		if (! iDeviceMode) {
			$(this).addClass('selected');
			stylizeMouseHover();
		} else {
			destylize();
		}

		$(this).mouseleave(function() {
			$(this).removeClass('selected');
		});
	});

	// stylizing for mouse over of navigation arrows
	$('.navPic').mouseenter(function() {

		// get index of hovered element, add 1, and assign it to global keyIndex
		var idString = $(this).attr('id');
		if (idString == 'lastPagePic' && pageIndex > 1) keyIndex = 0;
		else if (idString == 'lastPagePic') keyIndex = -1;
		else if (idString == 'nextPagePic' && hasMoreVideos) keyIndex = videoIDs.length + 1;

		if (! iDeviceMode) {
			$(this).addClass('selected');
			stylizeMouseHover();
		} else {
			destylize();
		}

		$(this).mouseleave(function() {
			$(this).removeClass('selected');
		});
	});

	// stylizing for mouse over of control buttons
	$('.controlButton').mouseenter(function() {

		$(this).addClass('selected');

		// get index of hovered element, add 1, and assign it to global keyIndex
		var idString = $(this).attr('id');
		keyIndex = Number(idString.substring(idString.length - 1, idString.length));

		if (! iDeviceMode) {
			$(this).addClass('selected');
			stylizeMouseHover();
		} else {
			destylize();
		}

		$(this).mouseleave(function() {
			$(this).removeClass('selected');
		});
	});
}

function startVideoOver() {
	player.seekTo(0);
}

function togglePause() {
	var state = player.getPlayerState();
	if (state == PAUSED) {
		document.getElementById('playPause').src='pics/pause.png';
		player.playVideo();
	} else if (state == PLAYING) {
		document.getElementById('playPause').src='pics/play.png';
		player.pauseVideo();
	}
}
