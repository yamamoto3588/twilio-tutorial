# This is twilio video chat tutorial

## backend
uses fast api.  
### set up  
put your api keys in `twilio-credentials.json` in backend directory like below.(DO NOT PUSH IT TO REMOTE REPOSITORY.)
```
{
    "ACCOUNT_SID": "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "API_KEY_SID": "SKXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "API_KEY_SECRET": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```

run `uvicorn server:app --reload --port 8001` in backend directory.  
uvicorn reference: [https://www.uvicorn.org/](https://www.uvicorn.org/)

## frontend
just provides static html and js files.  
### set up
run `python3 -m http.server` in frontend directory.