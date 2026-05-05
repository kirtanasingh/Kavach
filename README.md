# Kavach — VLM Based Biosecurity Portal

Kavach is a full-stack, AI-powered livestock health monitoring system that connects farm owners, veterinarians, and regulatory authorities into a unified digital ecosystem.

It enables real-time disease detection, structured veterinary review, and compliance monitoring, helping reduce detection latency and improve farm biosecurity.

---

## Key Features

- AI-powered disease detection  
  - Hybrid pipeline using EfficientNet-B2 (ML) + Groq VLM  
  - Image-based multi-species classification (cattle, pig, poultry)

- Explainable AI (VLM integration)  
  - Clinical explanations  
  - Actionable recommendations  

- Veterinary review workflow  
  - Case escalation system  
  - Structured adjudication (safe / not_safe / other)

- Authority analytics dashboard  
  - Disease trends  
  - Compliance monitoring  
  - Contact tracing insights  

- Farm management tools  
  - Animal tracking  
  - Treatment logs  
  - AMU tracking  
  - Withdrawal monitoring  

---

## Tech Stack

| Layer     | Technology |
|----------|-----------|
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Backend  | FastAPI (Python 3.11+, async) |
| Database | PostgreSQL 15+ |
| Cache    | Redis |
| AI / ML  | EfficientNet-B2 + Groq VLM |
| Auth     | JWT (Access + Refresh Tokens) |

---

## User Roles

### Farm Owner
- Upload disease scans  
- View detection history  
- Manage animals, treatments, and tasks  
- Track withdrawal periods  

### Veterinarian
- Review AI detections  
- Annotate cases  
- Manage prescriptions and logs  
- Maintain AMU records  

### Authority
- Monitor outbreaks  
- View analytics dashboards  
- Access contact tracing network  
- Generate reports  

---

## Detection Lifecycle
<img width="584" height="660" alt="image" src="https://github.com/user-attachments/assets/8c507a27-cc6e-4826-b0e4-69dd8010dc9f" />

- Status stored in: `detection_records.review_status`
- Ensures traceability and accountability

---

## AI Pipeline Overview

### Stage 1: ML Classifier
- EfficientNet-B2 predicts:
  - Top 3 diseases
  - Confidence scores  

### Stage 2: VLM Reasoning
- Groq VLM generates:
  - Clinical explanation  
  - Severity level  
  - Recommendations  

## Core API Endpoints

| Endpoint | Method | Description |
|----------|--------|------------|
| `/api/v1/scan/analyze` | POST | Submit image for detection |
| `/api/v1/detections/` | GET | Fetch detection history |
| `/api/v1/detections/{id}/review` | POST | Vet review submission |
| `/api/v1/alerts/` | GET/POST | Manage alerts |
| `/api/v1/ml/classify` | POST | ML-only inference |

---

## Detection Status Logic

- `pending_review` → default after scan  
- `safe` → no issue detected  
- `not_safe` → disease detected  
- `other` → uncertain / requires observation  

---

## System Architecture

<img width="535" height="424" alt="image" src="https://github.com/user-attachments/assets/c7dc0f28-0819-42fc-ac34-7496784362cf" />

---

## Why Kavach

- Multi-species disease detection  
- Explainable AI (VLM)  
- Role-based workflows  
- Veterinary validation layer  
- Authority analytics  
- Compliance and AMU tracking  

---

## Future Scope

- Mobile application (React Native / Flutter)  
- Regional language support  
- Expanded disease dataset  
- IoT-based animal monitoring  
- Production-grade authentication  
- Federated learning  

---

## Output

<img width="577" height="366" alt="image" src="https://github.com/user-attachments/assets/c2023431-6900-4b55-8f7f-405436c4e7b3" />

<img width="990" height="659" alt="image" src="https://github.com/user-attachments/assets/6e4e1760-af73-4df1-8c82-17a102ba535a" />

<img width="461" height="311" alt="image" src="https://github.com/user-attachments/assets/8c5ca7bc-42fd-4329-9b4a-58fffb55f2ad" />

<img width="1003" height="659" alt="image" src="https://github.com/user-attachments/assets/dc420aca-033d-40cc-895a-e4f268caffb4" />

<img width="1376" height="623" alt="image" src="https://github.com/user-attachments/assets/b80da496-382d-410a-98e1-3eac0d7fcefd" />

<img width="1287" height="555" alt="image" src="https://github.com/user-attachments/assets/efb8c10a-0756-4e68-bcd6-d528b97cfbe4" />

---

## Sample API Response

```json
{
  "disease": "cattle_fmd",
  "confidence": 0.87,
  "severity": "high",
  "top_predictions": [
    {"class": "cattle_fmd", "confidence": 0.87},
    {"class": "cattle_lumpy", "confidence": 0.09},
    {"class": "cattle_healthy", "confidence": 0.04}
  ],
  "recommendation": "Immediate isolation advised. Contact veterinarian within 24 hours.",
  "triage_status": "escalated"
}
---
