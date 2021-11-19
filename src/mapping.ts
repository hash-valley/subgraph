import {
  Transfer as BottleTransfer,
  WineBottleV1 as BottleContract,
  Rejuvenated,
} from "../generated/WineBottleV1/WineBottleV1";
import {
  Transfer as VineyardTransfer,
  VineyardMinted,
  Planted,
  Harvested,
  VineyardV1 as VineContract,
  Start,
} from "../generated/VineyardV1/VineyardV1";
import { Transfer as VinegarTransfer } from "../generated/Vinegar/Vinegar";
import {
  Staked,
  Withdrawn,
  Spoiled,
  CellarV1 as CellarContract,
} from "../generated/Cellar/CellarV1";
import {
  AddressesSet,
  AddressStorage as ASContract,
} from "../generated/AddressStorage/AddressStorage";
import { Vineyard, Bottle, Account, VineProtocol } from "../generated/schema";
import { BigInt, Bytes } from "@graphprotocol/graph-ts";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function getOrCreateAccount(address: Bytes): Account {
  let account = Account.load(address.toHex());
  if (account == null) {
    account = new Account(address.toHex());
    account.vinegarBalance = BigInt.fromString("0");
  }
  account.save();
  return account as Account;
}

export function handleVinegarTransfer(event: VinegarTransfer): void {
  if (event.params.from.toHex() != ZERO_ADDRESS) {
    let from = Account.load(event.params.from.toHex());
    from.vinegarBalance = from.vinegarBalance.minus(event.params.value);
    from.save();
  }

  if (event.params.to.toHex() != ZERO_ADDRESS) {
    let to = Account.load(event.params.to.toHex());
    to.vinegarBalance = to.vinegarBalance.plus(event.params.value);
    to.save();
  }
}

export function handleBottleTransfer(event: BottleTransfer): void {
  let bottle = Bottle.load(event.params.tokenId.toHex());
  if (bottle == null || event.params.from.toHex() == ZERO_ADDRESS) {
    bottle = new Bottle(event.params.tokenId.toHex());
    bottle.tokenId = event.params.tokenId;
    bottle.inCellar = false;
    bottle.spoiled = false;
    bottle.canEnterCellar = true;
    bottle.burnt = false;

    let contract = BottleContract.bind(event.address);
    bottle.attributes = contract.attributes(event.params.tokenId);
  }

  let cellarAddress = VineProtocol.load("0").cellar.toHex();
  if (
    event.params.to.toHex() != cellarAddress &&
    event.params.to.toHex() != ZERO_ADDRESS
  ) {
    let account = getOrCreateAccount(event.params.to);
    bottle.owner = account.id;
  }
  bottle.save();
}

export function handleVineyardTransfer(event: VineyardTransfer): void {
  let vineyard = Vineyard.load(event.params.tokenId.toHex());
  if (vineyard == null || event.params.from.toHex() == ZERO_ADDRESS) {
    vineyard = new Vineyard(event.params.tokenId.toHex());
    vineyard.tokenId = event.params.tokenId;
    vineyard.location = 0;
    vineyard.elevation = 0;
    vineyard.soil = 0;
    vineyard.xp = BigInt.fromI32(0);
    vineyard.seasonsPlanted = [];
    vineyard.seasonsHarvested = [];
  }
  let account = getOrCreateAccount(event.params.to);
  vineyard.owner = account.id;
  vineyard.save();
}

export function handleVineyardMinted(event: VineyardMinted): void {
  let vineyard = Vineyard.load(event.params.tokenId.toHex());
  vineyard.location = event.params.location.toI32();
  vineyard.elevation = event.params.elevation.toI32();
  if (event.params.elevationNegative.toI32() == 1) {
    vineyard.elevation *= -1;
  }
  vineyard.soil = event.params.soilType.toI32();
  vineyard.save();

  let vineProtocol = VineProtocol.load("0");
  vineProtocol.mintedVineyards = vineProtocol.mintedVineyards + 1;
  vineProtocol.save();
}

export function handlePlanted(event: Planted): void {
  let vineyard = Vineyard.load(event.params.tokenId.toHex());
  vineyard.seasonsPlanted = vineyard.seasonsPlanted.concat([
    event.params.season.toI32(),
  ]);
  vineyard.save();
}

export function handleHarvested(event: Harvested): void {
  let vineyard = Vineyard.load(event.params.tokenId.toHex());
  vineyard.seasonsHarvested = vineyard.seasonsHarvested.concat([
    event.params.season.toI32(),
  ]);

  let contract = VineContract.bind(event.address);
  vineyard.xp = contract.xp(event.params.tokenId);
  vineyard.save();

  let bottle = Bottle.load(event.params.bottleId.toHex());
  bottle.from = vineyard.id;
  bottle.save();
}

export function handleStaked(event: Staked): void {
  let bottle = Bottle.load(event.params.tokenId.toHex());
  bottle.inCellar = true;
  bottle.canEnterCellar = false;
  bottle.save();
}

export function handleWithdrawn(event: Withdrawn): void {
  let bottle = Bottle.load(event.params.tokenId.toHex());
  bottle.inCellar = false;
  bottle.save();
}

export function handleSpoiled(event: Spoiled): void {
  let bottle = Bottle.load(event.params.tokenId.toHex());
  bottle.spoiled = true;
  bottle.inCellar = false;

  let contract = CellarContract.bind(event.address);
  bottle.rejuvenateCost = contract.cellarTime(event.params.tokenId);
  bottle.save();
}

export function handleRejuvenated(event: Rejuvenated): void {
  let oldBottle = Bottle.load(event.params.oldTokenId.toHex());
  oldBottle.owner = ZERO_ADDRESS;
  oldBottle.burnt = true;
  oldBottle.rejuvenatedTo = event.params.newTokenId.toHex();
  oldBottle.save();

  let newBottle = Bottle.load(event.params.newTokenId.toHex());
  newBottle.rejuvenatedFrom = oldBottle.id;
  newBottle.save();
}

export function handleStart(event: Start): void {
  let protocol = VineProtocol.load("0");
  protocol.gameStarted = true;
  protocol.save();
}

export function handleAddressesSet(event: AddressesSet): void {
  let vineProtocol = new VineProtocol("0");
  vineProtocol.gameStarted = false;

  let asContract = ASContract.bind(event.address);
  vineProtocol.cellar = asContract.cellar();
  vineProtocol.vinegar = asContract.vinegar();
  let vineAddress = asContract.vineyard();
  vineProtocol.vineyard = vineAddress;
  vineProtocol.bottle = asContract.bottle();

  let vineContract = VineContract.bind(vineAddress);
  vineProtocol.maxVineyards = vineContract.maxVineyards().toI32();
  vineProtocol.mintedVineyards = 0;

  vineProtocol.save();

  let account = new Account(ZERO_ADDRESS);
  account.vinegarBalance = BigInt.fromString("0");
  account.save();
}
