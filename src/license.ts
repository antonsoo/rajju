export const LICENSE_NAME = "PolyForm-Noncommercial-1.0.0";
export const LICENSE_URL = "https://polyformproject.org/licenses/noncommercial/1.0.0";
export const REQUIRED_NOTICE =
  "Required Notice: Copyright (c) 2026 Anthony Mercer (https://github.com/antonsoo/rajju)";
export const licenseNoticeHtml = `<p class="small">New code, drawings and English: <a href="${LICENSE_URL}">PolyForm Noncommercial License 1.0.0</a>.<br>${REQUIRED_NOTICE}</p>`;

/** Keep each CSV rectangular while carrying the same reusable-file notice. */
export function licensedRows(rows: unknown[][]): unknown[][] {
  return rows.map((row, index) => [
    ...row,
    ...(index === 0
      ? ["license", "license_url", "required_notice"]
      : [LICENSE_NAME, LICENSE_URL, REQUIRED_NOTICE]),
  ]);
}
