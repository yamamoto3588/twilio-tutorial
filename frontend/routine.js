window.addEventListener("DOMContentLoaded",()=>{
    // constants
    const apiServerURL="http://localhost:8001/";

    // functions
    function removeStartMenu(){
        document.body.removeChild(document.getElementById("start-menu"));
    };

    async function joinRoom(){
        const roomName=document.getElementById("room-name").value;
        const identity=document.getElementById("identity").value;
        if(roomName===""){
            alert("Error: room name is empty");
            return;
        }
        else if(identity===""){
            alert("Error: identity is empty");
            return;
        }
        removeStartMenu();

        // call api for creating token
        const roomInfo=await (await fetch(apiServerURL+"create-room-token/"+roomName+"/"+identity)).json();

        // Twilio constants
        const video=Twilio.Video;
        const room=await video.connect(roomInfo.token,{
            audio: true,
            video: {width: 640}
        });
        console.log("Successfully joned a Room", room);

        // initialize local env
        const localVideoTrack=await video.createLocalVideoTrack();
        document.getElementById("local-video-container").appendChild(localVideoTrack.attach());

        // functions for remote video
        function attachToContainer(identity,track){
            const domId="twilio-identity-"+identity
            let container=document.getElementById(domId);
            console.log(container);
            if(!container){
                container=document.createElement("div");
                container.id=domId;
                document.getElementById("remote-video-container").appendChild(container);
            }
            container.appendChild(track.attach());
        }
        function appendRemoteVideo(participant){
            participant.tracks.forEach(publication=>{
                if(publication.isSubscribed){
                    const track=publication.track;
                    attachToContainer(participant.identity,track);
                }
            });
            participant.on("trackSubscribed",track=>{
                const media=track.attach();
                media.name=participant.identity;
                attachToContainer(participant.identity,track);
            });
        }
        function removeRemoteVideo(participant){
            const container=document.getElementById("twilio-identity-"+participant.identity);
            if(container){
                document.getElementById("remote-video-container").removeChild(container);
            }
        }

        // register remote participant's events
        room.on("participantConnected",participant=>{
            console.log("A remote participant connected: ",participant);
            appendRemoteVideo(participant);
        });
        room.on("participantDisconnected",participant=>{
            console.log("A remote participant disconnected: ",participant);
            removeRemoteVideo(participant);
        })

        // append videos whose already participated.
        room.participants.forEach(participant=>{
            appendRemoteVideo(participant);
        });


        document.getElementById("show-room-name").innerHTML="Room name: "+room.name;
        document.getElementById("show-room-token").innerHTML="Your token: <input type='text' value='"+roomInfo.token+"'>";

    };

    // eventListeners
    document.getElementById("join-button").addEventListener("click",joinRoom);
});