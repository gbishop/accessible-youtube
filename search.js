// kascba yields 1 video
// sadhsad yields 3 videos
// dsmadn yields 13 videos (4 scenarios)

var videoIDs = [];
var videoTitles = [];
var videoDescriptions = [];

var isWatchingVideo = false;
var videoID;

var player;
var videoIndex = 0;
var pageIndices = [1];
var nextPageTokens = [];
var prevPageTokens = [];
var currPageTokens = [];
var hasMoreVideos;

var iDeviceMode = false;

var relatedVideoIDs = [];
var playlistID;
var isSearchingRelatedVideos = false;
var isSearchingPlaylist = false;

// constants defining video states
const DONE = 0;
const PLAYING = 1;
const PAUSED = 2;

function backToVideos() {
  searchCurrPage();
}

function build(data, noDisplay) {
  // Display JSON for debugging
  //var str = JSON.stringify(data);
  //$('#search-container').html('<pre>' + str + '</pre>');

  // Clear preview and reset keyIndex
  hidePreview();

  // Clear video arrays
  videoIDs.length = 0;
  videoTitles.length = 0;
  videoDescriptions.length = 0;

  // Gather token data
  nextPageTokens[relatedVideoIDs.length] = data.nextPageToken;
  prevPageTokens[relatedVideoIDs.length] = data.prevPageToken;

  // Insert JSON data into video arrays
  data.items.forEach(function (entry) {
    if (isSearchingPlaylist) videoIDs.push(entry.snippet.resourceId.videoId);
    else videoIDs.push(entry.id.videoId);

    videoTitles.push(entry.snippet.title);
    videoDescriptions.push(entry.snippet.description);
  });

  // Choose whether to redisplay videos based on argument
  if (noDisplay) {
  } else display();
}

function change(video) {
  $("#huge").show();

  isWatchingVideo = true;
  videoID = video;

  location.hash = buildHash();

  keyIndex = 0;
  myLocation = locations.VIDEO;

  // Create player object
  document.getElementById("huge").innerHTML =
    '<iframe id="player" style="width:44.41em; ' +
    'height:25em;" src="https://www.youtube.com/embed/' +
    video +
    '?autoplay=1&rel=0&enablejsapi=1" frameborder="0" allowfullscreen allow="autoplay"></iframe>';
  document.getElementById("playPause").src = "pics/pause.png";

  /* Create the third control button on the left for the video player. If
   * the user is searching a playlist, the button will allow the user to
   * go to the next video. Otherwise, the button will allow the user to
   * search related videos.
   */
  if (isSearchingPlaylist)
    document.getElementById("control2").innerHTML =
      "<a onclick='nextVideo();'" +
      " class='controlButton' id='controlButton2'> <img id='next' class='controlPic' " +
      "src='pics/next.png' /></a>";
  else
    document.getElementById("control2").innerHTML =
      "<a onclick='searchRelatedVideos();' " +
      "class='controlButton' id='controlButton2'> <img id='related' class='controlPic' " +
      "src='pics/related.png' /></a>";

  showButtonsFromSettings();

  hidePreview();

  $("#videos").hide();

  if (!iDeviceMode) $("#controls").show();

  createPlayer();
}

function changeFontSize() {
  var screenHeight = window.innerHeight;
  var screenWidth = window.innerWidth;
  var pixels;

  if (
    navigator.userAgent.indexOf("iPhone") != -1 ||
    navigator.userAgent.indexOf("iPod") != -1 ||
    navigator.userAgent.indexOf("iPad") != -1
  ) {
    iDeviceMode = true;
  }

  // Change font size given screen dimensions
  // Portrait mode
  if (screenHeight > screenWidth) {
    pixels = screenWidth / 65;
  }

  // Landscape mode
  else if (screenWidth >= screenHeight) {
    pixels = screenHeight / 40;

    // Special case of resizing for computers
    if (screenWidth < (screenHeight / 40) * 65) {
      pixels = screenWidth / 65;
    }
  }

  // fixes discrepancies between sizing among browsers so all elements fit inside the page without a scrollbar
  pixels /= 1.015;

  document.body.style.fontSize = pixels + "px";

  // Stylize the page only if the user is not on an iDevice
  if (iDeviceMode) destylize();
  else stylizeMouseHover();
}

