import { NextResponse } from 'next/server';
import { generateSPOCEmailHtml } from '@/lib/document-utils';
import nodemailer from 'nodemailer';

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

    // 1. LIVE DELIVERY VIA GMAIL SMTP (Sends to ANY recipient without domain verification)
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASS) {
      try {
        const recipients = targetRecipient.split(',').map((e: string) => e.trim()).filter(Boolean);
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASS
          }
        });

        const info = await transporter.sendMail({
          from: `"${companyName || 'Apprentice Portal'}" <${process.env.GMAIL_USER}>`,
          to: recipients.join(', '),
          subject: emailSubject,
          html: formattedHtml
        });

        console.log('[OK] Gmail email dispatched successfully:', info.messageId);
        liveDeliveryStatus = `Delivered via Gmail SMTP (ID: ${info.messageId})`;
      } catch (err: any) {
        console.error('[ERROR] Gmail SMTP dispatch attempt failed:', err);
        liveDeliveryStatus = `Gmail Error: ${err.message || 'Check Gmail App Password'}`;
      }
    }

    // 2. LIVE DELIVERY VIA RESEND API
    else if (process.env.RESEND_API_KEY) {
      const resendToken = process.env.RESEND_API_KEY;
      try {
        let recipients = targetRecipient.split(',').map((e: string) => e.trim()).filter(Boolean);
        
        // In Resend sandbox mode (from onboarding@resend.dev), filter out mock domain placeholders
        // so emails are sent directly to the verified account owner email
        const realRecipients = recipients.filter((e: string) => 
          !e.includes('ourcompany.com') && 
          !e.includes('client-spoc@company.com') && 
          !e.includes('@portal.com')
        );
        if (realRecipients.length > 0) {
          recipients = realRecipients;
        }

        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendToken}`,
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
          console.log('[OK] Resend email dispatched successfully:', externalApiResponse);
          liveDeliveryStatus = `Delivered via Resend API (ID: ${externalApiResponse.id})`;
        } else {
          console.error('[ERROR] Resend API error response:', externalApiResponse);
          liveDeliveryStatus = `Resend Notice: ${externalApiResponse.message || 'Check Resend configuration'}`;
        }
      } catch (err: any) {
        console.error('[ERROR] Resend live dispatch attempt failed:', err);
        liveDeliveryStatus = `Resend Error: ${err.message || 'Connection failed'}`;
      }
    }

    // 3. LIVE DELIVERY VIA MSG91 EMAIL API
    else if (process.env.MSG91_AUTH_KEY) {
      try {
        const recipients = targetRecipient.split(',').map((e: string) => ({
          name: spocName || 'SPOC Lead',
          email: e.trim()
        }));

        const msg91Res = await fetch('https://control.msg91.com/api/v5/email/send', {
          method: 'POST',
          headers: {
            'authkey': process.env.MSG91_AUTH_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            to: recipients,
            from: {
              name: companyName || 'Apprentice Portal',
              email: process.env.MSG91_FROM_EMAIL || 'support@yourdomain.com'
            },
            subject: emailSubject,
            body: formattedHtml
          })
        });

        externalApiResponse = await msg91Res.json();
        if (msg91Res.ok && (externalApiResponse.status === 'success' || externalApiResponse.hasError === false || !externalApiResponse.hasError)) {
          liveDeliveryStatus = `Delivered via MSG91 (ID: ${externalApiResponse.data?.unique_id || externalApiResponse.requestId || 'OK'})`;
        } else {
          liveDeliveryStatus = `MSG91 Notice: ${externalApiResponse.message || 'Check MSG91 configuration'}`;
        }
      } catch (err: any) {
        console.warn('MSG91 dispatch attempt:', err);
        liveDeliveryStatus = `MSG91 Error: ${err.message || 'Connection failed'}`;
      }
    }

    // 3. LIVE DELIVERY VIA ZOHO ZEPTOMAIL API
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
            from: { address: process.env.ZOHO_FROM_EMAIL || 'support@yourcompany.com' },
            to: recipients,
            subject: emailSubject,
            htmlbody: formattedHtml
          })
        });

        externalApiResponse = await zohoRes.json();
        if (zohoRes.ok) {
          liveDeliveryStatus = `Delivered via Zoho ZeptoMail (Request ID: ${externalApiResponse.request_id || 'OK'})`;
        } else {
          liveDeliveryStatus = `Zoho ZeptoMail Notice: ${externalApiResponse.message || 'Check ZeptoMail token'}`;
        }
      } catch (err: any) {
        console.warn('Zoho ZeptoMail dispatch attempt:', err);
      }
    }

    // 4. LIVE DELIVERY VIA ZOHO MAIL SMTP (Using standard Zoho Mailbox App Password)
    else if (process.env.ZOHO_SMTP_USER && process.env.ZOHO_SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.in',
          port: Number(process.env.ZOHO_SMTP_PORT) || 465,
          secure: true,
          auth: {
            user: process.env.ZOHO_SMTP_USER,
            pass: process.env.ZOHO_SMTP_PASS
          }
        });

        const info = await transporter.sendMail({
          from: `"${companyName || 'Apprenticeship Portal'}" <${process.env.ZOHO_SMTP_USER}>`,
          to: targetRecipient,
          subject: emailSubject,
          html: formattedHtml
        });

        liveDeliveryStatus = `Delivered via Zoho Mail SMTP (Message ID: ${info.messageId})`;
      } catch (err: any) {
        console.warn('Zoho Mail SMTP dispatch attempt:', err);
        liveDeliveryStatus = `Zoho SMTP Error: ${err.message || 'Check App Password'}`;
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
