import Blockchains from "@depay/web3-blockchains";
import * as React from "react";
import { Label } from "~/lib/ui/label";
import Link from "next/link";
import ID from "~/app/[local]/_components/id";
import Image from "next/image";
import { Badge } from "~/lib/ui/badge";
import { formatDate } from "~/lib/utils";

export default function PaymentInfo({ paymentInfo }: { paymentInfo: any }) {
  const blockchain = Blockchains.findByName(paymentInfo.blockchain as string)!;
  const token = blockchain.tokens.find(
    (token) => token.address === paymentInfo.token,
  )!;

  const Item = ({
    children,
    label,
    value,
  }: {
    children?: React.ReactNode;
    label: string;
    value?: string;
  }) => {
    return (
      <div className="flex items-center space-x-4">
        <Label className="w-[8rem] text-right">{label} :</Label>
        {children ? children : <span>{value}</span>}
      </div>
    );
  };

  return (
    <div className="flex flex-col space-y-4">
      <Item label="Transaction">
        <Link
          className="underline"
          href={
            blockchain.explorerUrlFor({
              transaction: paymentInfo.transaction,
            }) ?? "#"
          }
          target="_blank"
        >
          <ID id={paymentInfo.transaction} />
        </Link>
      </Item>
      <Item label="Blockchain">
        <Image
          src={blockchain.logo}
          alt={blockchain.name}
          width={24}
          height={24}
          style={{ backgroundColor: blockchain.logoBackgroundColor }}
        />
        <span>{blockchain.fullName}</span>
      </Item>
      <Item label="Amount" value={paymentInfo.amount} />
      <Item label="Sender">
        <Link
          className="underline"
          href={
            blockchain.explorerUrlFor({
              address: paymentInfo.sender,
            }) ?? "#"
          }
          target="_blank"
        >
          <ID id={paymentInfo.sender} />
        </Link>
      </Item>
      <Item label="Receiver">
        <Link
          className="underline"
          href={
            blockchain.explorerUrlFor({
              address: paymentInfo.receiver,
            }) ?? "#"
          }
          target="_blank"
        >
          <ID id={paymentInfo.receiver} />
        </Link>
      </Item>
      <Item label="Token">
        <Image src={token.logo} alt={token.name} width={24} height={24} />
        <span>{token.symbol}</span>
      </Item>
      <Item label="Status">
        <Badge className="rounded-md px-2 py-1 text-white">
          {paymentInfo.status}
        </Badge>
      </Item>
      <Item label="Commitment" value={paymentInfo.commitment} />
      <Item
        label="Created At"
        value={formatDate(new Date(paymentInfo.created_at as string))}
      />
      <Item label="After Block" value={paymentInfo.after_block} />
      <Item label="Confirmations" value={paymentInfo.confirmations} />
      <Item
        label="Confirmed At"
        value={
          paymentInfo.confirmed_at &&
          formatDate(new Date(paymentInfo.confirmed_at as string))
        }
      />
    </div>
  );
}
