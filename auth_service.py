from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.models.player import Player
from app.models.enums import UserRole
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.schemas.user import UserResponse
from app.core.security import get_password_hash, verify_password, create_access_token
from app.services.otp_service import normalize_indian_phone


class AuthService:
    @staticmethod
    def register_user(db: Session, request: RegisterRequest) -> tuple[User, str]:
        """
        Registers a new user with Email OR Phone Number and returns (User, access_token).
        Enforces uniqueness and normalizes Indian mobile numbers.
        """
        email_clean = request.email.lower().strip() if request.email else None
        phone_clean = None

        if request.phone_number:
            phone_clean = normalize_indian_phone(request.phone_number)

        # 1. Check duplicate email if provided
        if email_clean:
            existing_email_user = db.query(User).filter(User.email == email_clean).first()
            if existing_email_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This email is already registered."
                )

        # 2. Check duplicate phone number if provided
        if phone_clean:
            existing_phone_user = db.query(User).filter(User.phone_number == phone_clean).first()
            if existing_phone_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This phone number is already registered."
                )

        # 3. Hash password and create User entity
        hashed_password = get_password_hash(request.password)
        new_user = User(
            name=request.name.strip(),
            email=email_clean,
            phone_number=phone_clean,
            phone_verified=False,
            email_verified=False,
            password_hash=hashed_password,
            role=request.role
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # 4. If registering as a PLAYER, initialize their player profile immediately
        if new_user.role == UserRole.PLAYER:
            new_player = Player(
                user_id=new_user.id,
                sport="Football",
                position="Forward",
                age=20,
                gender="Male",
                experience=1,
                height=175.0,
                weight=70.0,
                achievements="Newly registered athlete"
            )
            db.add(new_player)
            db.commit()

        # 5. Generate JWT Access Token
        access_token = create_access_token(
            subject=new_user.id,
            role=new_user.role.value,
            email=new_user.email or new_user.phone_number or f"user_{new_user.id}"
        )

        return new_user, access_token

    @staticmethod
    def authenticate_user(db: Session, request: LoginRequest) -> tuple[User, str]:
        """
        Authenticates user with Email OR Phone Number and password.
        Returns (User, access_token).
        """
        raw_identifier = (request.username or request.email or "").strip()
        if not raw_identifier:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please enter your email or phone number to sign in."
            )

        user = None

        # Try lookup by email
        if "@" in raw_identifier:
            user = db.query(User).filter(User.email.ilike(raw_identifier)).first()
        else:
            # Try lookup by normalized phone number
            try:
                norm_phone = normalize_indian_phone(raw_identifier)
                user = db.query(User).filter(User.phone_number == norm_phone).first()
            except Exception:
                # Direct string fallback
                user = db.query(User).filter(User.phone_number == raw_identifier).first()

            # If still not found, check email as fallback
            if not user:
                user = db.query(User).filter(User.email.ilike(raw_identifier)).first()

        if not user or not verify_password(request.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email/phone or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Generate JWT Access Token
        access_token = create_access_token(
            subject=user.id,
            role=user.role.value,
            email=user.email or user.phone_number or f"user_{user.id}"
        )

        return user, access_token

    @staticmethod
    def build_token_response(user: User, access_token: str) -> TokenResponse:
        """Helper to build standardized TokenResponse."""
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )
