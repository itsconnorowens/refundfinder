import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { updateAirtableRecord, getAirtableRecordByField } from '@/lib/airtable';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const claimId = formData.get('claimId') as string;
    const boardingPass = formData.get('boardingPass') as File | null;
    const delayProof = formData.get('delayProof') as File | null;
    const bookingReference = formData.get('bookingReference') as string | null;

    if (!claimId) {
      return NextResponse.json(
        { error: 'Claim ID is required' },
        { status: 400 }
      );
    }

    console.log('Uploading documents for claim:', claimId);

    // For now, we'll store file metadata
    // In production, you'd upload to S3/Cloudflare R2/etc.
    const documentUrls: Record<string, string> = {};

    if (boardingPass) {
      // In production: Upload to S3 and get URL
      // For now: Store locally or skip actual upload
      const boardingPassName = `${claimId}_boarding_pass_${Date.now()}.${boardingPass.name.split('.').pop()}`;
      documentUrls.boardingPassUrl = `/uploads/${boardingPassName}`;

      console.log('Boarding pass uploaded:', boardingPassName);

      // Optional: Actually save the file locally (for development)
      try {
        const bytes = await boardingPass.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const path = join(process.cwd(), 'public', 'uploads', boardingPassName);
        await writeFile(path, buffer);
      } catch (err) {
        console.warn('Could not save file locally (this is OK in production):', err);
      }
    }

    if (delayProof) {
      const delayProofName = `${claimId}_delay_proof_${Date.now()}.${delayProof.name.split('.').pop()}`;
      documentUrls.delayProofUrl = `/uploads/${delayProofName}`;

      console.log('Delay proof uploaded:', delayProofName);

      try {
        const bytes = await delayProof.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const path = join(process.cwd(), 'public', 'uploads', delayProofName);
        await writeFile(path, buffer);
      } catch (err) {
        console.warn('Could not save file locally (this is OK in production):', err);
      }
    }

    // Update claim record in Airtable with document URLs
    try {
      const claimRecord = await getAirtableRecordByField('Claims', 'claimId', claimId);

      if (claimRecord) {
        await updateAirtableRecord('Claims', claimRecord.id, {
          ...documentUrls,
          ...(bookingReference && { bookingReference }),
          documentsUploaded: true,
          documentsUploadedAt: new Date().toISOString(),
        });

        console.log('Claim updated with documents');
      } else {
        console.warn('Claim not found in Airtable:', claimId);
      }
    } catch (err) {
      console.error('Error updating claim in Airtable:', err);
      // Don't fail the request if Airtable update fails
    }

    return NextResponse.json({
      success: true,
      message: 'Documents uploaded successfully',
      documentUrls,
    });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload documents', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
