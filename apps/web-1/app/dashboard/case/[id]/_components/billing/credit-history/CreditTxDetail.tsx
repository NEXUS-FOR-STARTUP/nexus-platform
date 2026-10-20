import { ORDER_REFERENCE_TYPE, type CreditEntry } from "../../credit-history.types";
import TxMetaBlock from "./TxMetaBlock";
import TxOrderBlock from "./TxOrderBlock";

/** `opened` gates the lazy order fetch: closed rows never hit the API. */
export default function CreditTxDetail({ entry, opened }: { entry: CreditEntry; opened: boolean }) {
  const orderId = opened && entry.reference_type === ORDER_REFERENCE_TYPE ? entry.reference_id : null;
  return (
    <>
      <TxMetaBlock entry={entry} />
      <TxOrderBlock orderId={orderId} />
    </>
  );
}
