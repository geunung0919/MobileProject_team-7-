import base64
import io
import subprocess
from pathlib import Path
import pytest
from PIL import Image
from fastapi import HTTPException
from app import receipt_ocr as ocr
from test_core import client, A, B
URL='/api/v1/me/spending/receipts/analyze'
def photo():
    buffer=io.BytesIO()
    Image.new('RGB',(200,400),'white').save(buffer,format='PNG')
    return {'mime_type':'image/png','image_base64':base64.b64encode(buffer.getvalue()).decode()}

def test_auth_and_preview_without_writing_expenses(client, monkeypatch):
    monkeypatch.setattr(ocr,'recognize',lambda image:'이마트 천안점\n2026-11-05\n합계 12,300원')
    assert client.post(URL,json=photo()).status_code==401
    response=client.post(URL,headers=A,json=photo())
    assert response.status_code==200
    data=response.json()
    assert data['candidate']['amount_krw']==12300
    assert data['needs_review'] is True and data['image_retained'] is False
    assert client.get('/api/v1/me/spending',headers=A).json()['expenses']==[]
    assert client.get('/api/v1/me/spending',headers=B).json()['expenses']==[]

@pytest.mark.parametrize('payload,status',[
 ({'mime_type':'image/heic','image_base64':'AAAA'},415),
 ({'mime_type':'image/png','image_base64':'###'},422),
 ({'mime_type':'image/png','image_base64':base64.b64encode(b'not image').decode()},422),
 ({'mime_type':'image/png','image_base64':'A'*(12*1024*1024)},413),
 ([],422), ({'image_base64':'AAA'},422),
])
def test_reject_invalid_images(client,payload,status):
    assert client.post(URL,headers=A,json=payload).status_code==status

def test_mime_and_pixel_limit(client,monkeypatch):
    payload=photo();payload['mime_type']='image/jpeg'
    assert client.post(URL,headers=A,json=payload).status_code==415
    monkeypatch.setattr(ocr,'MAX_PIXELS',100)
    assert client.post(URL,headers=A,json=photo()).status_code==413

def test_busy_and_request_format(client,monkeypatch):
    import threading
    monkeypatch.setattr(ocr,'SLOTS',threading.BoundedSemaphore(1));ocr.SLOTS.acquire()
    try: assert client.post(URL,headers=A,json=photo()).status_code==429
    finally: ocr.SLOTS.release()
    assert client.post(URL,headers=A,content='bad').status_code==415
    assert client.post(URL,headers={**A,'Content-Type':'application/json'},content='{bad').status_code==422

def test_timeout_and_missing_engine_cleanup(monkeypatch):
    seen=[]
    def timeout(args,**kwargs):
        seen.append(Path(args[1]));assert seen[-1].exists()
        raise subprocess.TimeoutExpired(args[0],25)
    monkeypatch.setattr(ocr.subprocess,'run',timeout)
    with pytest.raises(HTTPException) as e:ocr.recognize(Image.new('L',(10,10)))
    assert e.value.status_code==504 and not seen[-1].exists()
    def missing(*args,**kwargs):raise FileNotFoundError()
    monkeypatch.setattr(ocr.subprocess,'run',missing)
    with pytest.raises(HTTPException) as e:ocr.recognize(Image.new('L',(10,10)))
    assert e.value.status_code==503

def test_empty_and_failed_engine_do_not_return_fake_results(monkeypatch):
    for code,status in [(0,422),(1,503)]:
        monkeypatch.setattr(ocr.subprocess,'run',lambda *a,**k:subprocess.CompletedProcess(a,code,b'',b'failure'))
        with pytest.raises(HTTPException) as e:ocr.recognize(Image.new('L',(10,10)))
        assert e.value.status_code==status

def test_truncated_text_is_flagged(monkeypatch):
    monkeypatch.setattr(ocr,'recognize',lambda image:'이마트\n합계 1000원\n'+'x'*6000)
    result=ocr.process_image(photo())
    assert len(result['raw_text'])==5000 and result['text_truncated'] and result['needs_review']
