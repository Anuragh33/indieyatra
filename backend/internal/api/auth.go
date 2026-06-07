package api

import (
	"context"
	"net/http"
	"strings"

	"github.com/anuragh/indieyatra/backend/internal/auth"
	"github.com/anuragh/indieyatra/backend/internal/db"
	"github.com/anuragh/indieyatra/backend/internal/models"
	"github.com/labstack/echo/v4"
	"golang.org/x/oauth2"
	"gorm.io/gorm"
)

type RegisterRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
	FullName string `json:"full_name" validate:"required"`
	Phone    string `json:"phone"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type AuthResponse struct {
	Token string       `json:"token"`
	User  *models.User `json:"user"`
}

func (h *Handlers) Register(c echo.Context) error {
	var req RegisterRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	var existing models.User
	if err := db.DB.Where("email = ?", req.Email).First(&existing).Error; err == nil {
		return c.JSON(http.StatusConflict, map[string]string{"error": "email already registered"})
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "hash failed"})
	}

	user := models.User{
		Email:        req.Email,
		PasswordHash: hash,
		FullName:     req.FullName,
		Phone:        req.Phone,
		RewardPoints: 500, // welcome bonus
	}
	if err := db.DB.Create(&user).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "create failed"})
	}

	token, err := auth.GenerateToken(user.ID.String(), user.Email)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "token failed"})
	}
	_ = db.SetSession(context.Background(), user.ID.String(), token)

	return c.JSON(http.StatusCreated, AuthResponse{Token: token, User: &user})
}

func (h *Handlers) Login(c echo.Context) error {
	var req LoginRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	var user models.User
	if err := db.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "lookup failed"})
	}

	if !auth.CheckPassword(user.PasswordHash, req.Password) {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
	}

	token, err := auth.GenerateToken(user.ID.String(), user.Email)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "token failed"})
	}
	_ = db.SetSession(context.Background(), user.ID.String(), token)

	return c.JSON(http.StatusOK, AuthResponse{Token: token, User: &user})
}

func (h *Handlers) GoogleLogin(c echo.Context) error {
	url := auth.GetGoogleOAuthConfig().AuthCodeURL("state-token", oauth2.AccessTypeOffline)
	return c.JSON(http.StatusOK, map[string]string{"url": url})
}

func (h *Handlers) GoogleCallback(c echo.Context) error {
	code := c.QueryParam("code")
	if code == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "missing code"})
	}

	info, err := auth.GetGoogleUserInfo(context.Background(), code)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	var user models.User
	if err := db.DB.Where("google_id = ?", info.ID).First(&user).Error; err != nil {
		// New user — create
		email := strings.ToLower(info.Email)
		if err := db.DB.Where("email = ?", email).First(&user).Error; err != nil {
			user = models.User{
				Email:         email,
				FullName:      info.Name,
				AvatarURL:     info.Picture,
				GoogleID:      info.ID,
				EmailVerified: info.VerifiedEmail,
				RewardPoints:  500,
			}
			if err := db.DB.Create(&user).Error; err != nil {
				return c.JSON(http.StatusInternalServerError, map[string]string{"error": "create failed"})
			}
		} else {
			user.GoogleID = info.ID
			user.AvatarURL = info.Picture
			db.DB.Save(&user)
		}
	}

	token, _ := auth.GenerateToken(user.ID.String(), user.Email)
	_ = db.SetSession(context.Background(), user.ID.String(), token)

	// Redirect to frontend with token in query (frontend will pick it up & stash in localStorage)
	return c.Redirect(http.StatusTemporaryRedirect, h.FrontendURL+"/auth/callback?token="+token)
}

func (h *Handlers) Me(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	var user models.User
	if err := db.DB.Where("id = ?", uid).First(&user).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "user not found"})
	}
	return c.JSON(http.StatusOK, user)
}

func (h *Handlers) Logout(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid != "" {
		db.RDB.Del(context.Background(), "session:"+uid)
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "logged out"})
}

func (h *Handlers) ChangePassword(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	var body struct {
		CurrentPassword string `json:"current_password"`
		NewPassword     string `json:"new_password"`
	}
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}
	if len(body.NewPassword) < 8 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "password must be at least 8 characters"})
	}
	var user models.User
	if err := db.DB.Where("id = ?", uid).First(&user).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "user not found"})
	}
	if user.PasswordHash != "" && !auth.CheckPassword(user.PasswordHash, body.CurrentPassword) {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "current password is incorrect"})
	}
	hash, err := auth.HashPassword(body.NewPassword)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "hash failed"})
	}
	db.DB.Model(&user).Update("password_hash", hash)
	return c.JSON(http.StatusOK, map[string]string{"message": "password updated"})
}

func (h *Handlers) RefreshToken(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	var user models.User
	if err := db.DB.Where("id = ?", uid).First(&user).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "user not found"})
	}
	token, err := auth.GenerateToken(user.ID.String(), user.Email)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "token failed"})
	}
	return c.JSON(http.StatusOK, map[string]string{"token": token})
}
