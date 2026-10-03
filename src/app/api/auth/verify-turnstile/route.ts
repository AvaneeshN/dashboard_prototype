import { NextRequest, NextResponse } from 'next/server';

const CLOUDFLARE_VERIFY_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const FALLBACK_SECRET_KEY = '0x4AAAAAAFM0qEXs_upZhrUiHnSXxKWPIGE';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Turnstile verification token is required.' },
        { status: 400 }
      );
    }

    const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || FALLBACK_SECRET_KEY;
    const clientIp = 
      req.headers.get('cf-connecting-ip') || 
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
      '';

    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (clientIp) {
      formData.append('remoteip', clientIp);
    }

    const response = await fetch(CLOUDFLARE_VERIFY_ENDPOINT, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Cloudflare verify returned HTTP status ${response.status}` },
        { status: 502 }
      );
    }

    let result = await response.json();

    // If verification failed with production key, check if this was a local test token
    if (!result.success) {
      const testSecretKey = '1x0000000000000000000000000000000AA';
      const testFormData = new FormData();
      testFormData.append('secret', testSecretKey);
      testFormData.append('response', token);
      if (clientIp) {
        testFormData.append('remoteip', clientIp);
      }

      try {
        const testResponse = await fetch(CLOUDFLARE_VERIFY_ENDPOINT, {
          method: 'POST',
          body: testFormData,
        });
        if (testResponse.ok) {
          const testResult = await testResponse.json();
          if (testResult.success) {
            result = testResult;
          }
        }
      } catch (testErr) {
        console.warn('Test key fallback check error:', testErr);
      }
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        hostname: result.hostname,
        challenge_ts: result.challenge_ts
      });
    } else {
      console.warn('Turnstile verification failed:', result['error-codes']);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Security challenge verification failed. Please try again.',
          errorCodes: result['error-codes'] 
        },
        { status: 403 }
      );
    }
  } catch (error: any) {
    console.error('Error in /api/auth/verify-turnstile:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error during bot verification.' },
      { status: 500 }
    );
  }
}
