import hashlib
from uuid import UUID

from fastapi import Request, Response

from auto_quote.auth.auth_provider import AuthProvider, User
from auto_quote.utils.ids import generate_id


SESSION_COOKIE_NAME = "auto_quote_session"
SESSION_COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60


class SessionCookieProvider(AuthProvider):
    def __init__(self, is_secure: bool):
        self.is_secure = is_secure

    async def get_current_user(self, request: Request, response: Response) -> User:
        token = request.cookies.get(SESSION_COOKIE_NAME)
        if token is not None and _is_issued_token(token):
            return User(id=_to_user_id(token))

        new_token = generate_id()
        response.set_cookie(
            key=SESSION_COOKIE_NAME,
            value=new_token,
            max_age=SESSION_COOKIE_MAX_AGE_SECONDS,
            httponly=True,
            secure=self.is_secure,
            samesite="lax",
        )
        return User(id=_to_user_id(new_token))


# Only accept values shaped like the tokens we issue, so arbitrary cookies cannot pick their own user id.
def _is_issued_token(token: str) -> bool:
    try:
        return str(UUID(token)) == token
    except ValueError:
        return False


# The user id is stored and returned by the API, so it must not reveal the token that authenticates the session.
def _to_user_id(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
