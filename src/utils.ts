import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Account } from "../generated/schema";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function getOrCreateAccount(address: Bytes): Account {
  let account = Account.load(address.toHex());
  if (account == null) {
    account = new Account(address.toHex());
    account.vinegarBalance = BigInt.fromString("0");
  }
  account.save();
  return account as Account;
}
