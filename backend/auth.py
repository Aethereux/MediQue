import bcrypt


def hash_password(pw):
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw, pw_hash):
    return bcrypt.checkpw(pw.encode(), pw_hash.encode())
