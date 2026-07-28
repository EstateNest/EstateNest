# n8n Automation - EstateNest CRM

## Overview

n8n handles backend automation for:
- Email notifications (Gmail)
- Calendar sync (Google Calendar)
- Google Contacts sync
- Marblism integration

## Architecture

```
EstateNest.ca
      ↓
Supabase CRM
      ↓
    n8n
      ↓
┌─────┴─────┬───────────┬──────────┐
↓           ↓          ↓          ↓
Gmail    Calendar   Contacts   Marblism
```

## n8n Setup

### 1. Install n8n

```bash
# Docker
docker run -d --name n8n -p 5678:5678 n8nio/n8n

# Or npm
npm install -g n8n
n8n
```

Access at: http://localhost:5678

### 2. Create Workflows

#### Workflow 1: New Lead Notification Email

**Trigger:** Webhook from CRM
**URL:** `https://your-n8n.com/webhook/estatenest-lead`

```javascript
// Node: CRM Webhook Trigger
{
  "trigger": "webhook",
  "path": "estatenest-lead",
  "method": "POST"
}
```

```javascript
// Node: Send Gmail
{
  "node": "Gmail",
  "operation": "send",
  "to": "hello@estatenest.ca",
  "subject": "🎉 New Lead: {{ $json.contact_name }}",
  "body": `
    <h2>New Lead from {{ $json.source }}</h2>
    <p><strong>Name:</strong> {{ $json.contact_name }}</p>
    <p><strong>Email:</strong> {{ $json.email }}</p>
    <p><strong>Phone:</strong> {{ $json.phone }}</p>
    <p><strong>Province:</strong> {{ $json.province }}</p>
    <p><strong>Interest:</strong> {{ $json.insurance_interest }}</p>
  `
}
```

#### Workflow 2: Follow-up Task Creation

```javascript
// Trigger: Scheduled (every hour)
{
  "trigger": "schedule",
  "cron": "0 * * * *"
}

// Node: Query Leads Needing Follow-up
{
  "node": "Supabase",
  "operation": "select",
  "table": "leads",
  "filters": {
    "next_follow_up_at": {
      "_lt": "now()",
      "_is_null": false
    },
    "lead_status": {
      "_nin": ["NOT_TAKEN", "LOST"]
    }
  }
}

// Node: Create Google Calendar Event
{
  "node": "Google Calendar",
  "operation": "create",
  "calendar": "primary",
  "summary": "Follow-up: {{ $json.contact_name }}",
  "start": "{{ $json.next_follow_up_at }}",
  "end": "{{ $json.next_follow_up_at | addHours:1 }}",
  "description": "Follow up with lead for {{ $json.insurance_interest }}"
}
```

#### Workflow 3: Add Lead to Google Contacts

```javascript
// Trigger: CRM Webhook
{
  "trigger": "webhook",
  "path": "estatenest-new-contact"
}

// Node: Create Google Contact
{
  "node": "Google Contacts",
  "operation": "create",
  "firstName": "{{ $json.first_name }}",
  "lastName": "{{ $json.last_name }}",
  "emails": ["{{ $json.email }}"],
  "phones": ["{{ $json.phone }}"],
  "addresses": ["{{ $json.province }}, Canada"],
  "note": "Insurance Interest: {{ $json.insurance_interest }}"
}
```

#### Workflow 4: Marblism Lead Sync

```javascript
// Trigger: Marblism Webhook
{
  "trigger": "webhook",
  "path": "marblism-lead"
}

// Transform: Map Marblism to CRM format
{
  "node": "Code",
  "js": `
    const data = $input.first().json;
    return [{
      json: {
        first_name: data.name.split(' ')[0],
        last_name: data.name.split(' ').slice(1).join(' '),
        email: data.email,
        phone: data.phone,
        province: data.province || 'AB',
        insurance_interest: 'OTHER',
        source: 'MARBLISM',
        marketing_consent: true,
      }
    }];
  `
}

// Insert to Supabase
{
  "node": "Supabase",
  "operation": "insert",
  "table": "contacts"
}
```

#### Workflow 5: Daily Lead Report

```javascript
// Trigger: Daily at 8 AM
{
  "trigger": "schedule",
  "cron": "0 8 * * *"
}

// Node: Query New Leads (Last 24h)
{
  "node": "Supabase",
  "operation": "select",
  "table": "leads",
  "filters": {
    "created_at": {
      "_gt": "now() | addDays:-1"
    }
  }
}

// Node: Aggregate Stats
{
  "node": "Code",
  "js": `
    const leads = $input.all().map(n => n.json);
    return [{
      json: {
        total_leads: leads.length,
        by_source: {},
        by_interest: {},
        top_provinces: {}
      }
    }];
  `
}

// Node: Send Report Email
{
  "node": "Gmail",
  "operation": "send",
  "to": "kanwar@estatenest.ca",
  "subject": "📊 Daily Lead Report - Estate Nest",
  "body": "..."
}
```

## Webhook URLs for CRM

Add these to your CRM configuration:

```javascript
// In api/v1/webhooks.ts
const WEBHOOKS = {
  n8n: {
    leadCreated: 'https://your-n8n.com/webhook/estatenest-lead',
    contactCreated: 'https://your-n8n.com/webhook/estatenest-new-contact',
    leadUpdated: 'https://your-n8n.com/webhook/estatenest-lead-update',
  },
  marblism: {
    leadCreated: 'https://your-marblism-url.com/webhook',
  }
};
```

## Environment Variables

Create `n8n/.env`:
```bash
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your_secure_password

# Supabase
SUPABASE_URL=https://gjstfkgvytbvkewvzbla.supabase.co
SUPABASE_KEY=eyJhbGci...

# Google OAuth
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# Gmail
GMAIL_USER=hello@estatenest.ca
GMAIL_APP_PASSWORD=cbso jprl fihq pybn
```

## Testing

### Test Workflows

```bash
# Test lead notification
curl -X POST https://your-n8n.com/webhook/estatenest-lead \
  -H "Content-Type: application/json" \
  -d '{
    "contact_name": "Test User",
    "email": "test@example.com",
    "phone": "780-555-1234",
    "province": "AB",
    "insurance_interest": "TERM_LIFE",
    "source": "TEST"
  }'
```

## Monitoring

- n8n UI: http://localhost:5678
- View execution history
- Debug failed runs
- Set up Slack/Email alerts for failures
