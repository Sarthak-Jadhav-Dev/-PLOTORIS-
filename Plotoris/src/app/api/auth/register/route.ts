import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('Users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert the user into Supabase
    const { data: newUser, error } = await supabase
      .from('Users')
      .insert([
        {
          user_name: name,
          email: email,
          password: passwordHash,
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

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.user_name },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    return NextResponse.json(
      {
        message: 'Registration successful',
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
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
