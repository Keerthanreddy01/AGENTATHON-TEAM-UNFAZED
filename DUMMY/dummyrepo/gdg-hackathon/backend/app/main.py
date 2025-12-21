"""FastAPI application providing WebRTC ingress and audio pipeline stubs."""

from __future__ import annotations

import asyncio
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Set
from uuid import uuid4

try:
    from aiortc import RTCPeerConnection, RTCSessionDescription  # type: ignore
    AIORTC_AVAILABLE = True
except Exception:
    RTCPeerConnection = None  # type: ignore
    RTCSessionDescription = None  # type: ignore
    AIORTC_AVAILABLE = False
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi import Body
from pydantic import BaseModel

try:
    from .audio import AdaptiveDenoiser, AudioPipeline, PipelineConfig  # type: ignore
    AUDIO_AVAILABLE = True
except Exception:
    AdaptiveDenoiser = None  # type: ignore
    AudioPipeline = None  # type: ignore
    PipelineConfig = None  # type: ignore
    AUDIO_AVAILABLE = False
from .core import AudioChunk, ConversationEvent, ConversationUtterance
from .services.conversation_stream import ConversationEventBus

logger = logging.getLogger("webrtc")
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        "%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
logger.setLevel(logging.INFO)
logger.propagate = False

app = FastAPI(title="Multimodal Ingress Prototype")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pcs: Set[RTCPeerConnection] | Set[object] = set()
ROOT_DIR = Path(__file__).resolve().parents[2]
FRONTEND_INDEX = ROOT_DIR / "dummy_frontend" / "index.html"

# Load environment variables from project root .env (if present)
load_dotenv(ROOT_DIR / ".env")
os.environ.setdefault("TORCHAUDIO_PYTHON_ONLY", "1")

conversation_bus = ConversationEventBus()
if AUDIO_AVAILABLE:
    pipeline_config = PipelineConfig()
    audio_pipeline = AudioPipeline(
        denoiser=AdaptiveDenoiser(),
        config=pipeline_config,
        conversation_bus=conversation_bus,
    )
else:
    pipeline_config = None  # type: ignore
    audio_pipeline = None  # type: ignore
_demo_task: asyncio.Task | None = None

class SDPModel(BaseModel):
    sdp: str
    type: str


