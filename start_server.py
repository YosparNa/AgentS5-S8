import os, uvicorn
os.chdir(r"E:\Agent-L3")
uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=False)
