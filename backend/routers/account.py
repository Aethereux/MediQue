from datetime import date
from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from database import get_db
from models import User, today, valid_email
from routers.auth import user_full
from schemas import AccountIn

router = APIRouter(prefix="/api/account")

@router.patch("")
def update_account(
    payload: AccountIn,
    user: User = Depends(get_current_user),
    db=Depends(get_db)
):
    
    if payload.full_name is not None:
        name = payload.full_name.strip()
        if not name:
            raise HTTPException(422, "Please enter your name.")
        user.full_name = name
   
    if payload.email is not None:
        em = payload.email.strip().lower()
        if not valid_email(em):
            raise HTTPException(422, "Enter a valid email address.")
        
        # Check if another user already owns this email
        existing_user = db.query(User).filter(User.email == em).first()
        if existing_user and existing_user.id != user.id:
            raise HTTPException(409, "An account with this email already exists.")
        
        user.email = em

    if payload.birthday is not None:
        try:
            bday = date.fromisoformat(payload.birthday)
        except ValueError:
            raise HTTPException(422, "Enter a valid birthday.")
        
        if bday > today():
            raise HTTPException(422, "Birthday cannot be in the future.")
        
        user.birthday = payload.birthday

    if payload.mobile is not None:
        user.mobile = payload.mobile
        
    if payload.sex is not None:
        user.sex = payload.sex
        
    if payload.address is not None:
        user.address = payload.address

    db.commit()

    response_data = user_full(user)
    response_data["message"] = "Your changes have been saved."
    
    return response_data

@router.post("/password-reset")
def password_reset(user: User = Depends(get_current_user)):
    # This is a stub as per spec; no actual email is sent.
    return {"message": "Password reset link sent to your email."}