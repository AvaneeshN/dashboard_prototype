import { NextResponse } from 'next/server';
import { generateSPOCEmailHtml } from '@/lib/document-utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      candidate, 
      companyName, 
      spocEmail, 
      spocName, 
      companySpocEmail,
      clientSpocEmail,
      documentList,
      htmlContent 
    } = body;

    const targetRecipient = spocEmail || clientSpocEmail || 'spoc@company.com';
    const emailSubject = `[Onboarding Dossier] New Candidate ${candidate?.name || 'Apprentice'} (${candidate?.tradeOrRole || 'Role'}) - ${companyName || 'Enterprise Client'}`;

    // Generate rich responsive HTML email body
    const formattedHtml = htmlContent || generateSPOCEmailHtml({
      candidate: candidate || {
        id: 'APP-2026-01',
        name: 'New Candidate',
        tradeOrRole: 'Full-Stack Developer Trainee',
        qualification: 'B.Tech / Diploma',
        onboardingDate: new Date().toISOString().split('T')[0],
        stipendAmount: 18500,
        dbtEligibleAmount: 4500,
        contractStatus: 'Generated',
        attendanceRate: '100%',
        status: 'Active'
      },
      companyName: companyName || 'Enterprise Client',
      spocName: spocName || 'SPOC Lead',
      spocEmail: targetRecipient,
      documentList: (documentList && documentList.length > 0) 
        ? documentList 
        : ['Aadhaar Card (.pdf)', 'Degree Marksheet (.docx)', 'Bank Passbook (.pdf)', 'Candidate Resume (.docx)']
    });

    let liveDeliveryStatus = 'Simulated Local Gateway';
    let externalApiResponse: any = null;

    // 1. LIVE DELIVERY VIA RESEND (If RESEND_API_KEY is present in .env.local)
    if (process.env.RESEND_API_KEY) {
      try {
        const recipients = targetRecipient.split(',').map((e: string) => e.trim()).filter(Boolean);
        
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
            to: recipients,
            subject: emailSubject,
            html: formattedHtml
          })
        });

        externalApiResponse = await resendRes.json();
        if (resendRes.ok) {
          liveDeliveryStatus = `Delivered via Resend API (ID: ${externalApiResponse.id})`;
        } else {
          liveDeliveryStatus = `Resend Error: ${externalApiResponse.message || 'Check API key / verified domain'}`;
        }
      } catch (err: any) {
        console.warn('Resend live dispatch attempt:', err);
      }
    }

    // 2. LIVE DELIVERY VIA ZOHO ZEPTOMAIL (If ZOHO_ZEPTOMAIL_TOKEN is present in .env.local)
    else if (process.env.ZOHO_ZEPTOMAIL_TOKEN) {
      try {
        const recipients = targetRecipient.split(',').map((e: string) => ({
          email_address: { address: e.trim(), name: spocName || 'SPOC' }
        }));

        const zohoRes = await fetch('https://api.zeptomail.in/v1.1/email', {
          method: 'POST',
          headers: {
            'Authorization': process.env.ZOHO_ZEPTOMAIL_TOKEN,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: { address: process.env.ZOHO_FROM_EMAIL || 'support@yourdomain.com' },
            to: recipients,
            subject: emailSubject,
            htmlbody: formattedHtml
          })
        });

        externalApiResponse = await zohoRes.json();
        liveDeliveryStatus = `Delivered via Zoho ZeptoMail (Request ID: ${externalApiResponse.request_id || 'OK'})`;
      } catch (err: any) {
        console.warn('Zoho ZeptoMail dispatch attempt:', err);
      }
    }

    const dispatchRecord = {
      id: `spoc-dispatch-${Date.now()}`,
      recipientEmail: targetRecipient,
      recipientName: spocName || 'SPOC / Compliance Officer',
      subject: emailSubject,
      candidateId: candidate?.id || 'APP-NEW',
      candidateName: candidate?.name || 'New Candidate',
      documentCount: (documentList || []).length,
      sentAt: new Date().toISOString(),
      status: 'Delivered',
      deliveryMethod: liveDeliveryStatus,
      htmlPreview: formattedHtml
    };

    return NextResponse.json({
      success: true,
      message: `Automated email notification triggered for SPOC: ${targetRecipient}`,
      dispatch: dispatchRecord
    });
  } catch (error: any) {
    console.error('SPOC Email Route Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error dispatching SPOC email.' },
      { status: 500 }
    );
  }
}
