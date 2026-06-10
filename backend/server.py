from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- Auth helpers ----------

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email,
               "exp": datetime.now(timezone.utc) + timedelta(minutes=15), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id,
               "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, user_id: str, email: str):
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access, httponly=True,
                        secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh, httponly=True,
                        secure=False, samesite="lax", max_age=604800, path="/")


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ---------- Brute force protection ----------

async def check_lockout(identifier: str):
    doc = await db.login_attempts.find_one({"identifier": identifier})
    if doc and doc.get("count", 0) >= 5:
        locked_until = doc.get("locked_until")
        if locked_until:
            until = datetime.fromisoformat(locked_until)
            if until > datetime.now(timezone.utc):
                raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
        await db.login_attempts.delete_one({"identifier": identifier})


async def record_failed_attempt(identifier: str):
    doc = await db.login_attempts.find_one({"identifier": identifier})
    count = (doc.get("count", 0) if doc else 0) + 1
    update: Dict[str, Any] = {"count": count, "last_attempt": now_iso()}
    if count >= 5:
        update["locked_until"] = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
    await db.login_attempts.update_one({"identifier": identifier}, {"$set": update}, upsert=True)


async def clear_attempts(identifier: str):
    await db.login_attempts.delete_one({"identifier": identifier})


# ---------- Models ----------

class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class BusinessCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)


class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    icp: Optional[Dict[str, Any]] = None
    value_prop: Optional[str] = None
    money_model: Optional[Dict[str, Any]] = None
    journey: Optional[Dict[str, Any]] = None


class SimulationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    offers: List[Dict[str, Any]] = []


class SimulationUpdate(BaseModel):
    name: Optional[str] = None
    offers: Optional[List[Dict[str, Any]]] = None


def public_user(u: dict) -> dict:
    return {"id": u["id"], "name": u.get("name", ""), "email": u["email"], "role": u.get("role", "user")}


# ---------- Auth routes ----------

@api_router.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    email = body.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    user = {
        "id": str(uuid.uuid4()),
        "name": body.name.strip(),
        "email": email,
        "password_hash": hash_password(body.password),
        "role": "user",
        "created_at": now_iso(),
    }
    await db.users.insert_one({**user})
    set_auth_cookies(response, user["id"], email)
    return public_user(user)


@api_router.post("/auth/login")
async def login(body: LoginIn, request: Request, response: Response):
    email = body.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    await check_lockout(identifier)
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        await record_failed_attempt(identifier)
        raise HTTPException(status_code=401, detail="Wrong email or password")
    await clear_attempts(identifier)
    set_auth_cookies(response, user["id"], email)
    return public_user(user)


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api_router.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access = create_access_token(user["id"], user["email"])
        response.set_cookie(key="access_token", value=access, httponly=True,
                            secure=False, samesite="lax", max_age=900, path="/")
        return {"ok": True}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)


# ---------- Business routes ----------

def default_business(user_id: str, name: str) -> dict:
    return {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "name": name,
        "icp": {"who": "", "want": "", "blocker": "", "words": ""},
        "value_prop": "",
        "money_model": {"steps": [], "x_customers": 100},
        "journey": {"stages": []},
        "created_at": now_iso(),
    }


async def get_owned_business(bid: str, user: dict) -> dict:
    biz = await db.businesses.find_one({"id": bid, "user_id": user["id"]}, {"_id": 0})
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    return biz


@api_router.get("/businesses")
async def list_businesses(user: dict = Depends(get_current_user)):
    return await db.businesses.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", 1).to_list(100)


@api_router.post("/businesses")
async def create_business(body: BusinessCreate, user: dict = Depends(get_current_user)):
    biz = default_business(user["id"], body.name.strip())
    await db.businesses.insert_one({**biz})
    return biz


@api_router.get("/businesses/{bid}")
async def get_business(bid: str, user: dict = Depends(get_current_user)):
    return await get_owned_business(bid, user)


@api_router.put("/businesses/{bid}")
async def update_business(bid: str, body: BusinessUpdate, user: dict = Depends(get_current_user)):
    await get_owned_business(bid, user)
    patch = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    if patch:
        patch["updated_at"] = now_iso()
        await db.businesses.update_one({"id": bid}, {"$set": patch})
    return await get_owned_business(bid, user)


@api_router.delete("/businesses/{bid}")
async def delete_business(bid: str, user: dict = Depends(get_current_user)):
    await get_owned_business(bid, user)
    await db.businesses.delete_one({"id": bid})
    await db.simulations.delete_many({"business_id": bid})
    return {"ok": True}


# ---------- Simulation routes ----------

@api_router.get("/businesses/{bid}/simulations")
async def list_simulations(bid: str, user: dict = Depends(get_current_user)):
    await get_owned_business(bid, user)
    return await db.simulations.find({"business_id": bid}, {"_id": 0}).sort("created_at", -1).to_list(200)


@api_router.post("/businesses/{bid}/simulations")
async def create_simulation(bid: str, body: SimulationCreate, user: dict = Depends(get_current_user)):
    await get_owned_business(bid, user)
    sim = {
        "id": str(uuid.uuid4()),
        "business_id": bid,
        "user_id": user["id"],
        "name": body.name.strip(),
        "offers": body.offers,
        "created_at": now_iso(),
    }
    await db.simulations.insert_one({**sim})
    return sim


@api_router.put("/simulations/{sid}")
async def update_simulation(sid: str, body: SimulationUpdate, user: dict = Depends(get_current_user)):
    sim = await db.simulations.find_one({"id": sid, "user_id": user["id"]}, {"_id": 0})
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")
    patch = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    if patch:
        await db.simulations.update_one({"id": sid}, {"$set": patch})
    updated = await db.simulations.find_one({"id": sid}, {"_id": 0})
    return updated


@api_router.delete("/simulations/{sid}")
async def delete_simulation(sid: str, user: dict = Depends(get_current_user)):
    result = await db.simulations.delete_one({"id": sid, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return {"ok": True}


@api_router.get("/")
async def root():
    return {"message": "Margin API is running"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.businesses.create_index([("user_id", 1), ("created_at", 1)])
    await db.simulations.create_index("business_id")
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@margin.app")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin123!")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "name": "Admin",
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "created_at": now_iso(),
        })
        logger.info("Admin user seeded")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password updated")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
