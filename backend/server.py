from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VideoGrant
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json

twilio_credentials=json.load(open("twilio-credentials.json"))

# Substitute your Twilio AccountSid and ApiKey details
ACCOUNT_SID = twilio_credentials["ACCOUNT_SID"]
API_KEY_SID = twilio_credentials["API_KEY_SID"]
API_KEY_SECRET = twilio_credentials["API_KEY_SECRET"]

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/create-room-token/{name}/{identity}")
def create_room_token(name: str,identity: str):
    # Create an Access Token
    token = AccessToken(ACCOUNT_SID, API_KEY_SID, API_KEY_SECRET)

    # Set the Identity of this token
    token.identity = identity

    # Grant access to Video
    grant = VideoGrant(room=name)
    token.add_grant(grant)

    # Serialize the token as a JWT
    jwt = token.to_jwt()
    return {"token": jwt}