const form = document.getElementById("room-name-form");
const roomNameInput = document.getElementById("room-name-input");
const container = document.getElementById("video-container");

let room;
document.getElementById("toggle-audio-btn").style.display = "none";
document.getElementById("toggle-video-btn").style.display = "none";
document.getElementById("leave-call-btn").style.display = "none";

const startRoom = async (event) => {
  // prevent a page reload when a user submits the form
  event.preventDefault();
  // hide the join form
  form.style.visibility = "hidden";
  // retrieve the room name
  const roomName = roomNameInput.value;

  // fetch an Access Token from the join-room route
  const response = await fetch("/join-room", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ room_name: roomName }),
  });
  const { token } = await response.json();

  // join the video room with the token
  const room = await joinVideoRoom(roomName, token);

  // render the local and remote participants' video and audio tracks
  handleConnectedParticipant(room.localParticipant);
  room.participants.forEach(handleConnectedParticipant);
  room.on("participantConnected", handleConnectedParticipant);
  document.querySelector(".btn-group").style.display = "block";
  document.getElementById("toggle-audio-btn").style.display = "inline-block";
  document.getElementById("toggle-video-btn").style.display = "inline-block";
  document.getElementById("leave-call-btn").style.display = "inline-block";

  // handle cleanup when a participant disconnects
  room.on("participantDisconnected", handleDisconnectedParticipant);
  window.addEventListener("pagehide", () => room.disconnect());
  window.addEventListener("beforeunload", () => room.disconnect());
};

const handleConnectedParticipant = (participant) => {
  // create a div for this participant's tracks
  const participantDiv = document.createElement("div");
  participantDiv.setAttribute("id", participant.identity);
  container.appendChild(participantDiv);

  // iterate through the participant's published tracks and
  // call `handleTrackPublication` on them
  participant.tracks.forEach((trackPublication) => {
    handleTrackPublication(trackPublication, participant);
  });

  // listen for any new track publications
  participant.on("trackPublished", handleTrackPublication);
};

const handleTrackPublication = (trackPublication, participant) => {
  function displayTrack(track) {
    // append this track to the participant's div and render it on the page
    const participantDiv = document.getElementById(participant.identity);
    // track.attach creates an HTMLVideoElement or HTMLAudioElement
    // (depending on the type of track) and adds the video or audio stream
    participantDiv.append(track.attach());
  }

  // check if the trackPublication contains a `track` attribute. If it does,
  // we are subscribed to this track. If not, we are not subscribed.
  if (trackPublication.track) {
    displayTrack(trackPublication.track);
  }

  // listen for any new subscriptions to this track publication
  trackPublication.on("subscribed", displayTrack);
};



const handleDisconnectedParticipant = (participant) => {
  // stop listening for this participant
  participant.removeAllListeners();
  // remove this participant's div from the page
  const participantDiv = document.getElementById(participant.identity);
  participantDiv.remove();
};

const joinVideoRoom = async (roomName, token) => {
  // Join the video room with the Access Token and the given room name
  room = await Twilio.Video.connect(token, { room: roomName });
  return room; 
};



form.addEventListener("submit", startRoom);

const toggleAudio = () => {
  if (room) {
    const audioTracks = Array.from(room.localParticipant.audioTracks.values());
    audioTracks.forEach((trackPublication) => {
      if (trackPublication.track) {
        trackPublication.track.enable(!trackPublication.track.isEnabled);
      }
    });
  } else {
    alert('Room is undefined'); // Alert for undefined room
  }
};

// Adding event listener to the toggle audio button
document.getElementById("toggle-audio-btn").addEventListener("click", toggleAudio);

const toggleVideo = () => {
  if (room) {
    const videoTracks = Array.from(room.localParticipant.videoTracks.values());
    videoTracks.forEach((trackPublication) => {
      if (trackPublication.track) {
        const track = trackPublication.track;
        track.isEnabled ? track.disable() : track.enable();
      }
    });
  } else {
    alert('Room is undefined'); // Alert for undefined room
  }
};

// Adding event listener to the toggle video button
document.getElementById("toggle-video-btn").addEventListener("click", toggleVideo);

const leaveCall = () => {
  if (room) {
    room.disconnect();
    window.location.href = '/'; // Redirect to the root page
  } else {
    alert('Room is undefined'); // Alert for undefined room
  }
};

// Adding event listener to the leave call button
document.getElementById("leave-call-btn").addEventListener("click", leaveCall);

