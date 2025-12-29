# backend/main.py
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import uuid

app = FastAPI()

# CORS для dev-режима (если фронтенд на :3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Хранилище участников: client_id -> {name, timestamp, score}
active_round = {
    "participants": {},
    "admin_ws": None,
    "participant_sockets": {},  # client_id -> WebSocket
}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.websocket("/ws/admin")
async def websocket_admin(websocket: WebSocket):
    await websocket.accept()
    active_round["admin_ws"] = websocket
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")

            if action == "clear_round":
                # Сбрасываем ТОЛЬКО timestamp, score НЕ трогаем!
                for p in active_round["participants"].values():
                    p["timestamp"] = None  # участник "выходит" из текущего раунда

                # Уведомляем участников о начале нового раунда
                for ws in list(active_round["participant_sockets"].values()):
                    try:
                        await ws.send_json({"event": "round_reset"})
                    except:
                        pass

                # Обновляем админа: показываем пустой список (ещё никто не нажал)
                if active_round["admin_ws"]:
                    await active_round["admin_ws"].send_json({
                        "event": "update",
                        "participants": []
                    })

            elif action == "award_points":
                client_id = data.get("client_id")
                points = data.get("points", 0)
                if client_id in active_round["participants"]:
                    active_round["participants"][client_id]["score"] += points

                    # Обновляем админа (только тех, кто нажал в этом раунде)
                    if active_round["admin_ws"]:
                        visible_participants = [
                            {"client_id": cid, **p}
                            for cid, p in active_round["participants"].items()
                            if p["timestamp"] is not None
                        ]
                        visible_participants.sort(key=lambda x: x["timestamp"])
                        await active_round["admin_ws"].send_json({
                            "event": "update",
                            "participants": visible_participants
                        })

                    # Обновляем самого участника
                    if client_id in active_round["participant_sockets"]:
                        try:
                            await active_round["participant_sockets"][client_id].send_json({
                                "event": "score_update",
                                "score": active_round["participants"][client_id]["score"]
                            })
                        except:
                            pass

    except WebSocketDisconnect:
        active_round["admin_ws"] = None

# === Участник WebSocket ===
@app.websocket("/ws/participant")
async def websocket_participant(websocket: WebSocket):
    await websocket.accept()
    client_id = None
    try:
        # Получаем имя
        name_data = await websocket.receive_json()
        name = name_data.get("name", "Anonymous")
        client_id = str(uuid.uuid4())

        # Регистрируем участника
        active_round["participants"][client_id] = {
            "name": name,
            "timestamp": None,
            "score": 0
        }
        active_round["participant_sockets"][client_id] = websocket

        # Отправляем текущий счёт (на случай переподключения)
        await websocket.send_json({
            "event": "score_update",
            "score": 0
        })

        while True:
            data = await websocket.receive_json()
            if data.get("action") == "click":
                if active_round["participants"][client_id]["timestamp"] is None:
                    timestamp = datetime.now().timestamp()
                    active_round["participants"][client_id]["timestamp"] = timestamp

                    # Уведомляем админа
                    if active_round["admin_ws"]:
                        visible_participants = [
                            {"client_id": cid, **p}
                            for cid, p in active_round["participants"].items()
                            if p["timestamp"] is not None
                        ]
                        visible_participants.sort(key=lambda x: x["timestamp"])
                        await active_round["admin_ws"].send_json({
                            "event": "update",
                            "participants": visible_participants
                        })

                await websocket.send_json({"event": "registered"})

    except WebSocketDisconnect:
        if client_id:
            active_round["participant_sockets"].pop(client_id, None)
            # Участник остаётся в participants (на случай переподключения), но timestamp = None