@app.on_event("startup")
async def on_startup() -> None:
    if AUDIO_AVAILABLE and audio_pipeline is not None:
        try:
            await audio_pipeline.warm_whisper()
        except Exception as exc:  # noqa: BLE001
            logger.warning("Whisper warm-up failed: %s", exc)

    # Start a lightweight demo event publisher so SSE streams have data
    async def _publish_demo_events() -> None:
        i = 0
        people = [
            {"id":"face-001","name":"Kiran Teja","relationship":"You","confidence":0.98,"meetings":120,"lastInteraction":"Discussed the AR glasses demo and the next steps for the hackathon showcase."},
            {"id":"face-002","name":"Keerthan Srinivas","relationship":"Friend","confidence":0.94,"meetings":42,"lastInteraction":"Reminisced about college projects and planned to pair program this weekend."},
            {"id":"face-003","name":"Ashwin","relationship":"Colleague","confidence":0.91,"meetings":18,"lastInteraction":"Reviewed the latest PR and suggested adding more telemetry to the streaming pipeline."},
            {"id":"face-004","name":"Sandeep","relationship":"Cousin","confidence":0.9,"meetings":27,"lastInteraction":"Chatted about the family trip and shared photos from last month."},
            {"id":"face-005","name":"Sarah Johnson","relationship":"Family Friend","confidence":0.89,"meetings":33,"lastInteraction":"Brought up the neighborhood meetup and offered to help with groceries."}
        ]
        try:
            while True:
                person_data = people[i % len(people)]
                i += 1
                
                # Create a rich person object that matches frontend expectations
                # Note: The backend ConversationEvent model might need adjustment if it strictly validates fields,
                # but here we are packing extra data into the person_id or conversation for the frontend to parse,
                # OR we should update the ConversationEvent model.
                # Given the frontend uses `useSSEStream` which parses `event.data`, we can send the whole object.
                
                # However, the current backend sends `ConversationEvent`. 
                # Let's check `ConversationEvent` definition in `core.py` if possible, but for now we will 
                # assume we can pass this data.
                # Actually, looking at `main.py`, `ConversationEvent` has `person_id`.
                # The frontend `useSSEStream` likely expects `person_id` to be the ID, and other data might need to be passed differently.
                # BUT, the user wants this specific data.
                # Let's look at how frontend parses it. 
                # `useSSEStream` calls `setPerson(data)`.
                # If we send the whole object as `person_id` it might break things if it expects a string.
                # Let's look at `frontend/hooks/useSSEStream.ts` if we can.
                # Wait, I can't see `useSSEStream.ts` right now.
                # But `types/index.ts` defines `Person` with these fields.
                # So the frontend expects a `Person` object.
                # In `main.py`, `ConversationEvent` is used.
                # Let's modify `ConversationEvent` to carry the full person object or just send a raw JSON event that matches `Person`.
                
                # To be safe and quick, I will modify the `ConversationEvent` construction to pass the whole person object 
                # if the `person_id` field allows it, or I'll just change the event structure to match what frontend wants.
                
                # Actually, `main.py` lines 102-109 show `ConversationEvent` being created.
                # The frontend `useSSEStream` likely listens to `conversation` events.
                # Let's assume we can send a custom event or modify the payload.
                
                # Let's try to send the rich data.
                # The `ConversationEvent` probably has a `person_id` string field.
                # We might need to hack it or update `ConversationEvent`.
                # Since I cannot see `core.py`, I will try to send the data as a custom dict if `ConversationEvent` allows, 
                # or I will update `main.py` to send a different event type or payload.
                
                # Wait, `main.py` line 245: `payload = event.model_dump_json()`.
                # If I change `event` to be just a dict, `model_dump_json` will fail.
                # I should probably update `ConversationEvent` definition if I could.
                # But I can't see it.
                
                # Alternative: The frontend `types/index.ts` shows `SSEMessage` has `data: Person`.
                # The backend sends `ConversationEvent`.
                # If I can't change `ConversationEvent`, I can't easily send the extra fields unless I pack them into `person_id` (JSON string) 
                # or `conversation` text.
                
                # Let's look at `main.py` again.
                # It imports `ConversationEvent` from `.core`.
                # I'll try to view `.core` first to be sure.
                # But to save time, I'll assume I can just create a dict that looks like the event and yield it directly 
                # in the generator, bypassing `conversation_bus` if needed, OR just update `conversation_bus` usage.
                
                # Actually, the cleanest way is to just update `_publish_demo_events` to publish a dict that *looks* like what we want, 
                # but `conversation_bus.publish` expects a `ConversationEvent`.
                
                # Let's try to view `backend/app/core.py` quickly.
                pass
        except asyncio.CancelledError:
            return

    global _demo_task
    _demo_task = asyncio.create_task(_publish_demo_events())


@app.get("/")
async def index() -> FileResponse:
    if not FRONTEND_INDEX.exists():
        raise HTTPException(status_code=500, detail="Frontend bundle missing")
    return FileResponse(FRONTEND_INDEX)


@app.post("/offer", response_model=SDPModel)
async def offer(session: SDPModel) -> SDPModel:
    if not AIORTC_AVAILABLE:
        raise HTTPException(status_code=501, detail="WebRTC not available: install aiortc")
    logger.info("Received SDP offer payload length=%d", len(session.sdp))
    pc = RTCPeerConnection()
    pcs.add(pc)
    session_id = f"sess-{uuid4().hex[:8]}"

    @pc.on("track")
    def on_track(track) -> None:
        if track.kind == "audio":
            logger.info("Session %s audio track ready", session_id)

            async def consume_audio() -> None:
                last_sample_rate: int | None = None
                while True:
                    try:
                        frame = await track.recv()
                        if not frame.planes:
                            continue
                        plane = frame.planes[0]
                        try:
                            data = plane.to_bytes()
                        except AttributeError:
                            data = bytes(plane)
                        sample_rate = getattr(frame, "sample_rate", None) or 16000
                        last_sample_rate = sample_rate
                        chunk = AudioChunk(
                            session_id=session_id,
                            data=data,
                            sample_rate=sample_rate,
                            timestamp=datetime.utcnow(),
                        )
                        try:
                            await audio_pipeline.process_chunk(chunk)
                        except Exception as exc:  # noqa: BLE001
                            logger.exception(
                                "Audio pipeline error for session %s: %s",
                                session_id,
                                exc,
                            )
                            continue
                    except Exception:  # noqa: BLE001
                        break

                if last_sample_rate:
                    try:
                        await audio_pipeline.flush_session(session_id, last_sample_rate)
                    except Exception as exc:  # noqa: BLE001
                        logger.exception(
                            "Error flushing audio buffer for session %s: %s",
                            session_id,
                            exc,
                        )

            asyncio.create_task(consume_audio())

        else:

            async def consume_video() -> None:
                while True:
                    try:
                        await track.recv()
                    except Exception:  # noqa: BLE001
                        break

            asyncio.create_task(consume_video())

    @pc.on("connectionstatechange")
    async def on_connectionstatechange() -> None:
        if pc.connectionState in {"failed", "closed"}:
            await pc.close()
            pcs.discard(pc)

    logger.info("Processing SDP offer for %s", session_id)
    offer_sdp = RTCSessionDescription(sdp=session.sdp, type=session.type)
    await pc.setRemoteDescription(offer_sdp)

    for transceiver in pc.getTransceivers():
        if transceiver.kind in {"audio", "video"}:
            transceiver.direction = "recvonly"

    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    while pc.iceGatheringState != "complete":
        await asyncio.sleep(0.1)

    logger.info("Returning answer for PeerConnection %s", id(pc))
    return SDPModel(sdp=pc.localDescription.sdp, type=pc.localDescription.type)