function checkForVideos() {
  var q = encodeURIComponent($("#query").val());

  // Retrieve JSON object for playlist, related, or regular search to see if more videos are
  // available
  if (isSearchingPlaylist) {
    if (nextPageTokens[relatedVideoIDs.length]) {
      return $.ajax(
        "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet" +
          "&pageToken=" +
          nextPageTokens[relatedVideoIDs.length] +
          "&playlistId=" +
          playlistID +
          "&safeSearch=strict&videoEmbeddable=true" +
          "&key=AIzaSyCE9SP37v8UFetdrODAB_SZQfYe6beNfFc",
        {
          type: "GET",
          cache: false,
          success: function (data, status, jqxhr) {
            var numVideos = data.items.length;
            hasMoreVideos = numVideos > 0;
          },
          error: function (data, status, jqxhr) {
            alert(
              "An unknown error occured! Are you connected to the internet?"
            );
            hasMoreVideos = false;
          },
        }
      );
    } else {
      hasMoreVideos = false;
      return;
    }
  } else if (isSearchingRelatedVideos) {
    if (nextPageTokens[relatedVideoIDs.length]) {
      return $.ajax(
        "https://www.googleapis.com/youtube/v3/search?part=snippet&pageToken=" +
          nextPageTokens[relatedVideoIDs.length] +
          "&relatedToVideoId=" +
          relatedVideoIDs[relatedVideoIDs.length - 1] +
          "&safeSearch=strict&videoEmbeddable=true" +
          "&type=video&key=AIzaSyCE9SP37v8UFetdrODAB_SZQfYe6beNfFc",
        {
          type: "GET",
          cache: false,
          success: function (data, status, jqxhr) {
            var numVideos = data.items.length;
            hasMoreVideos = numVideos > 0;
          },
          error: function (data, status, jqxhr) {
            alert(
              "An unknown error occured! Are you connected to the internet?"
            );
            hasMoreVideos = false;
          },
        }
      );
    } else {
      hasMoreVideos = false;
      return;
    }
  } else if (nextPageTokens[relatedVideoIDs.length]) {
    return $.ajax(
      "https://www.googleapis.com/youtube/v3/search?part=snippet&pageToken=" +
        nextPageTokens[relatedVideoIDs.length] +
        "&q=" +
        q +
        "&safeSearch=strict&videoEmbeddable=true" +
        "&type=video&key=AIzaSyCE9SP37v8UFetdrODAB_SZQfYe6beNfFc",
      {
        type: "GET",
        cache: false,
        success: function (data, status, jqxhr) {
          var numVideos = data.items.length;
          hasMoreVideos = numVideos > 0;
        },
        error: function (data, status, jqxhr) {
          alert("An unknown error occured! Are you connected to the internet?");
          hasMoreVideos = false;
        },
      }
    );
  } else {
    hasMoreVideos = false;
    return;
  }
}

function createPlayer() {
  player = new YT.Player("player", {
    events: {
      onReady: onPlayerReady,
      onError: onPlayerError,
      onStateChange: onPlayerStateChange,
    },
  });
}

