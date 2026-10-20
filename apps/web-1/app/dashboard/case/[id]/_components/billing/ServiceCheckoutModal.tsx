"use client";

import { useState } from "react";
import { Modal, Select } from "@mantine/core";
import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import { notifications } from "@mantine/notifications";
import { useWalletBalance } from "@/app/dashboard/wallet/hooks/useWallet";
import { useServiceCatalog, filterPackagesByService } from "@/hooks/useServiceCatalog";
import { useShortageDepositRedirect } from "../use-shortage-deposit-redirect";
import { usePlaceServiceOrder } from "./usePlaceServiceOrder";
import { formatVndAmount } from "@/lib/pricing";
import DiscountCodeInput from "../DiscountCodeInput";
import { Button } from "../ui/Button";
import s from "./service-checkout.module.css";
import { MAX_TEAM_MEMBERS, type DiscountCodeCheckResult } from "@repo/validation";

interface ServiceCheckoutModalProps {
  caseId: string;
  serviceCode: string;
  stageName: string;
  opened: boolean;
  onClose: () => void;
  onPurchased?: () => void;
}

const MIN_TOPUP_AMOUNT = 2000;
const MIN_PACKAGES = 1;
const MAX_PACKAGES = 50;
/** Giá/thành viên luôn tính theo nhóm đủ người, độc lập với số thành viên đã khai. */
const PRICING_TEAM_SIZE = MAX_TEAM_MEMBERS;

