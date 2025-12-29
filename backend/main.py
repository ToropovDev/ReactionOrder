# backend/main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Логика раунда ===
active_round = {
    "participants": {},
    "admin_ws": None,
    "participant_sockets": {},
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
            if data.get("action") == "clear_round":
                active_round["participants"] = {}
                to_remove = []
                for cid, ws in active_round["participant_sockets"].items():
                    try:
                        await ws.send_json({"event": "round_reset"})
                    except:
                        to_remove.append(cid)
                for cid in to_remove:
                    active_round["participant_sockets"].pop(cid, None)
                if active_round["admin_ws"]:
                    await active_round["admin_ws"].send_json({
                        "event": "update",
                        "participants": []
                    })
    except WebSocketDisconnect:
        active_round["admin_ws"] = None

@app.websocket("/ws/participant")
async def websocket_participant(websocket: WebSocket):
    await websocket.accept()
    try:
        name_data = await websocket.receive_json()
        name = name_data.get("name", "Anonymous")
        client_id = str(uuid.uuid4())
        active_round["participant_sockets"][client_id] = websocket

        while True:
            data = await websocket.receive_json()
            if data.get("action") == "click":
                timestamp = datetime.now().timestamp()
                active_round["participants"][client_id] = {"name": name, "timestamp": timestamp}
                if active_round["admin_ws"]:
                    sorted_participants = sorted(
                        active_round["participants"].values(),
                        key=lambda x: x["timestamp"]
                    )
                    await active_round["admin_ws"].send_json({
                        "event": "update",
                        "participants": sorted_participants
                    })
                await websocket.send_json({"event": "registered"})
    except WebSocketDisconnect:
        active_round["participant_sockets"].pop(client_id, None)
        active_round["participants"].pop(client_id, None)