# This is twilio video chat tutorial

## backend
uses fast api.  
### set up  
create `backend/twilio-credentials.json` like below and put your api keys.(DO NOT PUSH IT TO REMOTE REPOSITORY.)
you can obtain api keys from [https://jp.twilio.com/try-twilio](https://jp.twilio.com/try-twilio)  
```json:backend/twilio-credentials.json
{
    "ACCOUNT_SID": "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "API_KEY_SID": "SKXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "API_KEY_SECRET": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```

run `python3 -m uvicorn server:app --reload --port 8001` in backend directory.  
uvicorn reference: [https://www.uvicorn.org/](https://www.uvicorn.org/)

## frontend
just provides static html and js files.  
### set up
run `python3 -m http.server` in frontend directory.

### how to use
put room name and identity on `http://localhost:8000`.  
then, push `join room` button.  
identity must be unique in same room.
