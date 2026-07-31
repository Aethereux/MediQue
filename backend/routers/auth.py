from fastapi import APIRouter, Depends, HTTPException

from auth import hash_password, make_token
from database import get_db
from models import User, first_name_of, initials_of, valid_email
from schemas import RegisterIn

router = APIRouter(prefix="/api/auth")


def user_brief(u):
    return {
        "id": u.id,
        "full_name": u.full_name,
        "email": u.email,
        "mobile": u.mobile,
        "first_name": first_name_of(u.full_name),
        "initials": initials_of(u.full_name),
        "role": u.role,
    }


@router.post("/register", status_code=201)
def register(body: RegisterIn, db = Depends(get_db)):
   
    if not body.full_name or not body.full_name.strip():
        raise HTTPException(status_code=422, detail="Please enter your name.")
    
    email = body.email.strip().lower() if body.email else ""
    if not valid_email(email):
        raise HTTPException(status_code=422, detail="Enter a valid email address.")
    
    if not body.mobile or not body.mobile.strip():
        raise HTTPException(status_code=422, detail="Please enter your mobile number.")
    
    if not body.password or len(body.password) < 6:
        raise HTTPException(status_code=422, detail="Password must be at least 6 characters.")
    
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    
    # Create the User 
    user = User(
        full_name=body.full_name.strip(),
        email=email,
        mobile=body.mobile.strip(),
        password_hash=hash_password(body.password)
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {
        "user": user_brief(user),
        "access_token": make_token(user.id),
        "token_type": "bearer"
    }
