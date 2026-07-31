import bcrypt
import jwt
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from database import SECRET_KEY, get_db
from models import User

bearer = HTTPBearer(auto_error=False)


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


def get_current_user(cred: HTTPAuthorizationCredentials = Depends(bearer),
                     db=Depends(get_db)) -> User:
    user = None
    if cred is not None:
        try:
            payload = jwt.decode(cred.credentials, SECRET_KEY, algorithms=["HS256"])
            user = db.get(User, int(payload["sub"]))
        except Exception:
            user = None
    if user is None:
        raise HTTPException(401, "Not authenticated")
    return user
