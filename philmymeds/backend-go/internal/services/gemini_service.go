package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/dto"
)

// GeminiService handles interactions with Google Gemini API
type GeminiService struct {
	apiKey  string
	baseURL string
	model   string
	client  *http.Client
}

// NewGeminiService creates a new Gemini service
func NewGeminiService() *GeminiService {
	apiKey := os.Getenv("GEMINI_API_KEY")
	model := os.Getenv("GEMINI_MODEL")
	if model == "" {
		model = "gemini-2.0-flash" // Default model
	} else {
		log.Printf("[DEBUG] Using Gemini model from .env: %s", model)
	}

	return &GeminiService{
		apiKey:  apiKey,
		baseURL: "https://generativelanguage.googleapis.com/v1beta",
		model:   model,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// GeminiRequest represents the request payload for Gemini API
type GeminiRequest struct {
	Contents []GeminiContent `json:"contents"`
}

// GeminiContent represents a content block in Gemini request
type GeminiContent struct {
	Parts []GeminiPart `json:"parts"`
}

// GeminiPart represents a part of content (text)
type GeminiPart struct {
	Text string `json:"text"`
}

// GeminiResponse represents the response from Gemini API
type GeminiResponse struct {
	Candidates []GeminiCandidate `json:"candidates"`
}

// GeminiCandidate represents a candidate response
type GeminiCandidate struct {
	Content GeminiContent `json:"content"`
}

// GenerateMockPrescription generates a mock prescription in NCPDP SCRIPT format using Gemini API
func (s *GeminiService) GenerateMockPrescription(ctx context.Context) (*dto.CreatePrescriptionRequest, error) {
	log.Println("[DEBUG] Calling Gemini API...")

	if s.apiKey == "" {
		return nil, fmt.Errorf("gemini API key not configured")
	}

	// Create prompt for Gemini to generate NCPDP-formatted prescription
	prompt := s.buildPrescriptionPrompt()

	// Prepare request
	reqBody := GeminiRequest{
		Contents: []GeminiContent{
			{
				Parts: []GeminiPart{
					{Text: prompt},
				},
			},
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Make API call
	url := fmt.Sprintf("%s/models/%s:generateContent?key=%s", s.baseURL, s.model, s.apiKey)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		log.Printf("[ERROR] Gemini API request failed: %v", err)
		return nil, fmt.Errorf("failed to call Gemini API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("[ERROR] Gemini API error (status %d): %s", resp.StatusCode, string(body))
		return nil, fmt.Errorf("gemini API error (status %d): %s", resp.StatusCode, string(body))
	}

	// Parse response
	var geminiResp GeminiResponse
	if err := json.NewDecoder(resp.Body).Decode(&geminiResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if len(geminiResp.Candidates) == 0 {
		return nil, fmt.Errorf("no candidates in Gemini response")
	}

	// Extract JSON from Gemini's text response
	responseText := geminiResp.Candidates[0].Content.Parts[0].Text

	// Parse the JSON response into our CreatePrescriptionRequest
	prescriptionReq, err := s.parseGeminiResponse(responseText)
	if err != nil {
		log.Printf("[ERROR] Failed to parse Gemini response: %v", err)
		return nil, fmt.Errorf("failed to parse Gemini response: %w", err)
	}

	log.Println("[DEBUG] Gemini API response parsed successfully")
	return prescriptionReq, nil
}

// buildPrescriptionPrompt creates the prompt for Gemini to generate NCPDP-formatted prescription
func (s *GeminiService) buildPrescriptionPrompt() string {
	return `You are a healthcare system that generates mock prescriptions in NCPDP SCRIPT format for a learning project.

Generate a realistic mock prescription with the following requirements:

1. **Patient Information:**
   - First name, last name
   - Date of birth (YYYY-MM-DD format)
   - Sex (M/F/O/U)
   - Email (realistic format)
   - Phone number (US format)
   - Address (line1, city, state (2-letter), zip, country="US")

2. **Prescriber Information:**
   - First name, last name (e.g., "Dr. Alice Smith")
   - NPI (10-digit number)
   - DEA number (optional, format: AB1234567)
   - Clinic name
   - Clinic phone
   - Address (same format as patient)
   - Specialty (optional)

3. **Medication Information (NCPDP-compliant):**
   - NDC (National Drug Code, format: XXXXX-XXXX-XX)
   - Drug name (generic or brand)
   - Strength (e.g., "500 mg")
   - Dosage (e.g., "500mg")
   - Form (e.g., "capsule", "tablet", "injection")
   - Route (e.g., "oral", "subcutaneous")
   - SIG (directions, e.g., "Take 1 capsule by mouth 3 times daily")
   - Quantity (positive integer, e.g., 30)
   - Days supply (positive integer, e.g., 10)
   - Refills (0-5)
   - DAW (Dispense As Written code, 0-9)

4. **Insurance Information:**
   - Payer name (insurance company)
   - Member ID
   - Group number (optional)
   - BIN (6-digit number)
   - PCN (optional)
   - Plan type (e.g., "commercial", "medicare", "medicaid")

Return ONLY a valid JSON object matching this exact structure (use snake_case for field names):

{
  "patient": {
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "1980-01-15",
    "sex": "M",
    "email": "john.doe@example.com",
    "phone": "555-123-4567",
    "address": {
      "line1": "123 Main St",
      "line2": "",
      "city": "Springfield",
      "state": "IL",
      "zip": "62701",
      "country": "US"
    }
  },
  "prescriber": {
    "first_name": "Alice",
    "last_name": "Smith",
    "npi": "1234567890",
    "dea": "AB1234567",
    "clinic_name": "Springfield Medical Center",
    "clinic_phone": "555-987-6543",
    "address": {
      "line1": "456 Medical Blvd",
      "line2": "Suite 200",
      "city": "Springfield",
      "state": "IL",
      "zip": "62702",
      "country": "US"
    },
    "specialty": "Internal Medicine"
  },
  "medication": {
    "ndc": "12345-6789-01",
    "drug_name": "Amoxicillin",
    "strength": "500 mg",
    "dosage": "500mg",
    "form": "capsule",
    "route": "oral",
    "sig": "Take 1 capsule by mouth 3 times daily",
    "quantity": 30,
    "days_supply": 10,
    "refills": 2,
    "daw": 0
  },
  "insurance": {
    "payer_name": "HealthPlan Insurance",
    "member_id": "H123456789",
    "group_number": "G98765",
    "bin": "123456",
    "pcn": "PCN123",
    "plan_type": "commercial"
  },
  "notes": "Patient has no known allergies"
}

IMPORTANT:
- Use realistic but fictional data
- All required fields must be present
- NDC must be in format XXXXX-XXXX-XX
- NPI must be exactly 10 digits
- BIN must be exactly 6 digits
- Dates must be in YYYY-MM-DD format
- State codes must be 2 letters
- Return ONLY the JSON, no markdown, no code blocks`
}

// parseGeminiResponse extracts and parses JSON from Gemini's text response
func (s *GeminiService) parseGeminiResponse(responseText string) (*dto.CreatePrescriptionRequest, error) {
	// Try to extract JSON from markdown code blocks if present
	jsonText := responseText

	// Remove markdown code blocks if present
	if jsonStart := bytes.Index([]byte(responseText), []byte("```json")); jsonStart != -1 {
		jsonText = responseText[jsonStart+7:]
		if jsonEnd := bytes.Index([]byte(jsonText), []byte("```")); jsonEnd != -1 {
			jsonText = jsonText[:jsonEnd]
		}
	} else if jsonStart := bytes.Index([]byte(responseText), []byte("```")); jsonStart != -1 {
		jsonText = responseText[jsonStart+3:]
		if jsonEnd := bytes.Index([]byte(jsonText), []byte("```")); jsonEnd != -1 {
			jsonText = jsonText[:jsonEnd]
		}
	}

	// Find JSON object boundaries
	startIdx := strings.Index(jsonText, "{")
	if startIdx == -1 {
		return nil, fmt.Errorf("no JSON object found in response")
	}

	endIdx := strings.LastIndex(jsonText, "}")
	if endIdx == -1 || endIdx <= startIdx {
		return nil, fmt.Errorf("invalid JSON object in response")
	}

	jsonText = jsonText[startIdx : endIdx+1]

	// Parse JSON into CreatePrescriptionRequest
	var req dto.CreatePrescriptionRequest
	if err := json.Unmarshal([]byte(jsonText), &req); err != nil {
		return nil, fmt.Errorf("failed to unmarshal JSON: %w", err)
	}

	return &req, nil
}
