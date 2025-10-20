import os
import re
import sqlite3
from datetime import datetime
from pathlib import Path

from flask import Flask, g, render_template, request, redirect, url_for, jsonify


DB_PATH = Path(os.environ.get("DB_PATH", "data/app.sqlite3"))
DB_PATH.parent.mkdir(parents=True, exist_ok=True)


def create_app():
    app = Flask(__name__)
    app.config.update(
        SECRET_KEY=os.environ.get("SECRET_KEY", "change-me"),
        ADMIN_TOKEN=os.environ.get("ADMIN_TOKEN", ""),
        DB_PATH=str(DB_PATH),
        # Display starts at 532 even when DB count is 0
        COUNT_OFFSET=532,
    )

    @app.before_request
    def before_request():
        g.db = get_db(app)

    @app.teardown_appcontext
    def teardown(_):
        db = g.pop("db", None)
        if db is not None:
            db.close()

    @app.route("/")
    def index():
        # Count current subscribers to display on the homepage footer
        try:
            row = g.db.execute("SELECT COUNT(*) FROM subscribers").fetchone()
            subscriber_count = int(row[0]) if row else 0
        except sqlite3.Error:
            subscriber_count = 0
        display_count = subscriber_count + int(app.config.get("COUNT_OFFSET", 0))
        return render_template(
            "index.html",
            subscriber_count=subscriber_count,
            display_count=display_count,
        )

    @app.post("/subscribe")
    def subscribe():
        data = request.get_json(silent=True) or request.form
        email = (data.get("email") or "").strip().lower()

        if not is_valid_email(email):
            return jsonify({"ok": False, "message": "유효한 이메일을 입력해주세요."}), 400

        try:
            with g.db:
                g.db.execute(
                    """
                    INSERT INTO subscribers(email, user_agent, ip_address, created_at)
                    VALUES (?, ?, ?, ?)
                    """,
                    (
                        email,
                        request.headers.get("User-Agent", ""),
                        request.headers.get("X-Forwarded-For", request.remote_addr) or "",
                        datetime.utcnow().isoformat(timespec="seconds"),
                    ),
                )
        except sqlite3.IntegrityError:
            # email already exists
            return jsonify({"ok": True, "message": "이미 등록된 이메일입니다. 감사합니다!"})

        return jsonify({"ok": True, "message": "등록이 완료되었습니다. 감사합니다!"})

    @app.get("/admin/export")
    def admin_export():
        token = request.args.get("token", "")
        if not app.config["ADMIN_TOKEN"] or token != app.config["ADMIN_TOKEN"]:
            return ("Unauthorized", 401)

        rows = g.db.execute(
            "SELECT id, email, created_at, ip_address, user_agent FROM subscribers ORDER BY id DESC"
        ).fetchall()

        # CSV export
        lines = ["id,email,created_at,ip_address,user_agent"]
        for r in rows:
            # simple CSV escaping for commas/quotes
            def esc(v: str) -> str:
                v = v or ""
                if any(c in v for c in ",\"\n\r"):
                    v = '"' + v.replace('"', '""') + '"'
                return v

            lines.append(
                ",".join(
                    [
                        str(r[0]),
                        esc(r[1]),
                        esc(r[2]),
                        esc(r[3]),
                        esc(r[4]),
                    ]
                )
            )
        csv = "\n".join(lines)
        return (csv, 200, {"Content-Type": "text/csv; charset=utf-8"})

    ensure_schema(DB_PATH)
    return app


def get_db(app: Flask):
    if "db" not in g:
        g.db = sqlite3.connect(app.config["DB_PATH"], detect_types=sqlite3.PARSE_DECLTYPES)
    return g.db


def ensure_schema(path: Path):
    # Create DB and table if not exists
    conn = sqlite3.connect(path)
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS subscribers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                user_agent TEXT,
                ip_address TEXT,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")


def is_valid_email(email: str) -> bool:
    return bool(EMAIL_RE.match(email))


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=True)