export default function ServiceCheckoutModal({
  caseId,
  serviceCode,
  stageName,
  opened,
  onClose,
  onPurchased,
}: ServiceCheckoutModalProps) {
  const { data: allPackages, isLoading: isCatalogLoading } = useServiceCatalog();
  const availablePackages = filterPackagesByService(allPackages, serviceCode);
  const [pickedPackageId, setPickedPackageId] = useState<string>("");
  const selectedPackageId = pickedPackageId || availablePackages[0]?.id || "";
  const [quantity, setQuantity] = useState<number>(MIN_PACKAGES);
  const [discount, setDiscount] = useState<DiscountCodeCheckResult | null>(null);

  const handleSelectPackage = (newId: string | null) => {
    if (newId && newId !== selectedPackageId) {
      setPickedPackageId(newId);
      setDiscount(null);
    }
  };

  const { data: walletData } = useWalletBalance();
  const walletBalance = walletData?.balance ?? 0;
  const { startShortageDeposit, isPending: isShortagePending } = useShortageDepositRedirect(caseId);
  const { placeOrder, isPending: isOrderPending, resetSession } = usePlaceServiceOrder(caseId);

  const selectedPkg = availablePackages.find((p) => p.id === selectedPackageId);
  const listPrice = selectedPkg?.price ?? 0;
  const unitPrice = discount?.discounted_price ?? listPrice;
  const totalAmount = quantity * unitPrice;
  const creditsPerPackage = selectedPkg?.credits_granted ?? 0;
  const totalCredits = quantity * creditsPerPackage;
  const perMemberPrice = totalAmount > 0 ? Math.round(totalAmount / PRICING_TEAM_SIZE) : null;
  const shortage = Math.max(totalAmount - walletBalance, 0);
  const hasSufficientBalance = shortage === 0;

  const handleClose = () => {
    resetSession();
    setDiscount(null);
    onClose();
  };

  const handlePay = async () => {
    if (!selectedPackageId) return;
    if (hasSufficientBalance) {
      placeOrder({ packageId: selectedPackageId, quantity, discountCode: discount?.code }, () => {
        notifications.show({
          color: "green",
          title: "Thành công",
          message: `Đã mua thành công ${quantity * (selectedPkg?.credits_granted ?? 1)} lượt chấm ${stageName}.`,
        });
        onPurchased?.();
        handleClose();
      });
    } else {
      const suggested = Math.max(shortage, MIN_TOPUP_AMOUNT);
      await startShortageDeposit({
        quantity,
        suggestedTopup: suggested,
        packageId: selectedPackageId,
        discountCode: discount?.code,
      });
    }
  };

  const clampQuantity = (n: number) => Math.min(Math.max(n, MIN_PACKAGES), MAX_PACKAGES);

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`Mua lượt chấm - ${stageName}`}
      centered
      size={480}
      radius="md"
      padding="xl"
      classNames={{ title: s.title }}
    >
      {isCatalogLoading ? (
        <p className={s.empty}>Đang tải gói dịch vụ...</p>
      ) : availablePackages.length === 0 ? (
        <div className={s.empty}>
          <p>Dịch vụ này hiện chưa mở bán gói. Vui lòng quay lại sau.</p>
          <Button variant="quiet" onClick={handleClose}>Đóng</Button>
        </div>
      ) : (
        <div className={s.body}>
          {availablePackages.length > 1 && (
            <Select
              label="Chọn gói"
              value={selectedPackageId}
              onChange={handleSelectPackage}
              allowDeselect={false}
              data={availablePackages.map((p) => ({ value: p.id, label: `${p.credits_granted ?? 0} lượt chấm (${formatVndAmount(p.price)})` }))}
            />
          )}

          <div className={s.summary}>
            <div className={s.pack}>
              <b>{`Gói chấm ${stageName}`}</b>
              {creditsPerPackage > 0 && <span>{`${creditsPerPackage} lượt chấm / gói`}</span>}
            </div>
            {perMemberPrice !== null ? (
              <>
                <p className={s.price}>
                  {formatVndAmount(perMemberPrice)}
                  <span className={s.unit}> / thành viên</span>
                </p>
                <p className={s.split}>
                  {`Tổng ${formatVndAmount(totalAmount)} chia đều cho nhóm ${PRICING_TEAM_SIZE} người`}
                </p>
              </>
            ) : (
              <p className={s.price}>{formatVndAmount(totalAmount)}</p>
            )}
          </div>

          <div className={s.qty}>
            <span className={s.qtyLabel} id="checkout-qty-label">Số gói muốn mua</span>
            <div className={s.stepper} role="group" aria-labelledby="checkout-qty-label">
              <button type="button" className={s.step} aria-label="Giảm số gói" disabled={quantity <= MIN_PACKAGES} onClick={() => setQuantity(clampQuantity(quantity - 1))}>
                <MinusIcon size={16} aria-hidden="true" />
              </button>
              <output className={s.qtyValue} aria-live="polite">{quantity}</output>
              <button type="button" className={s.step} aria-label="Tăng số gói" disabled={quantity >= MAX_PACKAGES} onClick={() => setQuantity(clampQuantity(quantity + 1))}>
                <PlusIcon size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          <DiscountCodeInput packageId={selectedPackageId} applied={discount} onChange={setDiscount} />

          <dl className={s.receipt}>
            {creditsPerPackage > 0 && (
              <div className={s.row}>
                <dt>Bạn nhận được</dt>
                <dd>{`${totalCredits} lượt chấm`}</dd>
              </div>
            )}
            <div className={s.row}>
              <dt>Số dư ví</dt>
              <dd>{formatVndAmount(walletBalance)}</dd>
            </div>
            <div className={`${s.row} ${s.total}`}>
              <dt>Tổng thanh toán</dt>
              <dd>{formatVndAmount(totalAmount)}</dd>
            </div>
          </dl>
          {!hasSufficientBalance && <p className={s.short}>Ví thiếu {formatVndAmount(shortage)}</p>}

          <Button fullWidth size="lg" loading={isOrderPending || isShortagePending} onClick={handlePay}>
            {hasSufficientBalance
              ? `Thanh toán ${formatVndAmount(totalAmount)} bằng ví`
              : `Nạp ${formatVndAmount(Math.max(shortage, MIN_TOPUP_AMOUNT))} & mua`}
          </Button>
        </div>
      )}
    </Modal>
  );
}
