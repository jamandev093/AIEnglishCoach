from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from coach_service import analyze_speech_file, analyze_text as analyze_text_service
from admin_content_service import (
    create_admin_content_item,
    export_admin_content_backup,
    list_admin_content_items,
    set_admin_content_publish_status,
    update_admin_content_item,
)
from admin_security import require_admin_key
from admin_user_service import (
    get_admin_user_detail,
    get_admin_user_metrics,
    list_admin_users,
    search_admin_users_by_phone,
    set_admin_user_access_status,
    update_admin_user_access,
)
from content_schemas import ContentItem
from user_schemas import ManualAccessUpdateRequest
from content_service import get_confidence_videos, get_reading_listening, get_stories, get_topics
from schemas import AnalyzeRequest
from settings import APP_NAME, APP_VERSION


app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="Backend API for AI English Coach MVP",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "success": True,
        "message": "AI English Coach backend is running 🚀",
        "version": APP_VERSION,
    }


@app.get("/health")
def health_check():
    return {
        "success": True,
        "status": "healthy",
        "service": APP_NAME,
    }


@app.get("/content/stories")
def content_stories():
    return get_stories()


@app.get("/content/confidence-videos")
def content_confidence_videos():
    return get_confidence_videos()


@app.get("/content/reading-listening")
def content_reading_listening():
    return get_reading_listening()


@app.get("/content/topics")
def content_topics():
    return get_topics()






@app.get("/admin/users")
def admin_list_users(_admin_access: bool = Depends(require_admin_key)):
    return list_admin_users()


@app.get("/admin/users/search")
def admin_search_users_by_phone(
    phone: str,
    _admin_access: bool = Depends(require_admin_key),
):
    return search_admin_users_by_phone(phone)


@app.get("/admin/users/metrics")
def admin_get_user_metrics(_admin_access: bool = Depends(require_admin_key)):
    return get_admin_user_metrics()


@app.put("/admin/users/{user_id}/access")
def admin_update_user_access(
    user_id: str,
    access_update: ManualAccessUpdateRequest,
    _admin_access: bool = Depends(require_admin_key),
):
    return update_admin_user_access(user_id, access_update)


@app.post("/admin/users/{user_id}/access/revoke")
def admin_revoke_user_access(
    user_id: str,
    _admin_access: bool = Depends(require_admin_key),
):
    return set_admin_user_access_status(user_id, "revoked")


@app.post("/admin/users/{user_id}/access/expire")
def admin_expire_user_access(
    user_id: str,
    _admin_access: bool = Depends(require_admin_key),
):
    return set_admin_user_access_status(user_id, "expired")


@app.get("/admin/users/{user_id}")
def admin_get_user_detail(
    user_id: str,
    _admin_access: bool = Depends(require_admin_key),
):
    return get_admin_user_detail(user_id)


@app.get("/admin/content/export")
def admin_export_content(_admin_access: bool = Depends(require_admin_key)):
    return export_admin_content_backup()


@app.get("/admin/content")
def admin_list_content(_admin_access: bool = Depends(require_admin_key)):
    return list_admin_content_items()


@app.post("/admin/content")
def admin_create_content(
    item: ContentItem,
    _admin_access: bool = Depends(require_admin_key),
):
    return create_admin_content_item(item)

@app.put("/admin/content/{content_id}")
def admin_update_content(
    content_id: str,
    item: ContentItem,
    _admin_access: bool = Depends(require_admin_key),
):
    return update_admin_content_item(content_id, item)


@app.post("/admin/content/{content_id}/publish")
def admin_publish_content(
    content_id: str,
    _admin_access: bool = Depends(require_admin_key),
):
    return set_admin_content_publish_status(content_id, True)


@app.post("/admin/content/{content_id}/unpublish")
def admin_unpublish_content(
    content_id: str,
    _admin_access: bool = Depends(require_admin_key),
):
    return set_admin_content_publish_status(content_id, False)

@app.post("/analyze")
def analyze_text(request: AnalyzeRequest):
    text = request.text.strip()

    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    try:
        return analyze_text_service(text)
    except Exception as error:
        print("Analyze error:", error)
        raise HTTPException(status_code=500, detail="Analyze failed")


@app.post("/speech/analyze")
async def analyze_speech(
    file: UploadFile = File(...),
    simulatedText: str = Form(""),
):
    try:
        return await analyze_speech_file(
            file=file,
            simulated_text=simulatedText,
        )
    except Exception as error:
        print("Speech analyze error:", error)
        raise HTTPException(status_code=500, detail="Speech analyze failed")