function display() {
  isWatchingVideo = false;

  // Change hash if the event is not a Browser Navigation Event
  if (!isBrowserNavigation) location.hash = buildHash();

  myLocation = locations.DISPLAY;
  keyIndex = -1;

  $("#query").blur();
  $("#huge").hide();
  $("#controls").hide();
  $("#tooltip").hide();
  $("#videos").fadeIn("fast");
  $("#nextPage").fadeTo(0, 0);
  $("#lastPage").fadeTo(0, 0);

  // If a valid player is created, stop the video from autoplaying
  if (player != null) {
    player.stopVideo();
  }

  // Make control buttons fade out
  for (var button = 0; button < 4; button++)
    $("#control" + button).fadeTo(0, 0);

  /* Create button that allows user to go back:
   * If the user is searching related videos and the page index is 1, this allows
   * the user to seek back to the previous search. If the user is searching a
   * playlist, this allows the user to search the last page of the playlist.
   * Otherwise, the user is allowed to search the last page.
   */
  var element = document.getElementById("videos");
  if (isSearchingRelatedVideos && pageIndices[relatedVideoIDs.length] == 1) {
    element.innerHTML =
      "<div id='lastPage' style='opacity:0' " +
      "onclick='seekBackRelatedVideos();'><img id='lastPagePic' class='navPic' " +
      "src='pics/back.png' /></div>";
  } else if (isSearchingPlaylist) {
    element.innerHTML =
      "<div id='lastPage' style='opacity:0' " +
      "onclick='searchPrevPagePlaylist();'><img id='lastPagePic' class='navPic' " +
      "src='pics/back.png' /></div>";
  } else {
    element.innerHTML =
      "<div id='lastPage' style='opacity:0' " +
      "onclick='searchPrevPage();'><img id='lastPagePic' class='navPic' " +
      "src='pics/back.png' /></div>";
  }

  for (var video = 0; video < videoIDs.length; video++) {
    var id = videoIDs[video];
    var title = videoTitles[video];
    //For descriptions -> var description = videoDescriptions[video];

    // Create each video div
    element.innerHTML =
      element.innerHTML +
      "<div style='opacity:0' class='video' id='video" +
      video +
      "'><h2 title='" +
      title +
      "'>" +
      title +
      "</h2>" +
      "<img class='videoPic' id='videoPic" +
      video +
      "' onclick='videoIndex=" +
      video +
      ';change("' +
      id +
      "\");' " +
      "src='https://img.youtube.com/vi/" +
      id +
      "/0.jpg' /></div>";
  }

  /* Create button that allows user to go foward:
   * If the user is searching a playlist, this allows the user to search the
   * next page of the playlist. Otherwise, this allows the user to search the
   * next page.
   */
  if (isSearchingPlaylist) {
    element.innerHTML =
      element.innerHTML +
      "<div id='nextPage' style='opacity:0' onclick='searchNextPagePlaylist();'>" +
      "<img id='nextPagePic' class='navPic' src='pics/next.png' />" +
      "</div>";

    // Decide if back and forward buttons should fade in if in a playlist
    $.when(checkForVideos()).then(function () {
      if (hasMoreVideos) {
        $("#nextPage").fadeTo("slow", 1);
      }

      if (pageIndices[relatedVideoIDs.length] > 1) {
        $("#lastPage").fadeTo("slow", 1);
      }
    });
  } else {
    element.innerHTML =
      element.innerHTML +
      "<div id='nextPage' style='opacity:0' onclick='searchNextPage();'>" +
      "<img id='nextPagePic' class='navPic' src='pics/next.png' />" +
      "</div>";

    // Decide if back and forward buttons should fade in regularly
    $.when(checkForVideos()).then(function () {
      if (hasMoreVideos) {
        $("#nextPage").fadeTo("slow", 1);
      }

      if (
        pageIndices[relatedVideoIDs.length] > 1 ||
        (isSearchingRelatedVideos && pageIndices[relatedVideoIDs.length] == 1)
      ) {
        $("#lastPage").fadeTo("slow", 1);
      }
    });
  }

  // No results are found
  if (videoIDs.length == 0) {
    element.innerHTML = "<h1>No results found!</h1>";
  }

  // Fade in each video div
  for (var video = 0; video < videoIDs.length; video++)
    $("#video" + video).fadeTo(200 * (video + 1), 1);

  setJQuery();
}

function isVideoDone() {
  // Player must be valid; otherwise, return false
  if (player && player.getPlayerState) return player.getPlayerState() == DONE;
  else return false;
}

function nextVideo() {
  videoIndex++;

  // Next video is on the same page
  if (videoIndex < videoIDs.length) {
    var id = videoIDs[videoIndex];
    change(id);
  }

  // Next video is on the next page
  else {
    $.when(checkForVideos()).then(function () {
      if (hasMoreVideos) {
        $.when(searchNextPagePlaylist(true)).then(function () {
          videoIndex = 0;
          change(videoIDs[videoIndex]);
        });
      } else {
        alert("There are no more videos in this playlist!");
      }
    });
  }
}

function onPlayerError() {
  // Decide what to do on error, if applicable
}

