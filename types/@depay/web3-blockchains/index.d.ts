declare module "@depay/web3-blockchains" {
  type Token = {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logo: string;
    type: string;
  };

  type Blockchain = {
    name: string;
    id: string;
    networkId: string;
    namespace: string;
    label: string;
    fullName: string;
    logo: string;
    logoBackgroundColor: string;
    logoWhiteBackground: string;
    currency: Token;
    wrapped: {
      address: string;
      logo: string;
    };
    stables: Record<string, string[]>;
    explorer: string;
    explorerUrlFor: (args: {
      transaction?: string;
      token?: string;
      address?: string;
    }) => string | undefined;
    endpoints: string[];
    tokens: Token[];
    zero: string;
    maxInt: string;
  };

  declare namespace Blockchains {
    const ethereum: Blockchain;
    const bsc: Blockchain;
    const polygon: Blockchain;
    const solana: Blockchain;
    const fantom: Blockchain;
    const arbitrum: Blockchain;
    const avalanche: Blockchain;
    const gnosis: Blockchain;
    const optimism: Blockchain;
    const base: Blockchain;
    const all: Blockchain[];

    function findById(id: string): Blockchain | undefined;

    function findByNetworkId(networkId: number): Blockchain | undefined;

    function findByName(name: string): Blockchain | undefined;
  }

  export default Blockchains;
}
