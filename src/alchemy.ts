import { BigInt } from "@graphprotocol/graph-ts";
import { Wither, Defend, Vitality } from "../generated/Alchemy/Alchemy";
import { Vineyard } from "../generated/schema";

export function handleWither(event: Wither): void {
  let vineyard = Vineyard.load(event.params.target.toString()) as Vineyard;
  vineyard.witherDeadline = event.params.deadline;
  vineyard.save();
}

export function handleDefend(event: Defend): void {
  let vineyard = Vineyard.load(event.params.target.toString()) as Vineyard;
  vineyard.witherDeadline = BigInt.fromI32(0);
  vineyard.save();
}

export function handleVitality(event: Vitality): void {
  let vineyard = Vineyard.load(event.params.target.toString()) as Vineyard;
  vineyard.vitalized = true;
  vineyard.save();
}
