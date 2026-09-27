from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String


db = SQLAlchemy()


class Instance(db.Model):
    __tablename__ = "instances"

    id: Mapped[int] = mapped_column(primary_key=True)
    password_hash: Mapped[str] = mapped_column(String(length=128), nullable=False)

    def __init__(self, password_hash: str) -> None:
        self.password_hash = password_hash


class SessionUser(UserMixin):
    id: str = "SESSION"

    def get_id(self) -> str:
        return self.id


SESSION_USER = SessionUser()
