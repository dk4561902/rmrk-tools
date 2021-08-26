import { NFT } from "../../classes/nft";
import {
  BaseConsolidated,
  CollectionConsolidated,
  NFTConsolidated,
} from "./consolidator";
import { Collection } from "../../classes/collection";
import { decodeAddress, encodeAddress } from "@polkadot/keyring";
import { hexToU8a, isHex } from "@polkadot/util";
import { IConsolidatorAdapter } from "./adapters/types";
import { Base } from "../../classes/base";
import { changeIssuerInteraction } from "./interactions/changeIssuer";
import { ChangeIssuer } from "../../classes/changeissuer";
import { Remark } from "./remark";

/**
 * Validate polkadot address
 * @param address
 */
export const isValidAddressPolkadotAddress = (address: string) => {
  try {
    encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address));

    return true;
  } catch (error) {
    return false;
  }
};

export const findRealOwner = async (
  nftId: string,
  dbAdapter: IConsolidatorAdapter,
  level = 1
): Promise<string> => {
  if (level > 10) {
    throw new Error("Trying to findu owner too deep, possible stack overflow");
  }
  if (isValidAddressPolkadotAddress(nftId)) {
    return nftId;
  } else {
    const consolidatedNFT = await dbAdapter.getNFTByIdUnique(nftId);

    const nft = consolidatedNFTtoInstance(consolidatedNFT);
    if (!nft) {
      // skip
      return "";
    }

    // Bubble up until owner of nft is polkadot address
    return await findRealOwner(nft.owner, dbAdapter, level + 1);
  }
};

export const consolidatedNFTtoInstance = (
  nft?: NFTConsolidated
): NFT | undefined => {
  if (!nft) {
    return undefined;
  }
  const {
    block,
    collection,
    symbol,
    transferable,
    sn,
    metadata,
    id,
    properties,
    ...rest
  } = nft || {};
  const nftInstance = new NFT({
    block,
    collection,
    symbol,
    transferable,
    sn,
    metadata,
    properties,
  });
  const {
    owner,
    forsale,
    reactions,
    changes,
    burned,
    children,
    resources,
    priority,
  } = rest;
  nftInstance.owner = owner;
  nftInstance.forsale = forsale;
  nftInstance.reactions = reactions;
  nftInstance.changes = changes;
  nftInstance.burned = burned;
  nftInstance.children = children;
  nftInstance.resources = resources;
  nftInstance.priority = priority;

  return nftInstance;
};

export const consolidatedCollectionToInstance = (
  collection?: CollectionConsolidated
): Collection | undefined => {
  if (!collection) {
    return undefined;
  }
  const { block, metadata, id, issuer, max, symbol, ...rest } =
    collection || {};
  const collectionInstance = new Collection(
    block,
    max,
    issuer,
    symbol,
    id,
    metadata
  );
  const { changes } = rest;

  collectionInstance.changes = changes;
  return collectionInstance;
};

export const consolidatedBasetoInstance = (
  base?: BaseConsolidated
): Base | undefined => {
  if (!base) {
    return undefined;
  }
  const { block, id, issuer, type, parts } = base || {};
  const baseInstance = new Base(block, id, issuer, type, parts);

  return baseInstance;
};

export const doesRecipientExists = async (
  recipient: string,
  dbAdapter: IConsolidatorAdapter
): Promise<boolean> => {
  try {
    if (isValidAddressPolkadotAddress(recipient)) {
      return true;
    } else {
      const consolidatedNFT = await dbAdapter.getNFTByIdUnique(recipient);
      return Boolean(consolidatedNFT);
    }
  } catch (error) {
    return false;
  }
};

export const changeIssuerCollection = async (
  changeIssuerEntity: ChangeIssuer,
  remark: Remark,
  onSuccess: (id: string) => void,
  dbAdapter: IConsolidatorAdapter
) => {
  const consolidatedCollection = await dbAdapter.getCollectionById(
    changeIssuerEntity.id
  );
  const collection = consolidatedCollectionToInstance(consolidatedCollection);

  changeIssuerInteraction(remark, changeIssuerEntity, collection);
  if (collection && consolidatedCollection) {
    await dbAdapter.updateCollectionIssuer(collection, consolidatedCollection);
    if (onSuccess) {
      onSuccess(collection.id);
    }
  }
};

export const changeIssuerBase = async (
  changeIssuerEntity: ChangeIssuer,
  remark: Remark,
  onSuccess: (id: string) => void,
  dbAdapter: IConsolidatorAdapter
) => {
  const consolidatedBase = await dbAdapter.getBaseById(changeIssuerEntity.id);
  const base = consolidatedBasetoInstance(consolidatedBase);

  changeIssuerInteraction(remark, changeIssuerEntity, base);
  if (base && consolidatedBase) {
    await dbAdapter.updateBaseIssuer(base, consolidatedBase);
    if (onSuccess) {
      onSuccess(base.getId());
    }
  }
};
