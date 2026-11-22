// Deprecated mockData - PhishingGuard now uses dynamic backend APIs.
// Preserved type shapes to guarantee backward compatibility without compilation errors.
import { UrlFeatures, ScanResult } from '../types';

export function extractUrlFeatures(inputUrl: string): UrlFeatures {
  return {
    URLLength: inputUrl.length,
    DomainLength: 10,
    IsDomainIP: 0,
    TLDLength: 3,
    NoOfSubDomain: 0,
    NoOfLettersInURL: 10,
    LetterRatioInURL: 0.8,
    NoOfDegitsInURL: 0,
    DegitRatioInURL: 0,
    NoOfEqualsInURL: 0,
    NoOfQMarkInURL: 0,
    NoOfAmpersandInURL: 0,
    NoOfOtherSpecialCharsInURL: 0,
    SpacialCharRatioInURL: 0,
    IsHTTPS: inputUrl.startsWith('https://') ? 1 : 0,
    CharContinuationRate: 0.5
  };
}

export const initialMockScans: any[] = [];
