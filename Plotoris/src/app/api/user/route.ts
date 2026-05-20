import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

// Authenticate helper
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
      .from('Users')
      .select('profession, education, fields_of_interest')
      .eq('email', email)
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Error fetching user', error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const email = getEmailFromHeader(request);
    if (!email) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { profession, education, fieldsOfInterest } = await request.json();

    const { data, error } = await supabase
      .from('Users')
      .update({
        profession,
        education,
        fields_of_interest: fieldsOfInterest
      })
      .eq('email', email);

    if (error) throw error;

    return NextResponse.json({ message: 'Updated successfully', data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Error updating user', error: error.message }, { status: 500 });
  }
}
