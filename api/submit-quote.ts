import type { VercelRequest, VercelResponse } from '@vercel/node';

interface QuoteFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  smokingHistory: string;
  medicalHistory: string;
  medicalCondition?: string;
  medicineName?: string;
  dosage?: string;
  insuranceAmount?: string;
  insuranceType: string;
  readyToProceed: string;
}

interface ValidationError {
  field: string;
  message: string;
}

function validateFormData(data: QuoteFormData): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required fields
  if (!data.firstName?.trim()) {
    errors.push({ field: 'firstName', message: 'First name is required' });
  }
  if (!data.lastName?.trim()) {
    errors.push({ field: 'lastName', message: 'Last name is required' });
  }
  if (!data.email?.trim()) {
    errors.push({ field: 'email', message: 'Email is required' });
  }
  if (!data.phone?.trim()) {
    errors.push({ field: 'phone', message: 'Phone is required' });
  }
  if (!data.insuranceType?.trim()) {
    errors.push({ field: 'insuranceType', message: 'Insurance type is required' });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.email && !emailRegex.test(data.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }

  // Phone format validation (10+ digits)
  const cleanPhone = data.phone?.replace(/\D/g, '') || '';
  if (cleanPhone.length < 10) {
    errors.push({ field: 'phone', message: 'Please enter a valid 10-digit phone number' });
  }

  return errors;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Please use POST to submit the form.'
    });
  }

  try {
    const data = req.body as QuoteFormData;
    
    // Validate input
    const validationErrors = validateFormData(data);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: validationErrors,
        message: 'Please correct the form errors'
      });
    }

    // Check for required API key
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('RESEND_API_KEY environment variable is not set');
      return res.status(503).json({
        success: false,
        message: 'Email service is not configured. Please contact us directly.'
      });
    }

    // Format the email content
    const timestamp = new Date().toLocaleString('en-CA', { 
      timeZone: 'America/Edmonton',
      dateStyle: 'full',
      timeStyle: 'long'
    });

    const cleanPhone = data.phone.replace(/\D/g, '');

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e3a5f, #2d5a87); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
    .field { margin-bottom: 12px; padding: 10px; background: white; border-radius: 4px; }
    .label { font-weight: bold; color: #1e3a5f; }
    .value { margin-top: 4px; }
    .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    .urgent { background: #fff3cd; padding: 10px; border-radius: 4px; border-left: 4px solid #ffc107; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin:0;">🏠 New Quote Request - Estate Nest</h2>
      <p style="margin:5px 0 0 0;">${timestamp} (Mountain Time)</p>
    </div>
    <div class="content">
      <div class="urgent">
        <strong>⚡ Action Required:</strong> New insurance inquiry - respond within 24 hours
      </div>
      
      <h3 style="margin-top:20px; color:#1e3a5f;">Customer Information</h3>
      <div class="field">
        <div class="label">Name</div>
        <div class="value">${data.firstName} ${data.lastName}</div>
      </div>
      <div class="field">
        <div class="label">Email</div>
        <div class="value"><a href="mailto:${data.email}">${data.email}</a></div>
      </div>
      <div class="field">
        <div class="label">Phone</div>
        <div class="value"><a href="tel:${cleanPhone}">${data.phone}</a></div>
      </div>

      <h3 style="margin-top:20px; color:#1e3a5f;">Insurance Details</h3>
      <div class="field">
        <div class="label">Type of Insurance</div>
        <div class="value">${data.insuranceType}</div>
      </div>
      <div class="field">
        <div class="label">Coverage Amount</div>
        <div class="value">${data.insuranceAmount || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="label">Ready to Proceed</div>
        <div class="value">${data.readyToProceed === 'yes' ? '✅ Yes - Ready to proceed' : '❓ Needs more information'}</div>
      </div>

      <h3 style="margin-top:20px; color:#1e3a5f;">Health Information</h3>
      <div class="field">
        <div class="label">Smoking History</div>
        <div class="value">${data.smokingHistory === 'yes' ? '🚬 Yes' : '❌ No'}</div>
      </div>
      <div class="field">
        <div class="label">Medical History</div>
        <div class="value">${data.medicalHistory === 'yes' ? '⚠️ Has medical conditions' : '✅ No medical conditions'}</div>
      </div>
      ${data.medicalHistory === 'yes' ? `
      <div class="field">
        <div class="label">Medical Condition</div>
        <div class="value">${data.medicalCondition || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="label">Medicine</div>
        <div class="value">${data.medicineName || 'Not specified'} ${data.dosage ? `(${data.dosage})` : ''}</div>
      </div>
      ` : ''}

      <div class="footer">
        <p><strong>Source:</strong> estatenest.ca/quote</p>
        <p><strong>IP Address:</strong> Received via secure serverless function</p>
        <p style="margin-top:10px;">This email was automatically generated from the Estate Nest website quote request form.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

    // Prepare recipients
    const recipients = [
      'hello@estatenest.ca',
      'kanwar@estatenest.ca'
    ];

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Estate Nest <onboarding@resend.dev>',
        to: recipients,
        subject: `🏠 New Quote Request from ${data.firstName} ${data.lastName} - ${data.insuranceType}`,
        html: emailHtml,
        reply_to: data.email,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Resend API error:', errorData);
      return res.status(500).json({
        success: false,
        message: 'Failed to send email. Please try again or contact us directly.'
      });
    }

    const result = await response.json();
    console.log('Email sent successfully:', result.id);

    return res.status(200).json({
      success: true,
      message: 'Your quote request has been submitted successfully. We will contact you within 24 hours.',
      emailId: result.id
    });

  } catch (error) {
    console.error('Form submission error:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again or contact us directly at hello@estatenest.ca'
    });
  }
}
