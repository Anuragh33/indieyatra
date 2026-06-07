package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/anuragh/indieyatra/backend/internal/db"
	"github.com/anuragh/indieyatra/backend/internal/models"
	"github.com/clerk/clerk-sdk-go/v2"
	clerkjwt "github.com/clerk/clerk-sdk-go/v2/jwt"
	clerkuser "github.com/clerk/clerk-sdk-go/v2/user"
)

var clerkInitOnce sync.Once

func InitClerk(secretKey string) {
	clerkInitOnce.Do(func() {
		clerk.SetKey(secretKey)
		log.Println("✓ Clerk SDK initialised")
	})
}

// VerifyClerkToken verifies a Clerk session token and returns the Clerk user ID.
func VerifyClerkToken(ctx context.Context, tokenStr string) (clerkUserID string, err error) {
	claims, err := clerkjwt.Verify(ctx, &clerkjwt.VerifyParams{Token: tokenStr})
	if err != nil {
		return "", err
	}
	return claims.Subject, nil
}

// FindOrCreateByClerkID looks up the local user by Clerk ID, creating one on first sign-in.
func FindOrCreateByClerkID(ctx context.Context, clerkUserID string) (*models.User, error) {
	var u models.User
	if err := db.DB.Where("clerk_id = ?", clerkUserID).First(&u).Error; err == nil {
		return &u, nil
	}

	// First sign-in — fetch details from Clerk API
	cu, err := clerkuser.Get(ctx, clerkUserID)
	if err != nil {
		return nil, fmt.Errorf("clerk user fetch: %w", err)
	}

	email := ""
	if len(cu.EmailAddresses) > 0 {
		email = cu.EmailAddresses[0].EmailAddress
	}
	fullName := ""
	if cu.FirstName != nil {
		fullName = *cu.FirstName
	}
	if cu.LastName != nil {
		if fullName != "" {
			fullName += " "
		}
		fullName += *cu.LastName
	}
	avatarURL := ""
	if cu.ImageURL != nil {
		avatarURL = *cu.ImageURL
	}

	// Upsert by email to avoid duplicates when user previously registered manually
	var existing models.User
	if email != "" {
		if err := db.DB.Where("email = ?", email).First(&existing).Error; err == nil {
			// Link existing record to Clerk
			db.DB.Model(&existing).Updates(map[string]interface{}{
				"clerk_id":       clerkUserID,
				"email_verified": true,
				"avatar_url":     avatarURL,
			})
			existing.ClerkID = clerkUserID
			return &existing, nil
		}
	}

	newUser := models.User{
		ClerkID:       clerkUserID,
		Email:         email,
		FullName:      fullName,
		AvatarURL:     avatarURL,
		EmailVerified: true,
	}
	if err := db.DB.Create(&newUser).Error; err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}
	return &newUser, nil
}

// clerkUserInfo is used only for the lightweight JWKS-less path (unused when SDK available).
type clerkUserInfo struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}

func fetchClerkUser(secretKey, clerkUserID string) (*clerkUserInfo, error) {
	req, _ := http.NewRequest(http.MethodGet,
		"https://api.clerk.com/v1/users/"+clerkUserID, nil)
	req.Header.Set("Authorization", "Bearer "+secretKey)
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	var info clerkUserInfo
	if err := json.Unmarshal(body, &info); err != nil {
		return nil, err
	}
	return &info, nil
}
