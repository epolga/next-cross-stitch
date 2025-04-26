// app/api/all-designs/route.ts
import { NextResponse } from 'next/server';
//import { callApi } from '../../lib/api';
import { callApi } from '../../lib/api';
export async function GET() {
    try {
        const data = await callApi();
        return NextResponse.json(data);
    } catch (error: unknown) {
        // Narrow error to Error or handle unknown
        const errorDetails = {
            message: error instanceof Error ? error.message : String(error) || 'Unknown error',
            code: error instanceof Error && 'code' in error ? error.code : 'N/A',
            stack: error instanceof Error ? error.stack : 'N/A',
            type: typeof error
        };
        console.error('API error:', errorDetails);
        return NextResponse.json({ error: 'Failed to fetch designs', details: errorDetails }, { status: 500 });
    }
}