import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateDocumentSubmission,
  generateCoverLetter,
  generatePassengerDetailsForm,
  generateDocumentChecklist,
  generateAllDocuments,
  generateAdminNotificationEmail,
  DocumentSubmission,
  GeneratedDocument,
} from '../document-generator';
import { ClaimRecord } from '../airtable';
import { AirlineConfig } from '../airline-config';

describe('Document Generator', () => {
  const mockClaim: ClaimRecord = {
    id: 'rec123',
    claimId: 'CLM001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    flightNumber: 'BA123',
    airline: 'British Airways',
    departureDate: '2024-01-15',
    departureAirport: 'LHR',
    arrivalAirport: 'CDG',
    delayDuration: '3 hours',
    delayReason: 'Technical issues',
    bookingReference: 'ABC123',
    boardingPassUrl: 'https://example.com/boarding-pass.pdf',
    delayProofUrl: 'https://example.com/delay-proof.pdf',
    status: 'submitted',
    submittedAt: '2024-01-15T10:00:00Z',
    amount: 600,
    paymentId: 'pi_123',
  };

  const mockEmailAirlineConfig: AirlineConfig = {
    airlineCode: 'FR',
    airlineName: 'Ryanair',
    submissionMethod: 'email',
    claimEmail: 'eu261@ryanair.com',
    requiredDocuments: ['boarding_pass', 'delay_proof', 'passenger_details'],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
    ],
    expectedResponseTime: '3-6 weeks',
    followUpSchedule: ['3 weeks', '6 weeks', '10 weeks'],
    specialInstructions: 'Email claims to eu261@ryanair.com',
    regulationCovered: 'EU261',
    contactPhone: '+353 1 945 1212',
    website: 'https://www.ryanair.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
    },
  };

  const mockWebFormAirlineConfig: AirlineConfig = {
    airlineCode: 'BA',
    airlineName: 'British Airways',
    submissionMethod: 'web_form',
    claimFormUrl:
      'https://www.britishairways.com/en-gb/information/legal/eu261',
    requiredDocuments: ['boarding_pass', 'delay_proof', 'passenger_details'],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions: 'Use online EU261 form',
    regulationCovered: 'UK261',
    contactPhone: '+44 20 8738 5100',
    website: 'https://www.britishairways.com',
    claimFormFields: {
      passenger_name: 'Full Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
    },
  };

  const mockPostalAirlineConfig: AirlineConfig = {
    airlineCode: 'TEST',
    airlineName: 'Test Airline',
    submissionMethod: 'postal',
    postalAddress: '123 Test Street, Test City, TC 12345',
    requiredDocuments: ['boarding_pass', 'delay_proof', 'passenger_details'],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks'],
    specialInstructions: 'Send via registered post',
    regulationCovered: 'EU261',
    contactPhone: '+1234567890',
    website: 'https://test.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
    },
  };

  describe('generateDocumentSubmission', () => {
    it('should generate email submission correctly', async () => {
      const submission = await generateDocumentSubmission(
        mockClaim,
        mockEmailAirlineConfig
      );

      expect(submission.type).toBe('email');
      expect(submission.to).toBe('eu261@ryanair.com');
      expect(submission.subject).toContain('EU261 Compensation Claim');
      expect(submission.subject).toContain('BA123');
      expect(submission.subject).toContain('2024-01-15');
      expect(submission.body).toContain('John Doe');
      expect(submission.body).toContain('BA123');
      expect(submission.body).toContain('LHR');
      expect(submission.body).toContain('CDG');
      expect(submission.body).toContain('3 hours');
      expect(submission.body).toContain('Technical issues');
      expect(submission.body).toContain('ABC123');
      expect(submission.attachments).toEqual(
        mockEmailAirlineConfig.requiredDocuments
      );
      expect(submission.instructions).toBe(
        mockEmailAirlineConfig.specialInstructions
      );
    });

    it('should generate web form submission correctly', async () => {
      const submission = await generateDocumentSubmission(
        mockClaim,
        mockWebFormAirlineConfig
      );

      expect(submission.type).toBe('web_form');
      expect(submission.url).toBe(
        'https://www.britishairways.com/en-gb/information/legal/eu261'
      );
      expect(submission.body).toContain('WEB FORM SUBMISSION INSTRUCTIONS');
      expect(submission.body).toContain('John Doe');
      expect(submission.body).toContain('BA123');
      expect(submission.body).toContain('LHR');
      expect(submission.body).toContain('CDG');
      expect(submission.body).toContain('3 hours');
      expect(submission.body).toContain('ABC123');
      expect(submission.formData).toBeDefined();
      expect(submission.formData['Full Name']).toBe('John Doe');
      expect(submission.formData['Flight Number']).toBe('BA123');
      expect(submission.formData['Departure Date']).toBe('2024-01-15');
      expect(submission.formData['Delay Duration']).toBe('3 hours');
      expect(submission.attachments).toEqual(
        mockWebFormAirlineConfig.requiredDocuments
      );
      expect(submission.instructions).toBe(
        mockWebFormAirlineConfig.specialInstructions
      );
    });

    it('should generate postal submission correctly', async () => {
      const submission = await generateDocumentSubmission(
        mockClaim,
        mockPostalAirlineConfig
      );

      expect(submission.type).toBe('postal');
      expect(submission.address).toBe('123 Test Street, Test City, TC 12345');
      expect(submission.body).toContain('POSTAL SUBMISSION INSTRUCTIONS');
      expect(submission.body).toContain('John Doe');
      expect(submission.body).toContain('BA123');
      expect(submission.body).toContain('LHR');
      expect(submission.body).toContain('CDG');
      expect(submission.body).toContain('3 hours');
      expect(submission.body).toContain('ABC123');
      expect(submission.attachments).toEqual(
        mockPostalAirlineConfig.requiredDocuments
      );
      expect(submission.instructions).toBe(
        mockPostalAirlineConfig.specialInstructions
      );
    });

    it('should include follow-up schedule in all submission types', async () => {
      const emailSubmission = await generateDocumentSubmission(
        mockClaim,
        mockEmailAirlineConfig
      );
      const webFormSubmission = await generateDocumentSubmission(
        mockClaim,
        mockWebFormAirlineConfig
      );
      const postalSubmission = await generateDocumentSubmission(
        mockClaim,
        mockPostalAirlineConfig
      );

      mockEmailAirlineConfig.followUpSchedule.forEach((schedule) => {
        expect(emailSubmission.body).toContain(schedule);
      });

      mockWebFormAirlineConfig.followUpSchedule.forEach((schedule) => {
        expect(webFormSubmission.body).toContain(schedule);
      });

      mockPostalAirlineConfig.followUpSchedule.forEach((schedule) => {
        expect(postalSubmission.body).toContain(schedule);
      });
    });

    it('should include regulation information', async () => {
      const emailSubmission = await generateDocumentSubmission(
        mockClaim,
        mockEmailAirlineConfig
      );
      const webFormSubmission = await generateDocumentSubmission(
        mockClaim,
        mockWebFormAirlineConfig
      );

      expect(emailSubmission.body).toContain('EU261');
      expect(webFormSubmission.body).toContain('UK261');
    });
  });

  describe('generateCoverLetter', () => {
    it('should generate cover letter for postal submissions', () => {
      const coverLetter = generateCoverLetter(
        mockClaim,
        mockPostalAirlineConfig
      );

      expect(coverLetter.type).toBe('cover_letter');
      expect(coverLetter.filename).toBe('cover-letter-test-airline-clm001.txt');
      expect(coverLetter.content).toContain('Test Airline');
      expect(coverLetter.content).toContain('John Doe');
      expect(coverLetter.content).toContain('BA123');
      expect(coverLetter.content).toContain('LHR');
      expect(coverLetter.content).toContain('CDG');
      expect(coverLetter.content).toContain('3 hours');
      expect(coverLetter.content).toContain('Technical issues');
      expect(coverLetter.content).toContain('ABC123');
      expect(coverLetter.mimeType).toBe('text/plain');
      expect(coverLetter.size).toBeGreaterThan(0);
    });

    it('should include proper formatting and structure', () => {
      const coverLetter = generateCoverLetter(
        mockClaim,
        mockPostalAirlineConfig
      );

      expect(coverLetter.content).toContain('EU261 Compensation Claim');
      expect(coverLetter.content).toContain('Passenger Details:');
      expect(coverLetter.content).toContain('Flight Details:');
      expect(coverLetter.content).toContain('Delay Information:');
      expect(coverLetter.content).toContain('Supporting Documents:');
    });
  });

  describe('generatePassengerDetailsForm', () => {
    it('should generate passenger details form', () => {
      const form = generatePassengerDetailsForm(mockClaim);

      expect(form.type).toBe('passenger_details');
      expect(form.filename).toBe('passenger-details-clm001.txt');
      expect(form.content).toContain('PASSENGER DETAILS FORM');
      expect(form.content).toContain('John Doe');
      expect(form.content).toContain('john.doe@example.com');
      expect(form.content).toContain('CLM001');
      expect(form.mimeType).toBe('text/plain');
      expect(form.size).toBeGreaterThan(0);
    });

    it('should include all passenger information', () => {
      const form = generatePassengerDetailsForm(mockClaim);

      expect(form.content).toContain('Full Name: John Doe');
      expect(form.content).toContain('Email: john.doe@example.com');
      expect(form.content).toContain('Claim ID: CLM001');
    });
  });

  describe('generateDocumentChecklist', () => {
    it('should generate document checklist', () => {
      const checklist = generateDocumentChecklist(
        mockClaim,
        mockEmailAirlineConfig
      );

      expect(checklist.type).toBe('document_checklist');
      expect(checklist.filename).toBe('document-checklist-ryanair-clm001.txt');
      expect(checklist.content).toContain('DOCUMENT CHECKLIST - Ryanair');
      expect(checklist.content).toContain('John Doe');
      expect(checklist.content).toContain('BA123');
      expect(checklist.content).toContain('CLM001');
      expect(checklist.mimeType).toBe('text/plain');
      expect(checklist.size).toBeGreaterThan(0);
    });

    it('should include required documents list', () => {
      const checklist = generateDocumentChecklist(
        mockClaim,
        mockEmailAirlineConfig
      );

      mockEmailAirlineConfig.requiredDocuments.forEach((doc) => {
        expect(checklist.content).toContain(`☐ ${doc}`);
      });
    });

    it('should include documents provided status', () => {
      const checklist = generateDocumentChecklist(
        mockClaim,
        mockEmailAirlineConfig
      );

      expect(checklist.content).toContain('DOCUMENTS PROVIDED:');
      expect(checklist.content).toContain('☐ boarding_pass');
      expect(checklist.content).toContain('☐ delay_proof');
    });

    it('should include follow-up schedule', () => {
      const checklist = generateDocumentChecklist(
        mockClaim,
        mockEmailAirlineConfig
      );

      mockEmailAirlineConfig.followUpSchedule.forEach((schedule) => {
        expect(checklist.content).toContain(schedule);
      });
    });

    it('should include special instructions', () => {
      const checklist = generateDocumentChecklist(
        mockClaim,
        mockEmailAirlineConfig
      );

      expect(checklist.content).toContain('SPECIAL INSTRUCTIONS:');
      expect(checklist.content).toContain(
        mockEmailAirlineConfig.specialInstructions
      );
    });
  });

  describe('generateAllDocuments', () => {
    it('should generate all documents for a claim', () => {
      const documents = generateAllDocuments(mockClaim, mockEmailAirlineConfig);

      expect(documents).toHaveLength(3); // cover letter, passenger details, checklist

      const documentTypes = documents.map((doc) => doc.type);
      expect(documentTypes).toContain('cover_letter');
      expect(documentTypes).toContain('passenger_details');
      expect(documentTypes).toContain('document_checklist');
    });

    it('should generate documents with correct airline information', () => {
      const documents = generateAllDocuments(mockClaim, mockEmailAirlineConfig);

      documents.forEach((doc) => {
        if (doc.type === 'cover_letter' || doc.type === 'document_checklist') {
          expect(doc.content).toContain('Ryanair');
        }
      });
    });
  });

  describe('generateAdminNotificationEmail', () => {
    it('should generate ready to file notification', () => {
      const notification = generateAdminNotificationEmail(
        mockClaim,
        mockEmailAirlineConfig,
        'ready_to_file'
      );

      expect(notification.type).toBe('admin_notification');
      expect(notification.filename).toBe(
        'admin-notification-ready-to-file-clm001.html'
      );
      expect(notification.content).toContain('CLAIM READY TO FILE');
      expect(notification.content).toContain('John Doe');
      expect(notification.content).toContain('BA123');
      expect(notification.content).toContain('Ryanair');
      expect(notification.content).toContain('CLM001');
      expect(notification.mimeType).toBe('text/html');
      expect(notification.size).toBeGreaterThan(0);
    });

    it('should generate overdue notification', () => {
      const notification = generateAdminNotificationEmail(
        mockClaim,
        mockEmailAirlineConfig,
        'overdue'
      );

      expect(notification.content).toContain('OVERDUE CLAIM ALERT');
      expect(notification.content).toContain('URGENT ACTION REQUIRED');
    });

    it('should generate follow-up needed notification', () => {
      const notification = generateAdminNotificationEmail(
        mockClaim,
        mockEmailAirlineConfig,
        'follow_up_needed'
      );

      expect(notification.content).toContain('FOLLOW-UP REQUIRED');
      expect(notification.content).toContain('Follow-up Schedule:');
    });

    it('should include claim details in all notification types', () => {
      const readyNotification = generateAdminNotificationEmail(
        mockClaim,
        mockEmailAirlineConfig,
        'ready_to_file'
      );
      const overdueNotification = generateAdminNotificationEmail(
        mockClaim,
        mockEmailAirlineConfig,
        'overdue'
      );
      const followUpNotification = generateAdminNotificationEmail(
        mockClaim,
        mockEmailAirlineConfig,
        'follow_up_needed'
      );

      [readyNotification, overdueNotification, followUpNotification].forEach(
        (notification) => {
          expect(notification.content).toContain('John Doe');
          expect(notification.content).toContain('BA123');
          expect(notification.content).toContain('LHR');
          expect(notification.content).toContain('CDG');
          expect(notification.content).toContain('3 hours');
          expect(notification.content).toContain('CLM001');
        }
      );
    });

    it('should include airline-specific information', () => {
      const notification = generateAdminNotificationEmail(
        mockClaim,
        mockEmailAirlineConfig,
        'ready_to_file'
      );

      expect(notification.content).toContain('Ryanair');
      expect(notification.content).toContain('eu261@ryanair.com');
      expect(notification.content).toContain('3-6 weeks');
      expect(notification.content).toContain(
        mockEmailAirlineConfig.specialInstructions
      );
    });

    it('should include follow-up schedule in follow-up notifications', () => {
      const notification = generateAdminNotificationEmail(
        mockClaim,
        mockEmailAirlineConfig,
        'follow_up_needed'
      );

      mockEmailAirlineConfig.followUpSchedule.forEach((schedule) => {
        expect(notification.content).toContain(schedule);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing optional fields gracefully', () => {
      const claimWithoutDelayReason = { ...mockClaim, delayReason: undefined };
      const claimWithoutBookingRef = {
        ...mockClaim,
        bookingReference: undefined,
      };

      expect(() =>
        generatePassengerDetailsForm(claimWithoutDelayReason)
      ).not.toThrow();
      expect(() =>
        generatePassengerDetailsForm(claimWithoutBookingRef)
      ).not.toThrow();
    });

    it('should handle different airline configurations', () => {
      const differentConfig: AirlineConfig = {
        ...mockEmailAirlineConfig,
        airlineName: 'Different Airline',
        requiredDocuments: ['custom_doc1', 'custom_doc2'],
        followUpSchedule: ['1 week', '2 weeks'],
        specialInstructions: 'Custom instructions',
      };

      expect(() =>
        generateDocumentChecklist(mockClaim, differentConfig)
      ).not.toThrow();

      const checklist = generateDocumentChecklist(mockClaim, differentConfig);
      expect(checklist.content).toContain('Different Airline');
      expect(checklist.content).toContain('☐ custom_doc1');
      expect(checklist.content).toContain('☐ custom_doc2');
      expect(checklist.content).toContain('1 week');
      expect(checklist.content).toContain('Custom instructions');
    });

    it('should generate valid filenames', () => {
      const coverLetter = generateCoverLetter(
        mockClaim,
        mockEmailAirlineConfig
      );
      const passengerForm = generatePassengerDetailsForm(mockClaim);
      const checklist = generateDocumentChecklist(
        mockClaim,
        mockEmailAirlineConfig
      );

      expect(coverLetter.filename).toMatch(/^cover-letter-.*-clm001\.txt$/);
      expect(passengerForm.filename).toMatch(/^passenger-details-clm001\.txt$/);
      expect(checklist.filename).toMatch(/^document-checklist-.*-clm001\.txt$/);
    });
  });
});
