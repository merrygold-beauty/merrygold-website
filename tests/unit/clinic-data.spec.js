import { test, expect } from '@playwright/test';
import {
  WHATSAPP_E164,
  WHATSAPP_DISPLAY,
  buildWhatsAppUrl,
  clinicData,
  formatClinicAddress,
  getLocalBusinessSchema
} from '../../src/data/clinic.js';
import { CANONICAL_ORIGIN, CLINIC } from '../support/site.js';

const digits = (value) => String(value).replace(/\D/g, '');

test.describe('Clinic facts and business data', () => {
  test('UNT-C01 WhatsApp messages survive line breaks, ampersands and pound signs', () => {
    const message = 'Hello MerryGold\nName: A & B\nBudget: £40';
    const url = new URL(buildWhatsAppUrl(message));
    expect(url.host).toBe('wa.me');
    expect(url.searchParams.get('text')).toBe(message);
  });

  test('UNT-C02 the two WhatsApp constants are the same number', () => {
    expect(digits(WHATSAPP_DISPLAY)).toBe(WHATSAPP_E164);
  });

  test('UNT-C03 the telephone link dials the number that is displayed', () => {
    expect(digits(clinicData.contact.phoneHref)).toBe(digits(clinicData.contact.phone));
    expect(clinicData.contact.phoneHref).toBe(CLINIC.phoneHref);
  });

  test('UNT-C04 the address reads street, area, city and postcode', () => {
    expect(formatClinicAddress()).toBe('Suite C, Weller House, Longbridge Road, Barking, London IG11 8RT');
  });

  test('UNT-C05 the legal entity matches Companies House', () => {
    expect(clinicData.legalName).toBe(CLINIC.legalName);
    expect(clinicData.companyNumber).toBe(CLINIC.companyNumber);
  });

  test('UNT-C06 business structured data points at the canonical site and matches the clinic facts', () => {
    const schema = getLocalBusinessSchema();
    expect(schema['@type']).toBe('BeautySalon');
    expect(schema.url).toBe(CANONICAL_ORIGIN);
    expect(schema['@id']).toMatch(new RegExp(`^${CANONICAL_ORIGIN}`));
    expect(schema.address.streetAddress).toBe(clinicData.contact.address.street);
    expect(schema.address.postalCode).toBe(CLINIC.postcode);
    expect(digits(schema.telephone)).toBe(digits(clinicData.contact.phone));
    // The social profiles leave the schema while the site's links are down.
    if (clinicData.social.showLinks) {
      expect(schema.sameAs).toEqual(expect.arrayContaining([CLINIC.instagram, CLINIC.tiktok]));
    } else {
      expect(schema.sameAs).toBeUndefined();
    }
    expect(schema.image).toMatch(/^https:\/\//);
  });

  test('UNT-C07 structured data opening hours agree with the hours shown on the site', () => {
    const schema = getLocalBusinessSchema();
    const shown = clinicData.contact.openingHours.map((entry) => entry.hours.replace(/\s/g, ''));
    const marked = schema.openingHoursSpecification.map((spec) => `${spec.opens}-${spec.closes}`);
    expect(marked).toEqual(shown);
  });

  test('UNT-C08 structured data gives map coordinates so Google can place the clinic', () => {
    const schema = getLocalBusinessSchema();
    expect(schema.geo, 'add geo latitude and longitude for Weller House, IG11 8RT').toMatchObject({
      '@type': 'GeoCoordinates',
      latitude: expect.any(Number),
      longitude: expect.any(Number)
    });
  });

  test('UNT-C09 go-live: WhatsApp routes to the clinic, not the test handset', () => {
    test.skip(!process.env.MG_GO_LIVE, 'set MG_GO_LIVE=1 for the pre-launch run');
    expect(WHATSAPP_E164).toBe(CLINIC.whatsappClinic);
  });
});
