import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { AgentMemory } from '@/types';

export async function GET() {
  try {
    const db = await getDatabase();
    const memories = await db.collection('memories').find({}).toArray();
    
    return NextResponse.json({
      success: true,
      data: memories as unknown as AgentMemory[]
    });
  } catch (error) {
    console.error('Error fetching memories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch memories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = await getDatabase();
    
    const memory = {
      ...body,
      created_at: new Date()
    };
    
    const result = await db.collection('memories').insertOne(memory);
    
    return NextResponse.json({
      success: true,
      data: { ...memory, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Error creating memory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create memory' },
      { status: 500 }
    );
  }
} 