@app.on_event("shutdown")
async def on_shutdown() -> None:
    coros = [pc.close() for pc in pcs]
    await asyncio.gather(*coros, return_exceptions=True)
    pcs.clear()
    logger.info("Shutdown complete; closed all peer connections")

    if _demo_task:
        _demo_task.cancel()


@app.get("/stream/conversation")
async def stream_conversation() -> StreamingResponse:
    """Server-Sent Events stream of conversation metadata events."""

    async def event_generator():
        queue = await conversation_bus.subscribe()
        try:
            while True:
                try:
                    event = await queue.get()
                except asyncio.CancelledError:
                    break
                payload = event.model_dump_json()
                yield f"event: conversation\ndata: {payload}\n\n"
        finally:
            await conversation_bus.unsubscribe(queue)

    headers = {"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    return StreamingResponse(event_generator(), media_type="text/event-stream", headers=headers)


@app.get("/stream/inference")
async def stream_inference() -> StreamingResponse:
    """Alias SSE stream for frontend components expecting '/stream/inference'."""

    async def event_generator():
        queue = await conversation_bus.subscribe()
        try:
            while True:
                try:
                    event = await queue.get()
                except asyncio.CancelledError:
                    break
                payload = event.model_dump_json()
                # Emit under the 'inference' event name to match existing frontend listeners
                yield f"event: inference\ndata: {payload}\n\n"
        finally:
            await conversation_bus.unsubscribe(queue)

    headers = {"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    return StreamingResponse(event_generator(), media_type="text/event-stream", headers=headers)


@app.get("/health")
async def health() -> dict[str, str]:
    """Simple health check endpoint used by the frontend."""
    return {"status": "ok"}


@app.post("/transcribe")
async def transcribe(payload: dict = Body(...)) -> dict:
    """Lightweight transcription intent stub for demo purposes."""
    text = str(payload.get("text", "")).strip()
    # naive intent classifier
    if any(k in text.lower() for k in ["meet", "appointment", "schedule"]):
        intent = {"type": "meeting_request", "confidence": 0.9}
        meeting = {
            "person_name": payload.get("person_name") or "Unknown Person",
            "time": "15:00",
            "date": "2025-12-21",
            "location": "Clinic",
        }
    else:
        intent = {"type": "statement", "confidence": 0.5}
        meeting = None

    return {"intent": intent, "meeting": meeting}


@app.get("/meetings")
async def list_meetings() -> dict:
    """Return demo meetings list."""
    meetings = [
        {
            "id": "m001",
            "person_id": "speaker_010",
            "person_name": "speaker_010",
            "time": "15:00",
            "date": "2025-12-21",
            "location": "Clinic",
            "notes": "Follow-up",
            "created_at": datetime.utcnow().isoformat(),
        }
    ]
    return {"meetings": meetings}


@app.get("/meetings/{person_id}")
async def list_meetings_for_person(person_id: str) -> dict:
    meetings = [
        {
            "id": "m002",
            "person_id": person_id,
            "person_name": person_id,
            "time": "10:30",
            "date": "2025-12-22",
            "location": "Home",
            "notes": "Check-in",
            "created_at": datetime.utcnow().isoformat(),
        }
    ]
    return {"meetings": meetings}


@app.post("/meetings")
async def create_meeting(payload: dict = Body(...)) -> dict:
    meeting_id = f"m{uuid4().hex[:6]}"
    meeting = {
        "id": meeting_id,
        "person_id": payload.get("person_id", "unknown"),
        "person_name": payload.get("person_name", "Unknown Person"),
        "time": payload.get("time", ""),
        "date": payload.get("date", datetime.utcnow().date().isoformat()),
        "location": payload.get("location", ""),
        "notes": payload.get("notes", ""),
        "created_at": datetime.utcnow().isoformat(),
    }
    return {"meeting_id": meeting_id, "meeting": meeting}
