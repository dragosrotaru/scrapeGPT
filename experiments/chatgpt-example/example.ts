interface LicenseData {
  name: string;
  stateOfLicense: string;
  recordLastUpdated: string;
  businessAddress: string;
  licenseNumber: string;
  CPEID: string;
  registrationNumber: string;
  licenseStatus: string;
  licenseType: string;
  basisForLicense: string;
  issueDate: string;
  expirationDate: string;
}

const licenseData: LicenseData = {
  name: "BRENDA KAY RAAB",
  stateOfLicense: "TX",
  recordLastUpdated: "2023-02-11",
  businessAddress: "VICTORIA, TX, USA",
  licenseNumber: "086848",
  CPEID: "CPE-10B021",
  registrationNumber: "",
  licenseStatus: "ISSUED",
  licenseType: "CPA",
  basisForLicense: "EXAM",
  issueDate: "2006-01-20",
  expirationDate: "2023-08-31",
};

function extractDataFromHTML(html: string): any {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const name = doc.querySelector(".jurisdiction_header strong")?.textContent;
  const stateOfLicense = doc.querySelector(".datarow a strong")?.textContent;
  const lastUpdated = doc.querySelector(
    '.datarow [style="font-size:1.25em;"] strong'
  )?.textContent;

  const address = doc.querySelector(
    ".contact_row td:nth-child(3)"
  )?.textContent;
  const licenseNumber = doc.querySelector(
    '[align="left"]:nth-child(1) + td'
  )?.textContent;
  const cpeId = doc.querySelector(
    '[align="left"]:nth-child(2) + td'
  )?.textContent;
  const licenseStatus = doc.querySelector(
    '[align="left"]:nth-child(4) + td'
  )?.textContent;
  const licenseType = doc.querySelector(
    '[align="left"]:nth-child(5) + td'
  )?.textContent;
  const basisForLicense = doc.querySelector(
    '[align="left"]:nth-child(6) + td'
  )?.textContent;
  const issueDate = doc.querySelector(
    '[align="left"]:nth-child(7) + td'
  )?.textContent;
  const expirationDate = doc.querySelector(
    '[align="left"]:nth-child(8) + td'
  )?.textContent;

  return {
    name,
    stateOfLicense,
    lastUpdated,
    address,
    licenseNumber,
    cpeId,
    licenseStatus,
    licenseType,
    basisForLicense,
    issueDate,
    expirationDate,
  };
}
