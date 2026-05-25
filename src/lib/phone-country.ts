export const PHONE_COUNTRY_MAP: Record<string, string> = {
  "+91": "India",
  "+63": "Philippines",
  "+62": "Indonesia",
  "+81": "Japan",
  "+1": "US/Canada",
  "+44": "UK",
  "+61": "Australia",
  "+353": "Ireland",
  "+351": "Portugal",
  "+34": "Spain",
  "+358": "Finland",
  "+39": "Italy",
  "+356": "Malta",
  "+30": "Greece",
  "+385": "Croatia",
  "+389": "North Macedonia",
  "+355": "Albania",
  "+383": "Kosovo",
  "+421": "Slovakia",
  "+40": "Romania",
  "+49": "Germany",
  "+33": "France",
  "+31": "Netherlands",
  "+46": "Sweden",
  "+47": "Norway",
  "+45": "Denmark",
  "+48": "Poland",
  "+43": "Austria",
  "+41": "Switzerland",
  "+36": "Hungary",
  "+380": "Ukraine",
  "+7": "Russia",
  "+86": "China",
  "+82": "South Korea",
  "+66": "Thailand",
  "+60": "Malaysia",
  "+65": "Singapore",
  "+84": "Vietnam",
  "+880": "Bangladesh",
  "+92": "Pakistan",
  "+94": "Sri Lanka",
  "+977": "Nepal",
  "+971": "UAE",
  "+966": "Saudi Arabia",
  "+20": "Egypt",
  "+27": "South Africa",
  "+234": "Nigeria",
  "+254": "Kenya",
  "+55": "Brazil",
  "+52": "Mexico",
  "+57": "Colombia",
  "+54": "Argentina",
};

/** Reverse map: country name -> list of dial prefixes */
export const COUNTRY_PREFIXES: Record<string, string[]> = {};
for (const [prefix, country] of Object.entries(PHONE_COUNTRY_MAP)) {
  if (!COUNTRY_PREFIXES[country]) COUNTRY_PREFIXES[country] = [];
  COUNTRY_PREFIXES[country].push(prefix);
}

export function detectCountry(phone: string): string {
  const cleaned = phone.replace(/^p:/, "").trim();
  if (!cleaned || !cleaned.startsWith("+")) return "Unknown";
  for (const len of [4, 3, 2]) {
    const prefix = cleaned.slice(0, len + 1);
    if (PHONE_COUNTRY_MAP[prefix]) return PHONE_COUNTRY_MAP[prefix];
  }
  return "Other";
}
