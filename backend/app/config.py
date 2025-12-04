import os


def _split_env_list(value: str) -> list[str]:
	return [v.strip() for v in value.split(",") if v.strip()] if value else []


# Core security / auth settings
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# CORS origins (comma separated). Defaults to local dev ports for Vite and any future preview port.
_default_origins = ["http://localhost:5173", "http://localhost:5174","http://142.93.208.27:5174","https://142.93.208.27:5173","https://142.93.208.27","https://saireddy.dev","https://taksari.me","https://bank.vigneshreddy.tech","http://localhost:3000"]
_env_origins_raw = os.getenv("CORS_ORIGINS", ",".join(_default_origins))
CORS_ORIGINS = _split_env_list(_env_origins_raw)

# Whether to allow all origins in development if explicitly set.
ALLOW_ALL_ORIGINS = os.getenv("ALLOW_ALL_ORIGINS", "false").lower() == "true"

def get_cors_origins() -> list[str]:
	if ALLOW_ALL_ORIGINS:
		return ["*"]
	return CORS_ORIGINS



