import { AppError } from "../../../shared/domain/app-error.js";
import { fileStorageService } from "../infrastructure/file-storage.service.js";
import { submitPaymentProof } from "../infrastructure/persistence/payment.repository.js";
import { normalizePaymentStatus } from "../domain/payment.types.js";
import { findCaseById } from "../../cases/infrastructure/persistence/case.repository.js";
import logger from "../../../shared/infrastructure/logger.js";
import { prisma } from "../../../db.js";
import type { UploadPaymentProofRequest } from "./payments.dto.js";

type SavedProofFile = {
  fileUrl: string;
  publicId: string;
  resourceType: string;
};

type UploadPaymentProofDeps = {
  findCaseById?: typeof findCaseById;
  saveProofFile?: typeof fileStorageService.saveProofFile;
  deleteFile?: typeof fileStorageService.deleteFile;
  submitPaymentProof?: typeof submitPaymentProof;
};

const defaultDeps = {
  findCaseById,
  saveProofFile: fileStorageService.saveProofFile.bind(fileStorageService),
  deleteFile: fileStorageService.deleteFile.bind(fileStorageService),
  submitPaymentProof,
};

export async function uploadPaymentProofUseCase(
  userId: string,
  caseId: string,
  file: UploadPaymentProofRequest["file"],
  deps: UploadPaymentProofDeps = {},
) {
  const {
    findCaseById,
    saveProofFile,
    deleteFile,
    submitPaymentProof,
  } = {
    ...defaultDeps,
    ...deps,
  };
  const __log_start = Date.now();

  let _paymentId: string | undefined;
  let _fileUrl: string | undefined;

  try {
    const caseObj = await findCaseById(caseId);

    if (!caseObj) {
      throw new AppError(404, "CASE_NOT_FOUND", "Không tìm thấy dự án");
    }

    const packageId = caseObj.package_id;
    if (!packageId) {
      throw new AppError(400, "INVALID_PACKAGE", "Dự án chưa có gói dịch vụ hợp lệ");
    }

    // Find unpaid Payment directly
    const unpaidPayment = await prisma.payment.findFirst({
      where: { case_id: caseId, status: "unpaid" },
      orderBy: { created_at: "desc" },
    });
    if (!unpaidPayment) {
      throw new AppError(
        400,
        "NO_UNPAID_PAYMENT",
        "Không tìm thấy thông tin thanh toán đang chờ",
      );
    }
    _paymentId = unpaidPayment.id;

    const proofFile = (await saveProofFile(file)) as SavedProofFile;
    _fileUrl = proofFile.fileUrl;

    try {
      const payment = await submitPaymentProof({
        paymentId: unpaidPayment.id,
        caseId,
        proofFileUrl: proofFile.fileUrl,
        userId,
      });

      logger.info({ paymentId: _paymentId, fileUrl: _fileUrl, fileSize: file.size, duration_ms: Date.now() - __log_start }, "payment proof uploaded");

      return {
        ...payment,
        status: normalizePaymentStatus(payment.status),
      };
    } catch (dbError) {
      await deleteFile(proofFile.publicId);
      throw dbError;
    }
  } catch (error) {
    logger.error({ err: error, caseId, paymentId: _paymentId, fileUrl: _fileUrl, duration_ms: Date.now() - __log_start }, "payment proof upload failed");
    throw error;
  }
}
