from fastapi import APIRouter, HTTPException

from models import first_name_of, valid_email
from schemas import ContactIn

router = APIRouter(prefix="/api")


@router.post("/contact")
def contact(body: ContactIn):
    # deliberate stub: validate + confirm, nothing persisted (spec MP-10)
    if not body.name.strip():
        raise HTTPException(422, "Please enter your name.")
    if not valid_email(body.email.strip()):
        raise HTTPException(422, "Enter a valid email address.")
    if not body.message.strip():
        raise HTTPException(422, "Please enter a message.")
    first = first_name_of(body.name.strip())
    return {"message": f"Thanks, {first}. Our team will get back to you within one business day."}
