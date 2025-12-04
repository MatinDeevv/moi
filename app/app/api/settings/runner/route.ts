/**
 * API Route: /api/settings/runner
 * Handles GET and PUT for runner configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/settings/runner
 * Returns current runner settings (token is masked)
 */
export async function GET(request: NextRequest) {
  console.log('[API/settings/runner] GET /api/settings/runner');

  try {
    const settings = await getSettings();

    return NextResponse.json({
      ok: true,
      data: {
        runnerUrl: settings.runnerUrl,
        runnerToken: settings.runnerToken ? '***' : null, // Mask token
        updatedAt: settings.updatedAt.toISOString(),
      }
    });

  } catch (error: any) {
    console.error('[API/settings/runner] GET error:', error.message);
    console.error(error.stack);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/runner
 * Updates runner settings
 */
export async function PUT(request: NextRequest) {
  console.log('[API/settings/runner] PUT /api/settings/runner');

  try {
    let body;
    try {
      body = await request.json();
      console.log('[API/settings/runner] Request body:', {
        runnerUrl: body.runnerUrl || 'null',
        runnerToken: body.runnerToken ? '***' : 'null',
      });
    } catch (parseError) {
      console.error('[API/settings/runner] Failed to parse JSON body:', parseError);
      return NextResponse.json(
        { ok: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // Validate runnerUrl
    if (body.runnerUrl !== undefined && body.runnerUrl !== null && body.runnerUrl !== '') {
      if (typeof body.runnerUrl !== 'string' || !body.runnerUrl.startsWith('http')) {
        console.error('[API/settings/runner] Invalid runnerUrl:', body.runnerUrl);
        return NextResponse.json(
          { ok: false, error: 'Invalid runnerUrl. Must start with http:// or https://' },
          { status: 400 }
        );
      }
    }

    // Update settings
    const updateData: any = {};

    if (body.runnerUrl !== undefined) {
      updateData.runnerUrl = body.runnerUrl === '' ? null : body.runnerUrl;
    }

    if (body.runnerToken !== undefined) {
      updateData.runnerToken = body.runnerToken === '' ? null : body.runnerToken;
    }

    const settings = await updateSettings(undefined, updateData);

    console.log('[API/settings/runner] Settings updated successfully');

    return NextResponse.json({
      ok: true,
      data: {
        runnerUrl: settings.runnerUrl,
        runnerToken: settings.runnerToken ? '***' : null, // Mask token
        updatedAt: settings.updatedAt.toISOString(),
      }
    });

  } catch (error: any) {
    console.error('[API/settings/runner] PUT error:', error.message);
    console.error(error.stack);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

