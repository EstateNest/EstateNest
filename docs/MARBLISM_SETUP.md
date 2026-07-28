# Marblism Integration - EstateNest CRM

## Overview

Marblism generates leads through AI agents. Connect it to EstateNest for automatic lead capture.

## Architecture

```
Marblism AI Agent
       ↓
   Webhook POST
       ↓
EstateNest API
       ↓
   Supabase CRM
```

## Marblism Setup

### 1. Create Webhook in Marblism

1. Log into Marblism (https://app.marblism.com)
2. Go to your agent settings
3. Navigate to **Webhooks**
4. Click **Add Webhook**

### 2. Configure Webhook

```
URL: https://www.estatenest.ca/api/webhooks/marblism
Method: POST
Events: lead.created, prospect.generated
Authentication: Optional (recommended)
```

### 3. Webhook Payload Format

Marblism sends this when a lead is created:

```json
{
  "event": "lead.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "prospect": {
    "id": "prospect_abc123",
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "+1-780-555-1234",
    "source": "chatbot",
    "score": 85,
    "metadata": {
      "province": "AB",
      "insurance_interest": "TERM_LIFE",
      "chat_transcript": "..."
    }
  }
}
```

## CRM Endpoint

The `api/v1/webhooks.ts` already handles Marblism:

```typescript
// POST /api/webhooks/marblism
// Handles: lead.created, prospect.generated
```

### Expected Fields Mapping

| Marblism Field | CRM Field | Required |
|----------------|-----------|----------|
| prospect.name | contact.first_name + last_name | Yes |
| prospect.email | contact.email | Recommended |
| prospect.phone | contact.phone | Recommended |
| prospect.metadata.province | contact.province | No |
| prospect.metadata.insurance_interest | lead.insurance_interest | Yes |
| prospect.score | lead.lead_score | No |

## Testing

### Test Webhook

```bash
curl -X POST https://www.estatenest.ca/api/webhooks/marblism \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: test-signature" \
  -d '{
    "event": "lead.created",
    "timestamp": "2024-01-15T10:30:00Z",
    "prospect": {
      "id": "test_123",
      "name": "Test User",
      "email": "test@example.com",
      "phone": "780-555-9999",
      "source": "test",
      "score": 75,
      "metadata": {
        "province": "AB",
        "insurance_interest": "TERM_LIFE"
      }
    }
  }'
```

### Verify in Supabase

```bash
# Check contacts
curl "https://gjstfkgvytbvkewvzbla.supabase.co/rest/v1/contacts?email=eq.test@example.com" \
  -H "apikey: YOUR_ANON_KEY"

# Check leads
curl "https://gjstfkgvytbvkewvzbla.supabase.co/rest/v1/leads?source=eq.MARBLISM" \
  -H "apikey: YOUR_ANON_KEY"
```

## Marblism Agent Configuration

### Lead Collection Prompts

Configure your Marblism agent to collect:

```
Required Information:
1. Full Name
2. Email Address
3. Phone Number
4. Province (Alberta or Ontario)
5. Type of Insurance Interest

Optional Information:
- Best time to call
- Current coverage details
- Specific questions
```

### Consent Prompt

```
By providing your information, you consent to Estate Nest Inc. contacting you 
about insurance products and services. Your information will be handled 
according to our privacy policy.
```

## Error Handling

### If webhook fails:

1. Marblism retries up to 3 times
2. Failed webhooks appear in Marblism's "Failed" tab
3. Manual retry available

### If CRM is down:

1. n8n can act as intermediary
2. Marblism → n8n → Supabase (direct insert)
3. Maintains lead data during outages

## Production Checklist

- [ ] Webhook URL verified in Marblism
- [ ] Test lead created and verified in CRM
- [ ] Email notifications working
- [ ] Lead source shows "MARBLISM"
- [ ] Lead score populated (if sent by Marblism)
