window.addEventListener("DOMContentLoaded",()=>{
    // constants
    const apiServerURL="http://localhost:8001/";
    const videoWidth=640;
    const videoHeight=480;

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
            video: {width: videoWidth,height: videoHeight}
        });
        console.log("Successfully joned a Room", room);

        // initialize local env
        const localVideoTrack=await video.createLocalVideoTrack();
        const localVideoElm=localVideoTrack.attach();
        document.getElementById("local-video-container").appendChild(localVideoElm);
//        localVideoElm.srcObject=null;

        // functions for remote video
        function attachToContainer(identity,track){
            const domId="twilio-identity-"+identity
            let container=document.getElementById(domId);
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

        // BodyPic
        console.log("Loading model...")
        const net=await bodyPix.load({
            architecture: "ResNet50",
            outputStride: 16,
            quantBytes: 2
        });
        console.log("Complete",net);
        // 画像をマスクする
        function maskCanvas(canvas, img, segmentation) {
            // マスクを作成
            const fgColor = { r: 255, g: 0, b: 0, a: 128 };  // 人物は赤、半透明
            const bgColor = { r: 0, g: 0, b: 0, a: 0 }; // 背景は透明（色は黒だが無関係）
            const colorMask = bodyPix.toMask(segmentation, fgColor, bgColor);

            // マスクを使って描画
            const opacity = 1.0;
            const flipHorizontal = false;
            const maskBlurAmount = 0;
            bodyPix.drawMask(
                canvas, img, colorMask, opacity, maskBlurAmount,
                flipHorizontal);
        }
        

        // MainLoop
        const localCanvasSrc=document.createElement("canvas");
        const localCtxSrc=localCanvasSrc.getContext("2d");
        const localCanvasRes=document.createElement("canvas")
        const localCtxRes=localCanvasRes.getContext("2d");
        document.body.appendChild(localCanvasRes);
        localCanvasSrc.width=videoWidth;
        localCanvasSrc.height=videoHeight;
        localCanvasRes.width=videoWidth;
        localCanvasRes.height=videoHeight;
        let looping=false;
        async function loop(){
            if(!looping){
                looping=true;

                localCtxSrc.drawImage(localVideoElm,0,0);
                const segmentation=await net.segmentPersonParts(localCanvasSrc,{
                    flipHorizontal: false,
                    internalResolution: "low",
                    segmentationThreshold: 0.7
                });

                maskCanvas(localCanvasRes,localCanvasSrc,segmentation);

                looping=false;
            }
            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
    };

    // eventListeners
    document.getElementById("join-button").addEventListener("click",joinRoom);
});