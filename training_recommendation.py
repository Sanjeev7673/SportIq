from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.session import Base


class TrainingRecommendation(Base):
    __tablename__ = "training_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    coach_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    player_id = Column(Integer, ForeignKey("players.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    focus_areas = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False, default="ACTIVE") # ACTIVE, COMPLETED, ARCHIVED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    coach = relationship("User", back_populates="created_recommendations")
    player = relationship("Player", back_populates="training_recommendations")
