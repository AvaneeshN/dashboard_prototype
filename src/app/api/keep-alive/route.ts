import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('form_submissions')
      .select('id')
      .limit(1);

    const latencyMs = Date.now() - startTime;

    if (error) {
      return NextResponse.json(
        {
          status: 'error',
          message: error.message,
          timestamp: new Date().toISOString(),
          latencyMs
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'active',
      message: 'Supabase database is active and responding',
      timestamp: new Date().toISOString(),
      latencyMs,
      sampleRecordFound: Boolean(data && data.length > 0)
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: err.message || 'Internal error querying database',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
