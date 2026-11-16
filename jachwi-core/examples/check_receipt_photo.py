import base64,io,os,sys,tempfile
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import argparse
parser=argparse.ArgumentParser()
parser.add_argument('--font', required=True, help='한국어를 지원하는 글꼴 파일')
args=parser.parse_args()
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from fastapi.testclient import TestClient
from app.main import create_app
image=Image.new('RGB',(1200,900),'white')
font=ImageFont.truetype(args.font,48)
draw=ImageDraw.Draw(image)
for i,line in enumerate(['이마트 천안점','영수증','2026-11-05','사과 3,000원','합계 12,300원','감사합니다']):draw.text((70,60+110*i),line,font=font,fill='black')
buffer=io.BytesIO();image.save(buffer,format='JPEG')
headers={'Authorization':'Bearer receipt-test-token-12345'}
with tempfile.TemporaryDirectory() as d:
 app=create_app('sqlite:///'+str(Path(d)/'test.db'),tokens={'receipt-test-token-12345':'test-user'},demo_enabled=False)
 with TestClient(app) as client:
  response=client.post('/api/v1/me/spending/receipts/analyze',headers=headers,json={'mime_type':'image/jpeg','image_base64':base64.b64encode(buffer.getvalue()).decode()})
  assert response.status_code==200,response.text
  data=response.json();print('OCR:',data['raw_text']);print('candidate:',data['candidate'])
  assert data['candidate']['amount_krw']==12300
  assert '이마트' in data['raw_text']
  assert client.get('/api/v1/me/spending',headers=headers).json()['expenses']==[]
  body={**data['candidate'],'title':'이마트 천안점','raw_text':data['raw_text'],'source':'ocr'}
  assert client.post('/api/v1/me/spending/imports/confirm',headers=headers,json=body).status_code==201
  assert len(client.get('/api/v1/me/spending',headers=headers).json()['expenses'])==1
  assert client.post('/api/v1/me/spending/imports/confirm',headers=headers,json=body).status_code==409
 print('PASS: real Korean OCR -> preview (no write) -> confirm -> duplicate rejection')
