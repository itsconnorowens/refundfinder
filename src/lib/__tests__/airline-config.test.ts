import { describe, it, expect, beforeEach } from 'vitest';
import {
  AIRLINE_CONFIGS,
  getAirlineConfig,
  getAllAirlineConfigs,
  getAirlinesBySubmissionMethod,
  generateSubmissionTemplate,
  AirlineConfig,
} from '../airline-config';

describe('Airline Configuration System', () => {
  describe('AIRLINE_CONFIGS', () => {
    it('should contain all 10 EU airlines', () => {
      const airlines = Object.keys(AIRLINE_CONFIGS);
      expect(airlines).toHaveLength(10);
      expect(airlines).toContain('BA'); // British Airways
      expect(airlines).toContain('FR'); // Ryanair
      expect(airlines).toContain('U2'); // EasyJet
      expect(airlines).toContain('LH'); // Lufthansa
      expect(airlines).toContain('AF'); // Air France
      expect(airlines).toContain('KL'); // KLM
      expect(airlines).toContain('IB'); // Iberia
      expect(airlines).toContain('AZ'); // Alitalia
      expect(airlines).toContain('SK'); // SAS Scandinavian
      expect(airlines).toContain('TP'); // TAP Air Portugal
    });

    it('should have valid configuration for each airline', () => {
      Object.values(AIRLINE_CONFIGS).forEach((config) => {
        expect(config.airlineCode).toBeTruthy();
        expect(config.airlineName).toBeTruthy();
        expect(['email', 'web_form', 'postal']).toContain(
          config.submissionMethod
        );
        expect(config.requiredDocuments).toBeInstanceOf(Array);
        expect(config.requiredFields).toBeInstanceOf(Array);
        expect(config.expectedResponseTime).toBeTruthy();
        expect(config.followUpSchedule).toBeInstanceOf(Array);
        expect(config.regulationCovered).toMatch(/^(EU261|UK261)$/);
      });
    });

    it('should have correct submission methods for each airline', () => {
      expect(AIRLINE_CONFIGS.BA.submissionMethod).toBe('web_form');
      expect(AIRLINE_CONFIGS.FR.submissionMethod).toBe('email');
      expect(AIRLINE_CONFIGS.U2.submissionMethod).toBe('web_form');
      expect(AIRLINE_CONFIGS.LH.submissionMethod).toBe('email');
      expect(AIRLINE_CONFIGS.AF.submissionMethod).toBe('web_form');
      expect(AIRLINE_CONFIGS.KL.submissionMethod).toBe('web_form');
      expect(AIRLINE_CONFIGS.IB.submissionMethod).toBe('email');
      expect(AIRLINE_CONFIGS.AZ.submissionMethod).toBe('email');
      expect(AIRLINE_CONFIGS.SK.submissionMethod).toBe('web_form');
      expect(AIRLINE_CONFIGS.TP.submissionMethod).toBe('email');
    });
  });

  describe('getAirlineConfig', () => {
    it('should return correct config by airline code', () => {
      const baConfig = getAirlineConfig('BA');
      expect(baConfig).toBeDefined();
      expect(baConfig?.airlineCode).toBe('BA');
      expect(baConfig?.airlineName).toBe('British Airways');
    });

    it('should return correct config by airline name', () => {
      const ryanairConfig = getAirlineConfig('Ryanair');
      expect(ryanairConfig).toBeDefined();
      expect(ryanairConfig?.airlineCode).toBe('FR');
      expect(ryanairConfig?.airlineName).toBe('Ryanair');
    });

    it('should return correct config by partial name match', () => {
      const easyjetConfig = getAirlineConfig('EasyJet');
      expect(easyjetConfig).toBeDefined();
      expect(easyjetConfig?.airlineCode).toBe('U2');
    });

    it('should return undefined for unknown airline', () => {
      const unknownConfig = getAirlineConfig('Unknown Airline');
      expect(unknownConfig).toBeUndefined();
    });

    it('should be case insensitive', () => {
      const baConfig1 = getAirlineConfig('british airways');
      const baConfig2 = getAirlineConfig('BRITISH AIRWAYS');
      expect(baConfig1).toEqual(baConfig2);
      expect(baConfig1?.airlineCode).toBe('BA');
    });
  });

  describe('getAllAirlineConfigs', () => {
    it('should return all airline configurations', () => {
      const configs = getAllAirlineConfigs();
      expect(configs).toHaveLength(10);
      expect(configs).toEqual(Object.values(AIRLINE_CONFIGS));
    });
  });

  describe('getAirlinesBySubmissionMethod', () => {
    it('should return correct airlines for email method', () => {
      const emailAirlines = getAirlinesBySubmissionMethod('email');
      expect(emailAirlines).toHaveLength(5);
      expect(emailAirlines.map((a) => a.airlineCode)).toContain('FR');
      expect(emailAirlines.map((a) => a.airlineCode)).toContain('LH');
      expect(emailAirlines.map((a) => a.airlineCode)).toContain('IB');
      expect(emailAirlines.map((a) => a.airlineCode)).toContain('AZ');
      expect(emailAirlines.map((a) => a.airlineCode)).toContain('TP');
    });

    it('should return correct airlines for web_form method', () => {
      const webFormAirlines = getAirlinesBySubmissionMethod('web_form');
      expect(webFormAirlines).toHaveLength(5);
      expect(webFormAirlines.map((a) => a.airlineCode)).toContain('BA');
      expect(webFormAirlines.map((a) => a.airlineCode)).toContain('U2');
      expect(webFormAirlines.map((a) => a.airlineCode)).toContain('AF');
      expect(webFormAirlines.map((a) => a.airlineCode)).toContain('KL');
      expect(webFormAirlines.map((a) => a.airlineCode)).toContain('SK');
    });

    it('should return empty array for postal method', () => {
      const postalAirlines = getAirlinesBySubmissionMethod('postal');
      expect(postalAirlines).toHaveLength(0);
    });
  });

  describe('generateSubmissionTemplate', () => {
    const mockClaimData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      flightNumber: 'BA123',
      departureDate: '2024-01-15',
      departureAirport: 'LHR',
      arrivalAirport: 'CDG',
      delayDuration: '3 hours',
      bookingReference: 'ABC123',
    };

    it('should generate email template for email submission method', () => {
      const ryanairConfig = AIRLINE_CONFIGS.FR;
      const template = generateSubmissionTemplate(ryanairConfig, mockClaimData);

      expect(template.type).toBe('email');
      expect(template.to).toBe('eu261@ryanair.com');
      expect(template.subject).toContain('EU261 Compensation Claim');
      expect(template.subject).toContain('BA123');
      expect(template.body).toContain('John Doe');
      expect(template.body).toContain('BA123');
      expect(template.body).toContain('3 hours');
      expect(template.attachments).toEqual(ryanairConfig.requiredDocuments);
    });

    it('should generate web form template for web_form submission method', () => {
      const baConfig = AIRLINE_CONFIGS.BA;
      const template = generateSubmissionTemplate(baConfig, mockClaimData);

      expect(template.type).toBe('web_form');
      expect(template.url).toBe(
        'https://www.britishairways.com/en-gb/information/legal/eu261'
      );
      expect(template.body).toContain('WEB FORM SUBMISSION INSTRUCTIONS');
      expect(template.body).toContain('John Doe');
      expect(template.body).toContain('BA123');
      expect(template.attachments).toEqual(baConfig.requiredDocuments);
    });

    it('should generate postal template for postal submission method', () => {
      // Create a mock postal airline config
      const postalConfig: AirlineConfig = {
        airlineCode: 'TEST',
        airlineName: 'Test Airline',
        submissionMethod: 'postal',
        postalAddress: '123 Test Street, Test City',
        requiredDocuments: ['boarding_pass', 'delay_proof'],
        requiredFields: ['passenger_name', 'flight_number'],
        expectedResponseTime: '2-4 weeks',
        followUpSchedule: ['2 weeks', '4 weeks'],
        specialInstructions: 'Test instructions',
        regulationCovered: 'EU261',
        contactPhone: '+1234567890',
        website: 'https://test.com',
        claimFormFields: {
          passenger_name: 'Passenger Name',
          flight_number: 'Flight Number',
        },
      };

      const template = generateSubmissionTemplate(postalConfig, mockClaimData);

      expect(template.type).toBe('postal');
      expect(template.address).toBe('123 Test Street, Test City');
      expect(template.body).toContain('POSTAL SUBMISSION INSTRUCTIONS');
      expect(template.body).toContain('John Doe');
      expect(template.body).toContain('BA123');
      expect(template.attachments).toEqual(postalConfig.requiredDocuments);
    });

    it('should include all required fields in template', () => {
      const baConfig = AIRLINE_CONFIGS.BA;
      const template = generateSubmissionTemplate(baConfig, mockClaimData);

      // Check that all required fields are included
      baConfig.requiredFields.forEach((field) => {
        if (field === 'passenger_name') {
          expect(template.body).toContain('John Doe');
        } else if (field === 'flight_number') {
          expect(template.body).toContain('BA123');
        } else if (field === 'departure_date') {
          expect(template.body).toContain('2024-01-15');
        } else if (field === 'delay_duration') {
          expect(template.body).toContain('3 hours');
        }
      });
    });

    it('should include special instructions in template', () => {
      const baConfig = AIRLINE_CONFIGS.BA;
      const template = generateSubmissionTemplate(baConfig, mockClaimData);

      expect(template.body).toContain(baConfig.specialInstructions);
    });

    it('should include follow-up schedule in template', () => {
      const baConfig = AIRLINE_CONFIGS.BA;
      const template = generateSubmissionTemplate(baConfig, mockClaimData);

      baConfig.followUpSchedule.forEach((schedule) => {
        expect(template.body).toContain(schedule);
      });
    });
  });

  describe('Configuration Validation', () => {
    it('should have valid URLs for web form airlines', () => {
      const webFormAirlines = getAirlinesBySubmissionMethod('web_form');
      webFormAirlines.forEach((config) => {
        expect(config.claimFormUrl).toBeTruthy();
        expect(config.claimFormUrl).toMatch(/^https?:\/\//);
      });
    });

    it('should have valid email addresses for email airlines', () => {
      const emailAirlines = getAirlinesBySubmissionMethod('email');
      emailAirlines.forEach((config) => {
        expect(config.claimEmail).toBeTruthy();
        expect(config.claimEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });

    it('should have valid contact information', () => {
      Object.values(AIRLINE_CONFIGS).forEach((config) => {
        expect(config.contactPhone).toBeTruthy();
        expect(config.website).toBeTruthy();
        expect(config.website).toMatch(/^https?:\/\//);
      });
    });

    it('should have consistent field mappings', () => {
      Object.values(AIRLINE_CONFIGS).forEach((config) => {
        expect(config.claimFormFields).toBeDefined();
        expect(typeof config.claimFormFields).toBe('object');

        // Check that required fields have mappings
        config.requiredFields.forEach((field) => {
          expect(config.claimFormFields[field]).toBeTruthy();
        });
      });
    });
  });
});
