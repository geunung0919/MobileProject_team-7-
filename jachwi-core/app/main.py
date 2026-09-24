"""개발용 중앙 코어. 실제 사용자 인증은 팀 공통 인증으로 교체해야 합니다."""
import json
import os
import secrets
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from .database import connect, Base, ProfileRow, SnapshotRow
from .schemas import Onboarding, OnboardingResult, OnboardingPreview, SpendingSnapshot, InventorySnapshot, LifeSnapshot, IntegratedView
from .services import diagnose, integrate, preview_onboarding
from .onboarding_form import OnboardingForm, get_onboarding_form

load_dotenv()
SNAPSHOTS = {'spending': SpendingSnapshot, 'inventory': InventorySnapshot, 'life': LifeSnapshot}

def create_app(database_url=None, tokens=None, demo_enabled=None):
    url = database_url or os.getenv('DATABASE_URL', 'sqlite:///./core.db')
    identities = tokens if tokens is not None else json.loads(os.getenv('DEV_TOKENS_JSON', '{}'))
    enabled = demo_enabled if demo_enabled is not None else os.getenv('ENABLE_DEMO_ENDPOINTS', 'false').lower() == 'true'
    if not identities or any(len(k) < 16 or not isinstance(v, str) or not 1 <= len(v) <= 64 for k, v in identities.items()):
        raise RuntimeError('DEV_TOKENS_JSON에 16자 이상의 개발 토큰과 사용자 ID를 설정하세요. README 참고.')
    engine, sessions = connect(url)
    @asynccontextmanager
    async def lifespan(app):
        Base.metadata.create_all(engine)  # 초기 개발용. 스키마 변경은 별도 마이그레이션 필요.
        yield
        engine.dispose()
    app = FastAPI(title='자취 가이드 중앙 코어', version='0.1.0', lifespan=lifespan)
    app.state.sessions = sessions
    app.add_middleware(CORSMiddleware, allow_origins=os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(','),
                       allow_methods=['GET', 'PUT', 'POST'], allow_headers=['Authorization', 'Content-Type'])
    bearer = HTTPBearer(auto_error=False)
    def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
        if credentials:
            for token, user in identities.items():
                if secrets.compare_digest(token, credentials.credentials):
                    return user
        raise HTTPException(401, '유효한 개발 토큰이 필요합니다.', headers={'WWW-Authenticate': 'Bearer'})
    def db():
        with sessions() as session:
            yield session
    @app.exception_handler(RequestValidationError)
    async def validation_error(request, exc):
        return JSONResponse(status_code=422, content={'error': {'code': 'VALIDATION_ERROR', 'message': '입력 형식을 확인하세요.',
            'details': [{'field': '.'.join(map(str, e['loc'])), 'message': e['msg']} for e in exc.errors()]}})
    @app.exception_handler(HTTPException)
    async def http_error(request, exc):
        return JSONResponse(status_code=exc.status_code, headers=exc.headers,
                            content={'error': {'code': str(exc.status_code), 'message': exc.detail}})
    @app.exception_handler(IntegrityError)
    async def concurrent_write(request, exc):
        return JSONResponse(status_code=409, content={'error': {'code': 'WRITE_CONFLICT', 'message': '동시 저장 충돌입니다. 다시 조회 후 시도하세요.'}})
    @app.get('/health', tags=['운영'])
    def health():
        return {'status': 'ok', 'version': '0.1.0'}
    @app.get('/api/v1/onboarding/form', response_model=OnboardingForm, tags=['1번 온보딩'])
    def onboarding_form(user=Depends(current_user)):
        return get_onboarding_form()

    @app.post('/api/v1/me/onboarding/preview', response_model=OnboardingPreview, tags=['1번 온보딩'])
    def preview(body: Onboarding, user=Depends(current_user)):
        return preview_onboarding(body)

    @app.put('/api/v1/me/onboarding', response_model=OnboardingResult, tags=['1번 온보딩'])
    def put_onboarding(body: Onboarding, user=Depends(current_user), session=Depends(db)):
        session.merge(ProfileRow(user_id=user, payload=body.model_dump(mode='json')))
        session.commit()
        return OnboardingResult(profile=body, diagnosis=diagnose(body))
    @app.get('/api/v1/me/onboarding', response_model=OnboardingResult, tags=['1번 온보딩'])
    def get_onboarding(user=Depends(current_user), session=Depends(db)):
        row = session.get(ProfileRow, user)
        if row is None:
            raise HTTPException(404, '온보딩이 아직 등록되지 않았습니다.')
        profile = Onboarding.model_validate(row.payload)
        return OnboardingResult(profile=profile, diagnosis=diagnose(profile))

    def get_view(user, session):
        row = session.get(ProfileRow, user)
        profile = Onboarding.model_validate(row.payload) if row else None
        modules = {}
        for name, model in SNAPSHOTS.items():
            snapshot = session.get(SnapshotRow, (user, name))
            modules[name] = model.model_validate(snapshot.payload) if snapshot else None
        return integrate(profile, modules)
    @app.get('/api/v1/me/dashboard', response_model=IntegratedView, tags=['4번 연결'])
    def dashboard(user=Depends(current_user), session=Depends(db)):
        return get_view(user, session)
    @app.get('/api/v1/me/ai-context', tags=['6번 연결'])
    def ai_context(user=Depends(current_user), session=Depends(db)):
        view = get_view(user, session)
        profile = view.profile
        return {'schema_version': '1.0', 'generated_at': view.generated_at,
                'preferences': profile.model_dump(exclude={'region_code', 'living_months'}) if profile else None,
                'module_status': view.module_status,
                'modules': {k: v for k, v in view.modules.items() if view.module_status[k] == 'available'},
                'constraints': ['구매 기록은 실제 섭취량이 아닙니다.', '추정 소진일은 식품 안전을 보장하지 않습니다.',
                                '데이터가 없으면 추측하지 마세요.', '응답 생성만으로 DB를 수정하지 마세요.']}
    # 개발 연결용 전체 스냅샷 교체. 실서비스의 일반 사용자 입력 API가 아니다.
    def save_snapshot(module, body, user, session):
        if body.source_updated_at > datetime.now(timezone.utc) + timedelta(minutes=5):
            raise HTTPException(422, '출처 시각이 현재보다 지나치게 미래입니다.')
        row = session.get(SnapshotRow, (user, module), with_for_update=True)
        payload = body.model_dump(mode='json')
        if row:
            previous = SNAPSHOTS[module].model_validate(row.payload)
            if body.source_updated_at < previous.source_updated_at:
                raise HTTPException(409, '이전 시각의 스냅샷으로 덮어쓸 수 없습니다.')
            if body.source_updated_at == previous.source_updated_at and body != previous:
                raise HTTPException(409, '같은 시각에 다른 내용이 있습니다.')
            row.payload = payload
        else:
            session.add(SnapshotRow(user_id=user, module=module, payload=payload))
        session.commit()
        return {'module': module, 'saved': True}
    if enabled:
        @app.put('/api/v1/dev/me/modules/spending', tags=['개발 연결 2번'])
        def spending(body: SpendingSnapshot, user=Depends(current_user), session=Depends(db)):
            return save_snapshot('spending', body, user, session)
        @app.put('/api/v1/dev/me/modules/inventory', tags=['개발 연결 3번'])
        def inventory(body: InventorySnapshot, user=Depends(current_user), session=Depends(db)):
            return save_snapshot('inventory', body, user, session)
        @app.put('/api/v1/dev/me/modules/life', tags=['개발 연결 5번'])
        def life(body: LifeSnapshot, user=Depends(current_user), session=Depends(db)):
            return save_snapshot('life', body, user, session)
    return app
