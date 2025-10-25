import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const flightNumber = formData.get('flightNumber') as string;
    const airline = formData.get('airline') as string;
    const departureDate = formData.get('departureDate') as string;
    const departureAirport = formData.get('departureAirport') as string;
    const arrivalAirport = formData.get('arrivalAirport') as string;
    const delayDuration = formData.get('delayDuration') as string;
    const delayReason = formData.get('delayReason') as string;

    // Extract files
    const boardingPass = formData.get('boardingPass') as File;
    const delayProof = formData.get('delayProof') as File;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !flightNumber ||
      !airline ||
      !departureDate ||
      !departureAirport ||
      !arrivalAirport ||
      !delayDuration
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate files
    if (!boardingPass || !delayProof) {
      return NextResponse.json(
        { error: 'Missing required documents' },
        { status: 400 }
      );
    }

    // Validate file types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];
    if (
      !allowedTypes.includes(boardingPass.type) ||
      !allowedTypes.includes(delayProof.type)
    ) {
      return NextResponse.json(
        {
          error: 'Invalid file type. Only PDF, JPG, and PNG files are allowed.',
        },
        { status: 400 }
      );
    }

    // Validate file sizes (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (boardingPass.size > maxSize || delayProof.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch {
      // Directory might already exist, ignore error
    }

    // Generate unique filenames
    const timestamp = Date.now();
    const boardingPassFilename = `boarding-pass-${timestamp}-${boardingPass.name}`;
    const delayProofFilename = `delay-proof-${timestamp}-${delayProof.name}`;

    // Save files
    const boardingPassPath = join(uploadsDir, boardingPassFilename);
    const delayProofPath = join(uploadsDir, delayProofFilename);

    const boardingPassBuffer = Buffer.from(await boardingPass.arrayBuffer());
    const delayProofBuffer = Buffer.from(await delayProof.arrayBuffer());

    await writeFile(boardingPassPath, boardingPassBuffer);
    await writeFile(delayProofPath, delayProofBuffer);

    // Create claim data object
    const claimData = {
      id: `claim-${timestamp}`,
      personalInfo: {
        firstName,
        lastName,
        email,
      },
      flightDetails: {
        flightNumber,
        airline,
        departureDate,
        departureAirport,
        arrivalAirport,
        delayDuration,
        delayReason: delayReason || null,
      },
      documents: {
        boardingPass: {
          filename: boardingPassFilename,
          originalName: boardingPass.name,
          size: boardingPass.size,
          type: boardingPass.type,
          path: boardingPassPath,
        },
        delayProof: {
          filename: delayProofFilename,
          originalName: delayProof.name,
          size: delayProof.size,
          type: delayProof.type,
          path: delayProofPath,
        },
      },
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      estimatedCompensation: calculateEstimatedCompensation(
        departureAirport,
        arrivalAirport,
        delayDuration
      ),
    };

    // In a real application, you would save this to a database
    // For now, we'll just log it and return success
    console.log('New claim submitted:', claimData);

    // TODO: Save to database
    // TODO: Send confirmation email
    // TODO: Process payment
    // TODO: Queue claim for processing

    return NextResponse.json({
      success: true,
      claimId: claimData.id,
      message:
        "Claim submitted successfully. We'll file your claim within 48 hours and email you with every update.",
      estimatedCompensation: claimData.estimatedCompensation,
    });
  } catch (error) {
    console.error('Error processing claim:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateEstimatedCompensation(
  departureAirport: string,
  arrivalAirport: string,
  delayDuration: string
): string {
  // Simple compensation calculation based on distance and delay
  // This is a simplified version - in reality, you'd use proper distance calculations
  const delayHours = parseFloat(delayDuration.replace(/[^\d.]/g, '')) || 0;

  if (delayHours < 3) {
    return 'Not eligible (delay less than 3 hours)';
  }

  // Rough distance estimation based on common routes
  const isLongHaul = departureAirport.length > 3 || arrivalAirport.length > 3; // Simplified logic

  if (delayHours >= 4) {
    return isLongHaul ? '€600' : '€400';
  } else {
    return isLongHaul ? '€400' : '€250';
  }
}
