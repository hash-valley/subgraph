import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Account } from "../generated/schema";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// SET TO CURRENT NETWORK CONFIG
export const SALES_PARAMS_ADDRESS = "0x5b4BfDEDf7c1e70B6eaE2665ce630FEC54950F16"; // GOERLI

export function getOrCreateAccount(address: Bytes): Account {
  let account = Account.load(address.toHex());
  if (account == null) {
    account = new Account(address.toHex());
    account.vinegarBalance = BigInt.fromString("0");
    account.giveawayBalance = BigInt.fromString("0");
    account.giveawayAllowance = BigInt.fromString("0");
    account.grapeBalance = BigInt.fromString("0");
    account.save();
  }
  return account as Account;
}
