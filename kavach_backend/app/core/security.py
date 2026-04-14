from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings
from app.models.schemas import UserPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserPayload:
    # Simplified JWT validation - in production use properly validated tokens
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # For demo purposes, accept any bearer token and create default user
        # In production, properly decode and validate JWT token
        return UserPayload(user_id="test_user", farm_id="test_farm", role="Veterinarian")
    except Exception:
        raise credentials_exception