function onPlayerReady() {
  // Display all necessary elements
  $("#tooltip").fadeIn("fast");
  $(".controlDiv").each(function (index, button) {
    $(button).fadeTo(200 * (index + 1), 1);
  });
  $("#huge").show();

  keyIndex = getFirstVisibleControlIndex();

  if (keyIndex == -1) $("#tooltip").hide();
  else $("#tooltip").show();

  setJQuery();

  // If the user is not on an iDevice, stylize the page
  if (!iDeviceMode) stylize();
}

function onPlayerStateChange() {
  // Get state of player
  var state = player.getPlayerState();

  // Change onclick method of 'rewind' element
  document.getElementById("rewind").onclick = startVideoOver;

  // Change control's picture upon toggle
  if (state == PAUSED) {
    document.getElementById("playPause").src = "pics/play.png";
    if (keyIndex == 0) $("#tooltip").html("<p>Play</p>");
  } else if (state == PLAYING && keyIndex == 1) {
    $("#tooltip").html("<p>Rewind Ten Seconds</p>");
    document.getElementById("playPause").src = "pics/pause.png";
  } else if (state == PLAYING) {
    document.getElementById("playPause").src = "pics/pause.png";
    if (keyIndex == 0) $("#tooltip").html("<p>Pause</p>");
  } else if (state == DONE && keyIndex == 1) {
    $("#tooltip").html("<p>Watch Video Again</p>");
  }
}

function rewindTenSeconds() {
  var current = player.getCurrentTime();
  current -= 10;
  if (current < 0) current = 0;
  player.seekTo(current);
}

function search() {
  // Reset all necessary values
  isSearchingPlaylist = false;
  isSearchingRelatedVideos = false;
  pageIndices[0] = 1;
  relatedVideoIDs.length = 0;
  isBrowserNavigation = false;

  // Get search query
  var q = $("#query").val();

  // Check if query is playlist given URL
  var playlistMatchArray = q.match(/list=.*/g);
  if (playlistMatchArray) {
    // if is not null (has elements)
    playlistID = playlistMatchArray[0].substring(5);
    searchPlaylist();
    return;
  }

  // Check if query is playlist given ID
  else if (q.substring(0, 2) == "PL" && (q.length == 18 || q.length == 34)) {
    playlistID = q;
    searchPlaylist();
  } else {
    // Encode search query
    q = encodeURIComponent(q);

    // Execute search
    return $.ajax(
      "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" +
        q +
        "&type=video&safeSearch=strict&videoEmbeddable=true&key=AIzaSyCE9SP37v8UFetdrODAB_SZQfYe6beNfFc",
      {
        type: "GET",
        cache: false,
        success: function (data, status, jqxhr) {
          build(data);
        },
        error: function (data, status, jqxhr) {
          alert("An unknown error occured! Are you connected to the internet?");
        },
      }
    );
  }
}

function searchRelatedVideos() {
  // Find the ID of the related video
  relatedVideoIDs.push(
    player
      .getVideoUrl()
      .match(/v=.........../g)[0]
      .substring(2)
  );

  isBrowserNavigation = false;
  isSearchingRelatedVideos = true;
  pageIndices[relatedVideoIDs.length] = 1;
  currPageTokens[relatedVideoIDs.length] = undefined;

  // Execute search
  return $.ajax(
    "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video" +
      "&relatedToVideoId=" +
      relatedVideoIDs[relatedVideoIDs.length - 1] +
      "&safeSearch=strict&videoEmbeddable=true&key=AIzaSyCE9SP37v8UFetdrODAB_SZQfYe6beNfFc",
    {
      type: "GET",
      cache: false,
      success: function (data, status, jqxhr) {
        build(data);
      },
      error: function (data, status, jqxhr) {
        alert("An unknown error occured! Are you connected to the internet?");
      },
    }
  );
}

function searchPlaylist() {
  isBrowserNavigation = false;
  pageIndices[relatedVideoIDs.length] = 1;
  isSearchingPlaylist = true;

  // Execute search
  return $.ajax(
    "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet" +
      "&playlistId=" +
      playlistID +
      "&safeSearch=strict&videoEmbeddable=true&key=AIzaSyCE9SP37v8UFetdrODAB_SZQfYe6beNfFc",
    {
      type: "GET",
      cache: false,
      success: function (data, status, jqxhr) {
        build(data);
      },
      error: function (data, status, jqxhr) {
        alert("An unknown error occured! Are you connected to the internet?");
      },
    }
  );
}

