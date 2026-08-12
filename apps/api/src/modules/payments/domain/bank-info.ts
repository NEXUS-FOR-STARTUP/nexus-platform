export interface BankInfo {
  bankName: string;
  bankShortCode: string;
  accountNumber: string;
  accountName: string;
  transferContent: string;
  qrUrl: string;
}

export function getDepositBankInfo(transferContent: string, amount: number) {
  const bankShortCode = process.env["SEPAY_BANK_SHORT_CODE"] || "ACB";
  const accountNumber = process.env["SEPAY_ACCOUNT_NUMBER"] || "";
  const accountName = process.env["SEPAY_ACCOUNT_NAME"] || "NEXUS PLATFORM";
  const bankName = process.env["SEPAY_BANK_NAME"] || "ACB (Ngân hàng Á Châu)";
  const qrUrl = `https://vietqr.app/img?acc=${accountNumber}&bank=${bankShortCode}&amount=${amount}&des=${encodeURIComponent(transferContent)}&template=compact`;
  return { bankName, bankShortCode, accountNumber, accountName, transferContent, qrUrl };
}

export function getBankInfo(transferContent: string, amount: number) {
  const bankShortCode = process.env["BANK_SHORT_CODE"] || "MB";
  const accountNumber = process.env["BANK_ACCOUNT_NUMBER"] || "0909090909";
  const accountName = process.env["BANK_ACCOUNT_NAME"] || "NEXUS PLATFORM";
  const bankName = process.env["BANK_NAME"] || "MB Bank (Ngân hàng Quân Đội)";
  const qrUrl = `https://vietqr.app/img?acc=${accountNumber}&bank=${bankShortCode}&amount=${amount}&des=${encodeURIComponent(transferContent)}&template=compact`;
  return { bankName, bankShortCode, accountNumber, accountName, transferContent, qrUrl };
}
