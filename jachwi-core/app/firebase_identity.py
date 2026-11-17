"""Verify the project's Firebase ID tokens using the Firebase Admin SDK."""
import os
import re
from uuid import uuid4

from fastapi import HTTPException


def create_firebase_verifier():
    project_id = os.getenv("FIREBASE_PROJECT_ID", "").strip()
    if not re.fullmatch(r"[a-z][a-z0-9-]{4,28}[a-z0-9]", project_id):
        raise RuntimeError("FIREBASE_PROJECT_ID를 설정하세요.")
    if os.getenv("FIREBASE_AUTH_EMULATOR_HOST"):
        raise RuntimeError("운영 분석 서버에서는 Firebase Auth 에뮬레이터를 사용할 수 없습니다.")

    import firebase_admin
    from firebase_admin import auth

    firebase_app = firebase_admin.initialize_app(
        options={"projectId": project_id, "httpTimeout": 10}, name=f"receipt-{uuid4().hex}",
    )

    def verify(token):
        try:
            claims = auth.verify_id_token(token, app=firebase_app)
        except (auth.InvalidIdTokenError, auth.ExpiredIdTokenError, ValueError):
            raise HTTPException(401, "Firebase 로그인을 다시 확인해 주세요.", headers={"WWW-Authenticate": "Bearer"}) from None
        except Exception:
            raise HTTPException(503, "로그인 서버를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.") from None
        uid = claims.get("uid")
        if not isinstance(uid, str) or not 1 <= len(uid) <= 128:
            raise HTTPException(401, "Firebase 사용자를 확인할 수 없어요.")
        return uid

    return verify, lambda: firebase_admin.delete_app(firebase_app)
