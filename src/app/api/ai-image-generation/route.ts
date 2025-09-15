import { NextRequest, NextResponse } from 'next/server';
import { AVAILABLE_MODELS, getModelByName } from './index';

// API to get available models
export async function GET(request: NextRequest) {
  return NextResponse.json({
    models: AVAILABLE_MODELS
  });
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}