from fastapi import FastAPI

app = FastAPI(
    title="Event Management API",
    description="API для дипломной работы",
    version="1.0.0"
)

@app.get("/")
async def root():
    return {"status": "ok", "message": "Сервер успешно запущен"}