function searchCurrPage(isLoadEvent) {
  /* isLoadEvent is a boolean value indicating whether this function is being called
   * inside the 'load' function, which is only called upon the page's first loading.
   */
  if (isLoadEvent) {
    isBrowserNavigation = true;
  } else {
    isBrowserNavigation = false;
  }

  if (isSearchingPlaylist) {
    searchCurrPagePlaylist();
    return;
  }

  // Execute search
  if (isSearchingRelatedVideos) {
    // If a current page token is defined
    if (currPageTokens[relatedVideoIDs.length]) {
      return $.ajax(
        "https://www.googleapis.com/youtube/v3/search?pageToken=" +
          currPageTokens[relatedVideoIDs.length] +
          "&part=snippet&relatedToVideoId=" +
          relatedVideoIDs[relatedVideoIDs.length - 1] +
          "&safeSearch=strict&videoEmbeddable=true" +
          "&type=video&key=AIzaSyCE9SP37v8UFetdrODAB_SZQfYe6beNfFc",
        {
          type: "GET",
          cache: false,
          success: function (data, status, jqxhr) {
            build(data);
          },
          error: function (data, status, jqxhr) {
            alert(
              "An unknown error occured! Are you connected to the internet?"
            );
          },
        }
      );
    } else {
      return $.ajax(
        "https://www.googleapis.com/youtube/v3/search?part=snippet" +
          "&relatedToVideoId=" +
          relatedVideoIDs[relatedVideoIDs.length - 1] +
          "&safeSearch=strict&videoEmbeddable=true&type=video&key=AIzaSyCE9SP37v8UFetdrODAB_SZQfYe6beNfFc",
        {
          type: "GET",
          cache: false,
          success: function (data, status, jqxhr) {
            build(data);
          },
          error: function (data, status, jqxhr) {
            alert(
              "An unknown error occured! Are you connected to the internet?"
            );
          },
        }
      );
    }
  } else {
    var q = encodeURIComponent($("#query").val());

    // If a current page token is defined
    if (currPageTokens[relatedVideoIDs.length]) {
      return $.ajax(
        "https://www.googleapis.com/youtube/v3/search?pageToken=" +
          currPageTokens[relatedVideoIDs.length] +
          "&part=snippet&q=" +
          q +
          "&safeSearch=strict&videoEmbeddable=true&type=video&key=AIzaSyCE9SP37v8UFetdrODAB_SZQfYe6beNfFc",
        {
          type: "GET",
          cache: false,
          success: function (data, status, jqxhr) {
            build(data);
          },
          error: function (data, status, jqxhr) {
            alert(
              "An unknown error occured! Are you connected to the internet?"
            );
          },
        }
      );
    } else {
      return $.ajax(
        "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" +
          q +
          "&safeSearch=strict&videoEmbeddable=true&type=video&key=AIzaSyCE9SP37v8UFetdrODAB_SZQfYe6beNfFc",
        {
          type: "GET",
          cache: false,
          success: function (data, status, jqxhr) {
            build(data);
          },
          error: function (data, status, jqxhr) {
            alert(
              "An unknown error occured! Are you connected to the internet?"
            );
          },
        }
      );
    }
  }
}

function searchCurrPagePlaylist(isLoadEvent) {
  /* isLoadEvent is a boolean value indicating whether this function is being called
   * inside the 'load' function, which is only called upon the page's first loading.
   */
  if (isLoadEvent) {
    isBrowserNavigation = true;
  } else {
    isBrowserNavigation = false;
  }

  // Execute search
  if (currPageTokens[relatedVideoIDs.length]) {
    return $.ajax(
      "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&pageToken=" +
        currPageTokens[relatedVideoIDs.length] +
        "&playlistId=" +
        playlistID +
        "&safeSearch=strict&videoEmbeddable=true" +
        "&key=AIzaSyCE9SP37v8UFetdrODAB_SZQfYe6beNfFc",
      {
        type: "GET",
        cache: false,
        success: function (data, status, jqxhr) {
          build(data);
        },
        error: function (data, status, jqxhr) {
          alert("An unknown error occured! Are you connected to the internet?");
        },
      }
    );
  } else {
    return $.ajax(
      "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet" +
        "&safeSearch=strict&videoEmbeddable=true" +
        "&playlistId=" +
        playlistID +
        "&key=AIzaSyCE9SP37v8UFetdrODAB_SZQfYe6beNfFc",
      {
        type: "GET",
        cache: false,
        success: function (data, status, jqxhr) {
          build(data);
        },
        error: function (data, status, jqxhr) {
          alert("An unknown error occured! Are you connected to the internet?");
        },
      }
    );
  }
}

