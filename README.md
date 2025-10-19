웰파렌 사전 선호도/알림 등록 랜딩 페이지
=========================================

개요
----
- 복지×금융 핀테크 플랫폼 ‘웰파렌’의 사전 선호도 조사 및 출시 알림 등록 페이지입니다.
- 방문자는 이메일을 남겨 얼리 액세스/다운로드 링크를 받아볼 수 있습니다.
- 서버는 Flask + SQLite로 구성되어 별도 DB 설치 없이 파일 기반으로 동작합니다.

구성
----
- `app.py`: Flask 애플리케이션, `/` 랜딩, `/subscribe` 이메일 등록, `/admin/export` CSV 내보내기
- `templates/index.html`: 랜딩 페이지 템플릿
- `static/css/style.css`, `static/js/main.js`: 간단한 스타일/인터랙션
- `data/app.sqlite3`: SQLite DB 파일 (실행 시 자동 생성)

빠른 실행
------
1) Python 3.10+ 준비 후 가상환경 생성

   macOS/Linux
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

   Windows (PowerShell)
   ```powershell
   py -3 -m venv .venv
   .venv\Scripts\Activate.ps1
   ```

2) 의존성 설치
   ```bash
   pip install -r requirements.txt
   ```

3) 환경변수 (선택)
   ```bash
   export ADMIN_TOKEN="<임의토큰>"   # CSV 내보내기 보호용
   export SECRET_KEY="<임의시크릿>"  # 세션 보호용
   export DB_PATH="data/app.sqlite3"  # 기본값 동일
   ```

4) 개발 서버 실행
   ```bash
   python app.py
   # http://localhost:5000 접속
   ```

기능
----
- 이메일 등록: `POST /subscribe` (JSON 또는 form-urlencoded)
  - 요청: `{ "email": "you@example.com" }`
  - 응답: `{ ok: true|false, message: "..." }`
- 관리자 CSV 내보내기: `GET /admin/export?token=ADMIN_TOKEN`
  - `ADMIN_TOKEN` 환경변수로 보호됩니다.

배포 가이드(요약)
---------------
- 단일 프로세스 배포
  - 예: Ubuntu VM 등에서 Python 설치 후 `pip install -r requirements.txt` → `gunicorn 'app:app' -b 0.0.0.0:8000`
  - Nginx 등 리버스 프록시를 앞단에 두고 `/static`은 정적서빙, `/`는 Gunicorn으로 라우팅
- Docker (선택)
  - 간단한 예시 Dockerfile
    ```Dockerfile
    FROM python:3.11-slim
    WORKDIR /app
    COPY requirements.txt ./
    RUN pip install --no-cache-dir -r requirements.txt
    COPY . .
    ENV PYTHONUNBUFFERED=1
    ENV PORT=8000
    CMD ["python", "app.py"]
    ```
  - 또는 프로덕션: `CMD ["gunicorn", "app:app", "-b", "0.0.0.0:8000", "-w", "2"]`

DB 백업/마이그레이션
-----------------
- DB는 `data/app.sqlite3` 파일 하나로 구성됩니다.
- 백업: 서버 중지 후 파일 복사即可.
- 스키마는 첫 실행 시 자동 생성됩니다.

커스터마이징 포인트
----------------
- 카피/문구: `templates/index.html`
- 색상/스타일: `static/css/style.css`
- 폼/검증: `static/js/main.js`, `app.py`의 `is_valid_email`

보안 메모
-------
- 관리자 내보내기는 토큰 기반으로만 보호됩니다. 운영 시에는 별도 어드민 UI와 인증을 추가하는 것을 권장합니다.

