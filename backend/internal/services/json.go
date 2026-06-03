package services

import "encoding/json"

// marshalJSON is the single seam where the encoding/json dependency lives.
// Anything that needs to JSON-encode in this package goes through here.
func marshalJSON(v interface{}) ([]byte, error) {
	return json.Marshal(v)
}
