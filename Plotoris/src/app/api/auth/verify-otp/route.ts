import { NextResponse } from 'next/server';
import { otpStore } from '@/lib/otpStore';
import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ message: 'Missing email or OTP' }, { status: 400 });
    }

    const cachedData = otpStore.get(email);

    if (!cachedData) {
      return NextResponse.json({ message: 'OTP expired or invalid email' }, { status: 400 });
    }

    if (Date.now() > cachedData.expiresAt) {
      otpStore.delete(email);
      return NextResponse.json({ message: 'OTP has expired' }, { status: 400 });
    }

    if (cachedData.otp !== otp) {
      return NextResponse.json({ message: 'Invalid OTP' }, { status: 400 });
    }

    // Check if user already exists (prevent duplicate registration)
    const { data: existingUser } = await supabase
      .from('Users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      otpStore.delete(email);
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    // OTP is valid — insert the user into Supabase and return the new row
    const { data: newUser, error } = await supabase
      .from('Users')
      .insert([
        {
          user_name: cachedData.name,
          email: email,
          password: cachedData.passwordHash,
        },
      ])
      .select('id, user_name, email')
      .single();

    if (error) {
      console.error('DB insert error:', error);
      return NextResponse.json(
        { message: 'Error creating user in database', error: error.message },
        { status: 500 }
      );
    }

    // Generate JWT token with the real user id
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.user_name },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    // Remove OTP from store
    otpStore.delete(email);

    return NextResponse.json(
      {
        message: 'User verified and registered successfully',
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.user_name,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
