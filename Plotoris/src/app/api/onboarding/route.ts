import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let email = '';
    
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      email = decoded.email;
    } catch (e) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const { fieldsOfInterest, profession, education } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Missing email' }, { status: 400 });
    }

    // Update the user's profile information in the Users table
    // (Assuming these columns are added to the Users table by the user)
    const { data, error } = await supabase
      .from('Users')
      .update({
        fields_of_interest: fieldsOfInterest,
        profession: profession,
        education: education,
      })
      .eq('email', email);

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ message: 'Error saving profile', error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Profile updated successfully', data }, { status: 200 });
  } catch (error: any) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
