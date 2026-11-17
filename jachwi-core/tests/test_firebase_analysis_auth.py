from fastapi import HTTPException
from fastapi.testclient import TestClient
import pytest

from app import main, receipt_ocr
from app.firebase_identity import create_firebase_verifier
from test_receipt_ocr import photo

PREVIEW = "/api/v1/me/spending/imports/preview"
PHOTO = "/api/v1/me/spending/receipts/analyze"


def test_firebase_analysis_only_requires_auth_and_rejects_legacy_credentials(tmp_path, monkeypatch):
    monkeypatch.setenv("CORE_AUTH_MODE", "firebase")
    monkeypatch.setenv("DEV_TOKENS_JSON", '{"legacy-developer-token":"demo"}')
    seen = []
    closed = []

    def verify(token):
        seen.append(token)
        if token != "verified-test-token":
            raise HTTPException(401, "Firebase 로그인을 확인해 주세요.")
        return "firebase-uid-test"

    monkeypatch.setattr(main, "create_firebase_verifier", lambda: (verify, lambda: closed.append(True)))
    monkeypatch.setattr(receipt_ocr, "recognize_server", lambda image: ("이마트 천안점\n2026-11-05\n합계 12,300원", {}))
    payload = {"source": "sms", "raw_text": "[KB국민] 12,300원 승인 김*웅 10/22 13:15 스타벅스 아산점"}
    app = main.create_app("sqlite:///" + str(tmp_path / "receipt.db"))
    with TestClient(app) as client:
        assert client.post(PREVIEW, json=payload).status_code == 401
        assert client.post(PREVIEW, headers={"Authorization": "Bearer legacy-developer-token"}, json=payload).status_code == 401
        header = {"Authorization": "Bearer verified-test-token"}
        assert client.post(PREVIEW, headers=header, json=payload).json()["candidate"]["amount_krw"] == 12300
        assert client.post(PHOTO, headers=header, json=photo()).json()["candidate"]["amount_krw"] == 12300
        assert client.get("/api/v1/me/spending", headers=header).status_code == 404
        assert client.post("/api/v1/me/spending/imports/confirm", headers=header, json=payload).status_code == 404
    assert seen == ["legacy-developer-token", "verified-test-token", "verified-test-token"]
    assert closed == [True]


@pytest.mark.parametrize("project,emulator", [("", ""), ("solo-living-ai", "localhost:9099")])
def test_firebase_mode_fails_closed_for_invalid_production_settings(monkeypatch, project, emulator):
    monkeypatch.setenv("FIREBASE_PROJECT_ID", project)
    monkeypatch.setenv("FIREBASE_AUTH_EMULATOR_HOST", emulator)
    with pytest.raises(RuntimeError):
        create_firebase_verifier()


def test_admin_sdk_checks_signature_project_and_expiry(monkeypatch):
    pytest.importorskip("firebase_admin")
    from datetime import datetime, timedelta, timezone
    import time
    from cryptography import x509
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.x509.oid import NameOID
    from firebase_admin import credentials
    from google.auth import crypt, jwt
    from google.auth.credentials import AnonymousCredentials
    from google.oauth2 import id_token

    monkeypatch.setenv("FIREBASE_PROJECT_ID", "solo-living-ai")
    monkeypatch.delenv("FIREBASE_AUTH_EMULATOR_HOST", raising=False)
    monkeypatch.setattr(credentials.ApplicationDefault, "get_credential", lambda self: AnonymousCredentials())
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "local-test")])
    now = datetime.now(timezone.utc)
    cert = (x509.CertificateBuilder().subject_name(subject).issuer_name(subject).public_key(key.public_key())
            .serial_number(x509.random_serial_number()).not_valid_before(now - timedelta(minutes=1))
            .not_valid_after(now + timedelta(hours=1)).sign(key, hashes.SHA256()))
    monkeypatch.setattr(id_token, "_fetch_certs", lambda request, url: {"local-test": cert.public_bytes(serialization.Encoding.PEM).decode()})

    def signer(private_key):
        return crypt.RSASigner.from_string(private_key.private_bytes(
            serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()), key_id="local-test")

    timestamp = int(time.time())
    claims = {"iss": "https://securetoken.google.com/solo-living-ai", "aud": "solo-living-ai",
              "sub": "account-123", "iat": timestamp - 2, "exp": timestamp + 30}
    verify, close = create_firebase_verifier()
    try:
        assert verify(jwt.encode(signer(key), claims).decode()) == "account-123"
        other_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        invalid = [
            jwt.encode(signer(other_key), claims),
            jwt.encode(signer(key), {**claims, "aud": "wrong-project"}),
            jwt.encode(signer(key), {**claims, "exp": timestamp - 1}),
        ]
        for token in invalid:
            with pytest.raises(HTTPException) as error:
                verify(token.decode())
            assert error.value.status_code == 401
    finally:
        close()
