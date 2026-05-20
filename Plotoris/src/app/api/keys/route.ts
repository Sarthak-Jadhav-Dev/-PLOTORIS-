import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

function getEmailFromHeader(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    return decoded.email;
  } catch (e) {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const email = getEmailFromHeader(request);
    if (!email) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('api_keys')
      .select('id, provider, key_value, created_at')
      .eq('user_email', email);

    if (error) {
      // If table doesn't exist, return empty array to prevent UI crashing
      if (error.code === '42P01') {
        return NextResponse.json({ data: [] }, { status: 200 });
      }
      throw error;
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Error fetching keys', error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const email = getEmailFromHeader(request);
    if (!email) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { provider, keyValue } = await request.json();

    const { data, error } = await supabase
      .from('api_keys')
      .insert([
        { user_email: email, provider, key_value: keyValue }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: 'Key added successfully', data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Error adding key', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const email = getEmailFromHeader(request);
    if (!email) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_email', email);

    if (error) throw error;

    return NextResponse.json({ message: 'Key deleted' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Error deleting key', error: error.message }, { status: 500 });
  }
}
