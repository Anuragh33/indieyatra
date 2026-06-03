package auth

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
)

const (
	UserIDKey = "user_id"
	EmailKey  = "email"
)

func Middleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error": "missing authorization header",
				})
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || parts[0] != "Bearer" {
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error": "invalid authorization header format",
				})
			}
			tokenStr := parts[1]

			// Try Clerk token first
			if clerkUserID, err := VerifyClerkToken(c.Request().Context(), tokenStr); err == nil {
				user, err := FindOrCreateByClerkID(c.Request().Context(), clerkUserID)
				if err != nil {
					return c.JSON(http.StatusUnauthorized, map[string]string{"error": "user lookup failed"})
				}
				c.Set(UserIDKey, user.ID.String())
				c.Set(EmailKey, user.Email)
				return next(c)
			}

			// Fall back to legacy JWT
			claims, err := ParseToken(tokenStr)
			if err != nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error": "invalid or expired token",
				})
			}

			c.Set(UserIDKey, claims.UserID)
			c.Set(EmailKey, claims.Email)
			return next(c)
		}
	}
}

func Optional() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader != "" {
				parts := strings.SplitN(authHeader, " ", 2)
				if len(parts) == 2 && parts[0] == "Bearer" {
					tokenStr := parts[1]
					if clerkUserID, err := VerifyClerkToken(c.Request().Context(), tokenStr); err == nil {
						if user, err := FindOrCreateByClerkID(c.Request().Context(), clerkUserID); err == nil {
							c.Set(UserIDKey, user.ID.String())
							c.Set(EmailKey, user.Email)
						}
					} else if claims, err := ParseToken(tokenStr); err == nil {
						c.Set(UserIDKey, claims.UserID)
						c.Set(EmailKey, claims.Email)
					}
				}
			}
			return next(c)
		}
	}
}

func GetUserID(c echo.Context) string {
	id, _ := c.Get(UserIDKey).(string)
	return id
}
