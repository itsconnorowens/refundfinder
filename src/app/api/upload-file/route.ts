import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { withErrorTracking, addBreadcrumb } from '@/lib/error-tracking';

export const POST = withErrorTracking(async (request: NextRequest) => {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const fileType = formData.get('fileType') as string; // 'boardingPass' or 'delayProof'

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  addBreadcrumb('File upload started', 'file_upload', {
    fileType,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type
  });

  // Validate file type
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      {
        error: 'Invalid file type. Please upload a PDF, JPG, or PNG file.',
      },
      { status: 400 }
    );
  }

  // Validate file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      {
        error: 'File size must be less than 5MB',
      },
      { status: 400 }
    );
  }

  // Create a unique filename with timestamp and file type
  const timestamp = Date.now();
  const fileExtension = file.name.split('.').pop();
  const filename = `${fileType}/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  // Upload to Vercel Blob
  const blob = await put(filename, file, {
    access: 'public',
    addRandomSuffix: true,
  });

  addBreadcrumb('File upload completed', 'file_upload', { url: blob.url });

  return NextResponse.json({
    success: true,
    url: blob.url,
    filename: blob.pathname,
    size: file.size,
    type: file.type,
  });
}, { route: '/api/upload-file', tags: { service: 'file_storage' } });
