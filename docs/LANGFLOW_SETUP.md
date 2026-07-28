# Langflow Integration - EstateNest CRM

## Overview

Langflow provides visual AI workflows for lead processing. Here's how it integrates with EstateNest:

```
NEW WEBSITE LEAD
       ↓
   Supabase CRM
       ↓
    Langflow
       ↓
Classify lead type
       ↓
Score lead (1-100)
       ↓
Determine urgency
       ↓
Generate summary
       ↓
Create tasks
```

## Langflow Setup

### 1. Install Langflow

```bash
pip install langflow
langflow
```

Or use Docker:
```bash
docker run -p 7860:7860 -v ~/.langflow:/app/langflow langflowai/langflow
```

### 2. Create Lead Processing Flow

#### Flow Name: `lead-intake-processor`

**Components:**
1. **Webhook Trigger** - Receives lead from CRM API
2. **LLM Component** - Classifies lead type
3. **Scoring Component** - Calculates lead score
4. **Task Generator** - Creates follow-up tasks
5. **Webhook Response** - Returns to CRM

#### Prompt for Lead Classification:
```
You are an insurance lead classifier. Analyze the following lead:

Name: {name}
Province: {province}
Interest: {insurance_interest}
Source: {source}

Classify into:
- HOT: Immediate call needed (high value, urgent need)
- WARM: Follow up within 24 hours
- COLD: Standard nurture sequence

Also provide:
1. Urgency score (1-10)
2. Suggested action
3. Best contact time
```

### 3. Flow JSON (Import into Langflow)

```json
{
  "nodes": [
    {
      "id": "webhook-trigger",
      "type": "WebhookTrigger",
      "data": {
        "webhook_url": "/api/webhooks/langflow/lead"
      }
    },
    {
      "id": "classify-lead",
      "type": "LLMChain",
      "data": {
        "prompt": "Classify this lead as HOT/WARM/COLD and provide urgency score"
      }
    },
    {
      "id": "score-lead",
      "type": "Calculator",
      "data": {
        "formula": "base_score + province_bonus + interest_bonus"
      }
    },
    {
      "id": "create-task",
      "type": "Webhook",
      "data": {
        "url": "{SUPABASE_URL}/rest/v1/tasks"
      }
    }
  ],
  "edges": [
    {"source": "webhook-trigger", "target": "classify-lead"},
    {"source": "classify-lead", "target": "score-lead"},
    {"source": "score-lead", "target": "create-task"}
  ]
}
```

### 4. Environment Variables

Create `.env` for Langflow:
```bash
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://gjstfkgvytbvkewvzbla.supabase.co
SUPABASE_KEY=eyJhbGci...
```

## CRM Integration

### Update Lead Webhook

Modify `api/v1/webhooks.ts` to send to Langflow:

```typescript
// After creating lead in Supabase
await fetch('http://localhost:7860/api/v1/flows/trigger/lead-intake-processor', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    lead_id: lead.id,
    contact_name: `${contact.first_name} ${contact.last_name}`,
    email: contact.email,
    phone: contact.phone,
    province: contact.province,
    insurance_interest: lead.insurance_interest,
    source: lead.source,
  }),
});
```

## Missed Call Flow

```
Missed Call → Voicemail Transcription
       ↓
    Langflow
       ↓
Extract: Name, Phone, Province, Insurance Need, Urgency
       ↓
Create CRM Lead
       ↓
Generate Summary
       ↓
Create Follow-up Task
```

### Voicemail Processing Flow

```json
{
  "nodes": [
    {
      "id": "voicemail-trigger",
      "type": "Webhook",
      "data": { "event": "missed_call" }
    },
    {
      "id": "transcribe",
      "type": "Whisper",
      "data": { "model": "whisper-1" }
    },
    {
      "id": "extract-info",
      "type": "LLMChain",
      "data": {
        "prompt": "Extract from voicemail: caller_name, phone_number, province, insurance_need, urgency (1-10)"
      }
    },
    {
      "id": "create-lead",
      "type": "Supabase",
      "data": {
        "table": "leads",
        "operation": "insert"
      }
    }
  ]
}
```

## Testing

### Test the Flow

```bash
curl -X POST http://localhost:7860/api/v1/flows/trigger/lead-intake-processor \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": "test-123",
    "contact_name": "John Smith",
    "email": "john@example.com",
    "province": "AB",
    "insurance_interest": "TERM_LIFE",
    "source": "ORGANIC_SEARCH"
  }'
```

## Monitoring

- Langflow UI: http://localhost:7860
- View flow runs and logs
- Debug failed executions