function searchNextPage(noDisplay) {
  isBrowserNavigation = false;

  if (isSearchingPlaylist) {
    searchNextPagePlaylist();
    return;
  }

  // Execute search
  if (isSearchingRelatedVideos) {
    return $.ajax(
      "https://www.googleapis.com/youtube/v3/search?pageToken=" +
        nextPageTokens[relatedVideoIDs.length] +
        "&part=snippet&relatedToVideoId=" +
        relatedVideoIDs[relatedVideoIDs.length - 1] +
        "&safeSearch=strict&videoEmbeddable=true" +
        "&type=video&key=AIzaSyCE9SP37v8UFetdrODAB_SZQfYe6beNfFc",
      {
        type: "GET",
        cache: false,
        success: function (data, status, jqxhr) {
          pageIndices[relatedVideoIDs.length]++;
          currPageTokens[relatedVideoIDs.length] =
            nextPageTokens[relatedVideoIDs.length];
          build(data, noDisplay);
        },
        error: function (data, status, jqxhr) {
          // No error message is displayed since a user may click on an invisible button
        },
      }
    );
  } else {
    var q = encodeURIComponent($("#query").val());

    // Execute search
    return $.ajax(
      "https://www.googleapis.com/youtube/v3/search?pageToken=" +
        nextPageTokens[relatedVideoIDs.length] +
        "&part=snippet&q=" +
        q +
        "&safeSearch=strict&videoEmbeddable=true" +
        "&type=video&key=AIzaSyCE9SP37v8UFetdrODAB_SZQfYe6beNfFc",
      {
        type: "GET",
        cache: false,
        success: function (data, status, jqxhr) {
          pageIndices[relatedVideoIDs.length]++;
          currPageTokens[relatedVideoIDs.length] =
            nextPageTokens[relatedVideoIDs.length];
          build(data, noDisplay);
        },
        error: function (data, status, jqxhr) {
          // No error message is displayed since a user may click on an invisible button
        },
      }
    );
  }
}

function searchNextPagePlaylist(noDisplay) {
  isBrowserNavigation = false;

  // Execute search
  return $.ajax(
    "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&pageToken=" +
      nextPageTokens[relatedVideoIDs.length] +
      "&playlistId=" +
      playlistID +
      "&safeSearch=strict&videoEmbeddable=true" +
      "&key=AIzaSyCE9SP37v8UFetdrODAB_SZQfYe6beNfFc",
    {
      type: "GET",
      cache: false,
      success: function (data, status, jqxhr) {
        pageIndices[relatedVideoIDs.length]++;
        currPageTokens[relatedVideoIDs.length] =
          nextPageTokens[relatedVideoIDs.length];
        build(data, noDisplay);
      },
      error: function (data, status, jqxhr) {
        // No error message is displayed since a user may click on an invisible button
      },
    }
  );
}

