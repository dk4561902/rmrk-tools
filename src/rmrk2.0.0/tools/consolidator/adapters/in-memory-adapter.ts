import { CollectionConsolidated, NFTConsolidated } from "../consolidator";
import { NftClass } from "../../../classes/nft-class";
import { NFT } from "../../../classes/nft";
import { IConsolidatorAdapter } from "./types";

export class InMemoryAdapter implements IConsolidatorAdapter {
  public nfts: NFTConsolidated[];
  public nftclasses: CollectionConsolidated[];
  constructor() {
    this.nfts = [];
    this.nftclasses = [];
  }

  public async getAllNFTs() {
    return this.nfts;
  }

  public async getAllCollections() {
    return this.nftclasses;
  }

  public async updateNFTEmote(nft: NFT, consolidatedNFT: NFTConsolidated) {
    const nftIndex = this.nfts.findIndex(
      (nftItem) => nftItem.id === consolidatedNFT.id
    );
    this.nfts[nftIndex] = {
      ...this.nfts[nftIndex],
      reactions: nft?.reactions,
    };
  }

  public async updateNFTList(nft: NFT, consolidatedNFT: NFTConsolidated) {
    const nftIndex = this.nfts.findIndex(
      (nftItem) => nftItem.id === consolidatedNFT.id
    );
    this.nfts[nftIndex] = {
      ...this.nfts[nftIndex],
      forsale: nft?.forsale,
      changes: nft?.changes,
    };
  }

  public async updateNFTBuy(nft: NFT, consolidatedNFT: NFTConsolidated) {
    const nftIndex = this.nfts.findIndex(
      (nftItem) => nftItem.id === consolidatedNFT.id
    );
    this.nfts[nftIndex] = {
      ...this.nfts[nftIndex],
      owner: nft?.owner,
      changes: nft?.changes,
      forsale: nft?.forsale,
    };
  }

  public async updateNFTSend(nft: NFT, consolidatedNFT: NFTConsolidated) {
    const nftIndex = this.nfts.findIndex(
      (nftItem) => nftItem.id === consolidatedNFT.id
    );
    this.nfts[nftIndex] = {
      ...this.nfts[nftIndex],
      changes: nft?.changes,
      owner: nft?.owner,
      forsale: BigInt(0),
    };
  }

  public async updateNFTConsume(nft: NFT, consolidatedNFT: NFTConsolidated) {
    const nftIndex = this.nfts.findIndex(
      (nftItem) => nftItem.id === consolidatedNFT.id
    );
    this.nfts[nftIndex] = {
      ...this.nfts[nftIndex],
      burned: nft?.burned,
      changes: nft?.changes,
      forsale: BigInt(nft.forsale) > BigInt(0) ? BigInt(0) : nft.forsale,
    };
  }

  public async updateNFTMint(nft: NFT) {
    this.nfts.push({
      ...nft,
      instance: nft.instance,
      id: nft.getId(),
    });
  }

  public async updateCollectionMint(nftclasse: CollectionConsolidated) {
    return this.nftclasses.push(nftclasse);
  }

  public async updateCollectionIssuer(
    nftclass: NftClass,
    consolidatedCollection: CollectionConsolidated
  ) {
    const nftclassIndex = this.nftclasses.findIndex(
      (nftItem) => nftItem.id === consolidatedCollection.id
    );
    this.nftclasses[nftclassIndex] = {
      ...this.nftclasses[nftclassIndex],
      issuer: nftclass?.issuer,
      changes: nftclass?.changes,
    };
  }

  public async getNFTById(id: string) {
    return this.nfts.find((nft) => nft.id === id);
  }

  public async getCollectionById(id: string) {
    return this.nftclasses.find((nftclass) => nftclass.id === id);
  }

  /**
   * Find existing NFT by id
   */
  public async getNFTByIdUnique(id: string) {
    return this.nfts.find((nft) => {
      return nft.id === id;
    });
  }
}
