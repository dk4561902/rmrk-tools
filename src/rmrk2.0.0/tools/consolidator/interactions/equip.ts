import { Remark } from "../remark";
import { NFT } from "../../../classes/nft";
import { OP_TYPES } from "../../constants";
import { IConsolidatorAdapter } from "../adapters/types";
import { findRealOwner, isValidAddressPolkadotAddress } from "../utils";
import { Equip } from "../../../classes/equip";

export const equipInteraction = async (
  remark: Remark,
  equipEntity: Equip,
  dbAdapter: IConsolidatorAdapter,
  nft?: NFT,
  parentNft?: NFT
): Promise<void> => {
  if (!nft) {
    throw new Error(
      `[${OP_TYPES.EQUIP}] Attempting to equip a non-existant NFT ${equipEntity.id}`
    );
  }

  if (Boolean(nft.burned)) {
    throw new Error(
      `[${OP_TYPES.EQUIP}] Attempting to equip on burned NFT ${equipEntity.id}`
    );
  }

  if (isValidAddressPolkadotAddress(nft.owner)) {
    throw new Error(
      `[${OP_TYPES.EQUIP}] Attempting to equip NFT ${equipEntity.id} who's owner is account ${nft.owner}. You can only EQUIP on parent NFT`
    );
  }

  if (!parentNft) {
    throw new Error(
      `[${OP_TYPES.EQUIP}] Attempting to equip NFT ${equipEntity.id} on a non-existant parent NFT ${nft.owner}`
    );
  }

  // If NFT owner is adding this resource then immediatly accept it
  const rootowner = await findRealOwner(nft.owner, dbAdapter);
  if (rootowner !== remark.caller) {
    throw new Error(
      `[${OP_TYPES.EQUIP}] Attempting to equip on non-owned NFT ${equipEntity.id}`
    );
  }

  if (parentNft.children?.[equipEntity.id]?.pending) {
    throw new Error(
      `[${OP_TYPES.EQUIP}] Cannot equip NFT ${equipEntity.id} because it wasn't accepted by a parent yet`
    );
  }

  if (!parentNft.children?.[nft.getId()]) {
    throw new Error(
      `[${OP_TYPES.EQUIP}] Cannot equip NFT ${equipEntity.id} because it's parent is missing children array`
    );
  }

  if (equipEntity.baseslot === "") {
    parentNft.children[nft.getId()].equipped = "";
  }

  if (equipEntity.baseslot) {
    const [base, slot] = equipEntity.baseslot.split(".");

    const baseEntity = await dbAdapter.getBaseById(base);
    const basepart = (baseEntity?.parts || []).find(
      (part) => part.id === slot && part.type === "slot"
    );
    if (!basepart) {
      throw new Error(
        `[${OP_TYPES.EQUIP}] Cannot equip NFT ${equipEntity.id} because it's base ${base} is missing a slot ${slot}`
      );
    }

    if (!basepart.equippable?.includes(nft.collection)) {
      throw new Error(
        `[${OP_TYPES.EQUIP}] Cannot equip NFT ${equipEntity.id} because it's base ${base} slot ${slot} doesn't allow it's collection ${nft.collection}`
      );
    }

    const baseResource = parentNft.resources.find(
      (resource) => resource.base === base
    );

    if (!baseResource) {
      throw new Error(
        `[${OP_TYPES.EQUIP}] Cannot equip NFT ${equipEntity.id} because parent's base with id ${base} is missing`
      );
    }

    if (baseResource.pending) {
      throw new Error(
        `[${OP_TYPES.EQUIP}] Cannot equip NFT ${equipEntity.id} because parent's base is pending`
      );
    }

    parentNft.children[nft.getId()].equipped = equipEntity.baseslot;
  }
};
