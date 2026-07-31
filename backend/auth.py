import bcrypt
import jwt
from datetime import datetime, timedelta, timezone

from database import SECRET_KEY


def hash_password(pw):
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw, pw_hash):
    return bcrypt.checkpw(pw.encode(), pw_hash.encode())


def make_token(user_id):
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")
