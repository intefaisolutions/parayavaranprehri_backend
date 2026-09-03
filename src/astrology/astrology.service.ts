import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { find } from 'geo-tz';
import { GeoService } from '../geo/geo.service';
import { ProkeralaService } from '../prokerala/prokerala.service';
import { Person, PersonDocument } from '../persons/schemas/person.schema';
import { CalculateRashiDto } from './dto/calculate-rashi.dto';

const RASHI_MAP: Record<number, { hindi: string; english: string }> = {
  0: { hindi: 'Mesh', english: 'Aries' },
  1: { hindi: 'Vrishabh', english: 'Taurus' },
  2: { hindi: 'Mithun', english: 'Gemini' },
  3: { hindi: 'Kark', english: 'Cancer' },
  4: { hindi: 'Singh', english: 'Leo' },
  5: { hindi: 'Kanya', english: 'Virgo' },
  6: { hindi: 'Tula', english: 'Libra' },
  7: { hindi: 'Vrishchik', english: 'Scorpio' },
  8: { hindi: 'Dhanu', english: 'Sagittarius' },
  9: { hindi: 'Makar', english: 'Capricorn' },
  10: { hindi: 'Kumbh', english: 'Aquarius' },
  11: { hindi: 'Meen', english: 'Pisces' },
};

@Injectable()
export class AstrologyService {
  private readonly logger = new Logger(AstrologyService.name);

  constructor(
    private readonly geoService: GeoService,
    private readonly prokeralaService: ProkeralaService,
    @InjectModel(Person.name) private readonly personModel: Model<PersonDocument>,
  ) {}

  async calculateAndSaveRashi(userId: string, dto: CalculateRashiDto) {
    // Find the linked Person profile
    const person = await this.personModel.findOne({ createdByUserId: userId, isDeleted: false });
    if (!person) {
      // In this project, citizens are identified by their phone/email which links to a Person document.
      // Often createdByUserId or similar fields map the user to the person.
      // If we don't find it by createdByUserId, maybe we shouldn't throw error but handle it gracefully,
      // but assuming standard flow, we will throw NotFound.
      throw new NotFoundException('No Person profile linked to the logged-in user to save astrology details');
    }

    // 1. Geocode the birth place
    const { latitude, longitude } = await this.geoService.geocode(dto.birthPlace);

    // 2. Resolve timezone using geo-tz
    let timezone = 'Asia/Kolkata';
    try {
      const tzResult = find(latitude, longitude);
      if (tzResult && tzResult.length > 0) {
        timezone = tzResult[0];
      }
    } catch (err) {
      this.logger.warn(`Could not resolve timezone for ${latitude}, ${longitude}. Defaulting to Asia/Kolkata.`);
    }

    // 3. Construct ISO-8601 datetime
    // Example format required by Prokerala: 2004-02-12T15:15:00+05:30
    // We can use the date and time strings directly. We just need to construct a valid ISO string.
    // However, if we just pass the naive string to Date and format it, it might shift.
    // We will just construct a string and rely on the API to parse it with the given timezone offset,
    // OR we format it with the timezone offset. 
    // Wait, prokerala expects datetime ISO 8601 with timezone offset.
    // Let's get the offset for the specific date and timezone.
    const datetimeStr = this.formatDatetimeWithOffset(dto.dateOfBirth, dto.timeOfBirth, timezone);

    // 4. Call Prokerala
    const kundli = await this.prokeralaService.getKundli(latitude, longitude, datetimeStr);
    
    const chandraRasi = kundli?.data?.nakshatra_details?.chandra_rasi;
    if (!chandraRasi || typeof chandraRasi.id !== 'number') {
      throw new InternalServerErrorException('Unexpected response from Prokerala API');
    }

    const rashiData = RASHI_MAP[chandraRasi.id];
    if (!rashiData) {
      throw new InternalServerErrorException(`Unknown rashi ID from Prokerala: ${chandraRasi.id}`);
    }

    // 5. Save to Person
    person.dob = new Date(`${dto.dateOfBirth}T00:00:00.000Z`); // Save dob as UTC date
    person.timeOfBirth = dto.timeOfBirth;
    person.birthPlace = dto.birthPlace;
    person.birthLatitude = latitude;
    person.birthLongitude = longitude;
    person.birthTimezone = timezone;
    person.rashi = rashiData.hindi;
    person.rashiEnglish = rashiData.english;
    
    await person.save();

    // 6. Return response
    return {
      rashi: person.rashi,
      rashiEnglish: person.rashiEnglish,
      birthDetails: {
        dateOfBirth: dto.dateOfBirth,
        timeOfBirth: person.timeOfBirth,
        birthPlace: person.birthPlace,
      },
      location: {
        latitude: person.birthLatitude,
        longitude: person.birthLongitude,
        timezone: person.birthTimezone,
      },
    };
  }

  /**
   * Helper to format YYYY-MM-DD and HH:mm:ss in a specific IANA timezone into an ISO8601 string with offset.
   * Node's Intl.DateTimeFormat can be used to get the offset.
   */
  private formatDatetimeWithOffset(date: string, time: string, timeZone: string): string {
    // Construct a naive date string, parse it as if it is in UTC, then find the offset
    // Using Intl.DateTimeFormat is a robust way without external libs like moment-timezone.
    const dateObj = new Date(`${date}T${time}Z`);
    
    // Get the formatted parts in the target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'shortOffset',
    });

    // We can format a UTC date that represents the exact same local time, and get the offset.
    // A simpler way: we know Prokerala wants `YYYY-MM-DDTHH:mm:ss+HH:MM`
    // We can use Intl.DateTimeFormat on the current epoch to find the offset, but offset can change due to DST!
    // So we must find the offset for THAT specific date.
    const parts = formatter.formatToParts(new Date(`${date}T12:00:00Z`)); // Use noon to avoid edge cases
    const offsetPart = parts.find(p => p.type === 'timeZoneName')?.value; // e.g. "GMT+5:30" or "GMT-4" or just "GMT"
    
    let offset = '+00:00';
    if (offsetPart && offsetPart !== 'GMT') {
      let rawOffset = offsetPart.replace('GMT', ''); // e.g. "+5:30" or "-4"
      if (!rawOffset.includes(':')) {
        rawOffset += ':00';
      }
      // Ensure two digits for hour
      const sign = rawOffset.startsWith('-') ? '-' : '+';
      const [hourStr, minuteStr] = rawOffset.substring(1).split(':');
      const paddedHour = hourStr.padStart(2, '0');
      offset = `${sign}${paddedHour}:${minuteStr}`;
    }

    return `${date}T${time}${offset}`;
  }
}
