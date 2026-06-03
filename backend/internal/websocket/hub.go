package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // TODO: lock down to known origins in production
	},
}

type Hub struct {
	clients    map[string]map[*Client]bool // room -> clients
	register   chan *Client
	unregister chan *Client
	broadcast  chan BroadcastMsg
	mu         sync.RWMutex
}

type BroadcastMsg struct {
	Room  string
	Data  interface{}
}

type Client struct {
	ID     string
	Room   string
	UserID string
	Conn   *websocket.Conn
	Send   chan []byte
	Hub    *Hub
}

type Envelope struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
	TS      int64       `json:"ts"`
}

var GlobalHub = NewHub()

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan BroadcastMsg, 256),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case c := <-h.register:
			h.mu.Lock()
			if _, ok := h.clients[c.Room]; !ok {
				h.clients[c.Room] = make(map[*Client]bool)
			}
			h.clients[c.Room][c] = true
			h.mu.Unlock()
			log.Printf("WS +client room=%s id=%s", c.Room, c.ID)
		case c := <-h.unregister:
			h.mu.Lock()
			if room, ok := h.clients[c.Room]; ok {
				if _, ok := room[c]; ok {
					delete(room, c)
					close(c.Send)
				}
			}
			h.mu.Unlock()
			log.Printf("WS -client room=%s id=%s", c.Room, c.ID)
		case msg := <-h.broadcast:
			data, _ := json.Marshal(msg.Data)
			h.mu.RLock()
			for c := range h.clients[msg.Room] {
				select {
				case c.Send <- data:
				default:
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) EmitSeatLocked(room, scheduleID, seatID, userID string) {
	h.broadcast <- BroadcastMsg{
		Room: "schedule:" + room,
		Data: Envelope{
			Type: "seat.locked",
			Payload: map[string]string{
				"schedule_id": scheduleID,
				"seat_id":     seatID,
				"user_id":     userID,
			},
			TS: time.Now().Unix(),
		},
	}
}

func (h *Hub) EmitSeatReleased(room, scheduleID, seatID string) {
	h.broadcast <- BroadcastMsg{
		Room: "schedule:" + room,
		Data: Envelope{
			Type: "seat.released",
			Payload: map[string]string{
				"schedule_id": scheduleID,
				"seat_id":     seatID,
			},
			TS: time.Now().Unix(),
		},
	}
}

func (h *Hub) EmitGPS(room string, lat, lng float64) {
	h.broadcast <- BroadcastMsg{
		Room: "track:" + room,
		Data: Envelope{
			Type: "bus.gps",
			Payload: map[string]float64{
				"lat": lat,
				"lng": lng,
			},
			TS: time.Now().Unix(),
		},
	}
}

// EmitConciergeAlert pushes a new alert to the user's personal concierge room.
func (h *Hub) EmitConciergeAlert(userID, alertType, title, body string) {
	h.broadcast <- BroadcastMsg{
		Room: "concierge:" + userID,
		Data: Envelope{
			Type: "concierge.alert",
			Payload: map[string]string{
				"alert_type": alertType,
				"title":      title,
				"body":       body,
			},
			TS: time.Now().Unix(),
		},
	}
}

func (c *Client) readPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()
	for {
		_, msg, err := c.Conn.ReadMessage()
		if err != nil {
			return
		}
		// Echo pings and handle client messages if needed
		_ = msg
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()
	for {
		select {
		case msg, ok := <-c.Send:
			if !ok {
				_ = c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.Conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		case <-ticker.C:
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// HandleWS upgrades the HTTP request to a WebSocket. The client supplies
// `?room=schedule:UUID` or `?room=track:BUS_ID`.
func HandleWS(hub *Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		room := r.URL.Query().Get("room")
		if room == "" {
			http.Error(w, "room query param required", http.StatusBadRequest)
			return
		}
		userID := r.URL.Query().Get("user_id")

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("WS upgrade failed: %v", err)
			return
		}

		client := &Client{
			ID:     uuid.NewString(),
			Room:   room,
			UserID: userID,
			Conn:   conn,
			Send:   make(chan []byte, 64),
			Hub:    hub,
		}
		hub.register <- client

		go client.writePump()
		go client.readPump()
	}
}