function searchPrevPage() {
  isBrowserNavigation = false;

  if (isSearchingPlaylist) {
    searchPrevPagePlaylist();
    return;
  }

  // Execute search
  if (isSearchingRelatedVideos) {
    return $.ajax(
      "https://www.googleapis.com/youtube/v3/search?pageToken=" +
        prevPageTokens[relatedVideoIDs.length] +
        "&part=snippet&relatedToVideoId=" +
        relatedVideoIDs[relatedVideoIDs.length - 1] +
        "&safeSearch=strict&videoEmbeddable=true" +
        "&type=video&key=AIzaSyCE9SP37v8UFetdrODAB_SZQfYe6beNfFc",
      {
        type: "GET",
        cache: false,
        success: function (data, status, jqxhr) {
          pageIndices[relatedVideoIDs.length]--;
          currPageTokens[relatedVideoIDs.length] =
            prevPageTokens[relatedVideoIDs.length];
          build(data);
        },
        error: function (data, status, jqxhr) {
          // No error message is displayed since a user may click on an invisible button
        },
      }
    );
  } else {
    var q = encodeURIComponent($("#query").val());

    return $.ajax(
      "https://www.googleapis.com/youtube/v3/search?pageToken=" +
        prevPageTokens[relatedVideoIDs.length] +
        "&part=snippet&q=" +
        q +
        "&safeSearch=strict&videoEmbeddable=true" +
        "&type=video&key=AIzaSyCE9SP37v8UFetdrODAB_SZQfYe6beNfFc",
      {
        type: "GET",
        cache: false,
        success: function (data, status, jqxhr) {
          pageIndices[relatedVideoIDs.length]--;
          currPageTokens[relatedVideoIDs.length] =
            prevPageTokens[relatedVideoIDs.length];
          build(data);
        },
        error: function (data, status, jqxhr) {
          // No error message is displayed since a user may click on an invisible button
        },
      }
    );
  }
}

function searchPrevPagePlaylist() {
  isBrowserNavigation = false;

  // Execute search
  return $.ajax(
    "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&pageToken=" +
      prevPageTokens[relatedVideoIDs.length] +
      "&playlistId=" +
      playlistID +
      "&safeSearch=strict&videoEmbeddable=true" +
      "&key=AIzaSyCE9SP37v8UFetdrODAB_SZQfYe6beNfFc",
    {
      type: "GET",
      cache: false,
      success: function (data, status, jqxhr) {
        pageIndices[relatedVideoIDs.length]--;
        currPageTokens[relatedVideoIDs.length] =
          prevPageTokens[relatedVideoIDs.length];
        build(data);
      },
      error: function (data, status, jqxhr) {
        // No error message is displayed since a user may click on an invisible button
      },
    }
  );
}

function seekBackRelatedVideos() {
  isBrowserNavigation = false;

  // Remove the last related video ID
  relatedVideoIDs.pop();

  // If there are no more related videos, set isSearchingRelatedVideos to false
  if (relatedVideoIDs.length == 0) {
    isSearchingRelatedVideos = false;
    searchCurrPage();
  } else {
    searchCurrPage();
  }
}

function setJQuery() {
  // Stylize mouseover of video pictures
  $(".videoPic").mouseenter(function () {
    // Find keyIndex of video picture
    var idString = $(this).attr("id");
    keyIndex =
      1 + Number(idString.substring(idString.length - 1, idString.length));

    if (!iDeviceMode) {
      $(this).addClass("selected");
      stylizeMouseHover();
    } else {
      destylize();
    }

    $(this).mouseleave(function () {
      $(this).removeClass("selected");
    });
  });

  // Stylize mouseover of navigation arrows
  $(".navPic").mouseenter(function () {
    // Find keyIndex of video picture
    var idString = $(this).attr("id");
    if (idString == "lastPagePic" && pageIndices[relatedVideoIDs.length] > 1)
      keyIndex = 0;
    else if (idString == "lastPagePic") keyIndex = -1;
    else if (idString == "nextPagePic" && hasMoreVideos)
      keyIndex = videoIDs.length + 1;

    if (!iDeviceMode) {
      $(this).addClass("selected");
      stylizeMouseHover();
    } else {
      destylize();
    }

    $(this).mouseleave(function () {
      $(this).removeClass("selected");
    });
  });

  // Stylize mouseover of control buttons
  $(".controlButton").mouseenter(function () {
    $(this).addClass("selected");

    // Find keyIndex of video picture
    var idString = $(this).attr("id");
    keyIndex = Number(idString.substring(idString.length - 1, idString.length));

    if (!iDeviceMode) {
      $(this).addClass("selected");
      stylizeMouseHover();
    } else {
      destylize();
    }

    $(this).mouseleave(function () {
      $(this).removeClass("selected");
    });
  });
}

function startVideoOver() {
  player.seekTo(0);
}

function togglePause() {
  // Get state of player
  var state = player.getPlayerState();

  // Change control's picture upon toggle
  if (state == PAUSED) {
    player.playVideo();
  } else if (state == PLAYING) {
    player.pauseVideo();
  } else if (state == DONE) {
    player.playVideo();
  }
}
