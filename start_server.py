"""启动 CreatorOS 集成后端"""
import os
import uvicorn

os.chdir(os.path.dirname(os.path.abspath(__file__)))
uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
