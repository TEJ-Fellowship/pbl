package middleware

import (
	"bytes"
	"io"
	"log"
	"net/http"
)

// RequestLogger logs all incoming requests and their payloads
func RequestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Log request method and path
		log.Printf("[REQUEST] %s %s", r.Method, r.URL.Path)

		// For POST/PUT/PATCH requests, log the payload
		if r.Method == "POST" || r.Method == "PUT" || r.Method == "PATCH" {
			// Read the body
			body, err := io.ReadAll(r.Body)
			if err == nil && len(body) > 0 {
				log.Printf("[PAYLOAD] %s", string(body))
				// Restore the body so the handler can read it
				r.Body = io.NopCloser(bytes.NewBuffer(body))
			}
		}

		// Log URL parameters for GET/DELETE requests
		if r.Method == "GET" || r.Method == "DELETE" {
			if r.URL.RawQuery != "" {
				log.Printf("[QUERY] %s", r.URL.RawQuery)
			}
		}

		// Call the next handler
		next.ServeHTTP(w, r)
	})
}
