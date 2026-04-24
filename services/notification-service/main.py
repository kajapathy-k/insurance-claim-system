from datetime import datetime
from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


class NotificationCreate(BaseModel):
    message: str


class NotificationResponse(NotificationCreate):
    id: int
    created_at: str


app = FastAPI(title="Notification Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

notifications: List[NotificationResponse] = []


@app.get("/health")
def health_check():
    return {"service": "notification-service", "status": "running"}


@app.post("/notifications", response_model=NotificationResponse)
def create_notification(notification: NotificationCreate):
    item = NotificationResponse(
        id=len(notifications) + 1,
        message=notification.message,
        created_at=datetime.utcnow().isoformat(),
    )
    notifications.append(item)
    print(f"[notification] {item.created_at} - {item.message}")
    return item


@app.get("/notifications", response_model=List[NotificationResponse])
def get_notifications():
    return notifications
