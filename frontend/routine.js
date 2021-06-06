window.addEventListener("DOMContentLoaded",()=>{
    "use strict";
    // constants
    const apiServerURL="http://localhost:8001/";
    const videoWidth=640;
    const videoHeight=480;
    const focusWidth=200;
    const focusHeight=200;

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
        // functions for body detection
        function expandRegion(segmentation,typeIds){

        }
        function index2xy(index,segmentation){
            if(index===-1) return {x: -1,y: -1};
            // 0000000000
            // 0000000000
            // 0010000000
            // 0000000000
            return {x:index%segmentation.width,y: Math.floor(index/segmentation.height)};
        }
        function xy2index(x,y,segmentation){
            return x+y*segmentation.width;
        }
        function createFocusRegion(segmentation,typeId,width,height,offsetX,offsetY){
            const srcIndex=segmentation.data.findIndex(pixel=>pixel==typeId);
            const srcPoint=index2xy(srcIndex,segmentation);
            console.log(segmentation);
            const findRegion=srcPoint.x!==-1&&srcPoint.y!==-1;

            const res={
                x: srcPoint.x+offsetX,
                y: srcPoint.y+offsetY,
                width: width,
                height: height,
                findRegion: findRegion
            };

            if(findRegion){
                for(let probeY=res.y;probeY<res.y+height;probeY++){
                    for(let probeX=res.x;probeX<res.x+width;probeX++){
    //                    if(probeX>=width) break;
                        segmentation.data[xy2index(probeX,probeY,segmentation)]=typeId;
                    }
    //                if(probeY>=height) break;
                }    
            }

            return res;
        }
        // 画像をマスクする
        const rainbow = [
            [110, 64, 170], [143, 61, 178], [178, 60, 178], [210, 62, 167],
            [238, 67, 149], [255, 78, 125], [255, 94, 99],  [255, 115, 75],
            [255, 140, 56], [239, 167, 47], [217, 194, 49], [194, 219, 64],
            [175, 240, 91], [135, 245, 87], [96, 247, 96],  [64, 243, 115],
            [40, 234, 141], [28, 219, 169], [26, 199, 194], [33, 176, 213],
            [47, 150, 224], [65, 125, 224], [84, 101, 214], [99, 81, 195]
          ];
        function maskCanvas(canvas, img, segmentation) {
            const bgColor = { r: 0, g: 0, b: 0, a: 0 }; // 背景は透明（色は黒だが無関係）
            const colorMask = bodyPix.toMask(segmentation, rainbow, bgColor);
            const colorPartImage=bodyPix.toColoredPartMask(segmentation,rainbow);
              

            // マスクを使って描画
            const opacity = 0.5;
            const flipHorizontal = false;
            const maskBlurAmount = 0.5;
            bodyPix.drawMask(
                canvas, img, colorPartImage, opacity, maskBlurAmount,
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

                const focusRegionInfo=createFocusRegion(segmentation,10,focusWidth,focusHeight,-200,0);
                maskCanvas(localCanvasRes,localCanvasSrc,segmentation);
                localCtxRes.strokeRect(focusRegionInfo.x,focusRegionInfo.y,focusWidth,focusHeight)

                looping=false;
            }
            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
    };

    // eventListeners
    document.getElementById("join-button").addEventListener("click",joinRoom);
});