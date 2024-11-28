from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import openai
import os
from dotenv import load_dotenv
from google.cloud import speech_v1
from google.cloud import storage
import json
import asyncio
from datetime import datetime
import pytesseract
from pdf2image import convert_from_bytes
from docx import Document
import io
import base64
import math
from PIL import Image

load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set Google Cloud credentials if available
google_creds = os.getenv("GOOGLE_CLOUD_CREDENTIALS")
if google_creds:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = google_creds

# Initialize OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

# Initialize Google Cloud clients if credentials are available
if google_creds:
    speech_client = speech_v1.SpeechClient()
    storage_client = storage.Client()

class TranscriptionRequest(BaseModel):
    audio_data: str

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

# History storage - In a real app, this would be in a database
history_items = []

# History pagination model
class PaginatedHistory(BaseModel):
    items: List[dict]
    total: int
    page: int
    per_page: int
    total_pages: int

@app.get("/api/history", response_model=PaginatedHistory)
async def get_history(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    type_filter: Optional[str] = Query(None, regex="^(voice|document)$"),
    search: Optional[str] = Query(None),
    sort: str = Query("desc", regex="^(asc|desc)$")
):
    filtered_items = history_items

    # Apply type filter
    if type_filter:
        filtered_items = [item for item in filtered_items if item["type"] == type_filter]

    # Apply search filter
    if search:
        search = search.lower()
        filtered_items = [
            item for item in filtered_items
            if search in item["content"].lower()
            or (item["type"] == "voice" and search in item.get("response", "").lower())
            or (item["type"] == "document" and search in item.get("summary", "").lower())
        ]

    # Sort items
    filtered_items.sort(
        key=lambda x: x["timestamp"],
        reverse=(sort == "desc")
    )

    # Calculate pagination
    total_items = len(filtered_items)
    total_pages = math.ceil(total_items / per_page)
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    paginated_items = filtered_items[start_idx:end_idx]

    return {
        "items": paginated_items,
        "total": total_items,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

@app.delete("/api/history/{item_id}")
async def delete_history_item(item_id: int):
    global history_items
    history_items = [item for item in history_items if item["id"] != item_id]
    return {"message": "Item deleted successfully"}

@app.post("/api/transcribe")
async def transcribe_audio(request: TranscriptionRequest):
    try:
        # Check if Google Cloud credentials are available
        if not google_creds:
            raise HTTPException(status_code=500, detail="Google Cloud credentials are not available")

        # Decode base64 audio data
        audio_bytes = base64.b64decode(request.audio_data.split(",")[1])
        
        # Configure audio and recognition settings
        audio = speech_v1.RecognitionAudio(content=audio_bytes)
        config = speech_v1.RecognitionConfig(
            encoding=speech_v1.RecognitionConfig.AudioEncoding.WEBM_OPUS,
            sample_rate_hertz=48000,
            language_code="en-US",
            enable_automatic_punctuation=True,
        )

        # Perform the transcription
        response = speech_client.recognize(config=config, audio=audio)
        
        # Extract the transcribed text
        transcript = ""
        for result in response.results:
            transcript += result.alternatives[0].transcript + " "

        return {"transcript": transcript.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat_with_ai(request: ChatRequest):
    try:
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        response = await asyncio.to_thread(
            openai.ChatCompletion.create,
            model="gpt-4",
            messages=messages,
            temperature=0.7,
            max_tokens=150,
        )
        
        # Store in history
        history_items.append({
            "id": len(history_items) + 1,
            "type": "voice",
            "content": messages[-1]["content"],
            "response": response.choices[0].message.content,
            "timestamp": datetime.now().isoformat()
        })
        
        return {"response": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        text = ""
        
        if file.filename.lower().endswith('.pdf'):
            # Convert PDF to images and extract text
            images = convert_from_bytes(contents)
            for image in images:
                text += pytesseract.image_to_string(image) + "\n"
        
        elif file.filename.lower().endswith('.docx'):
            # Extract text from Word document
            doc = Document(io.BytesIO(contents))
            for para in doc.paragraphs:
                text += para.text + "\n"
        
        elif file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            # Extract text from image
            text = pytesseract.image_to_string(Image.open(io.BytesIO(contents)))
        
        # Generate summary using OpenAI
        response = await asyncio.to_thread(
            openai.ChatCompletion.create,
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that summarizes documents."},
                {"role": "user", "content": f"Please summarize the following text:\n\n{text}"}
            ],
            temperature=0.7,
            max_tokens=250,
        )
        
        summary = response.choices[0].message.content
        
        # Store in history
        history_items.append({
            "id": len(history_items) + 1,
            "type": "document",
            "content": file.filename,
            "summary": summary,
            "timestamp": datetime.now().isoformat()
        })
        
        return {
            "filename": file.filename,
            "text": text,
            "summary": summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
