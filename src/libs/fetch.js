import fetch from 'node-fetch';
// import axios from 'axios'
import store from '@/store';
import compareVersions from 'compare-versions';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { toBase64 } from '@cosmjs/encoding';
import {
  Proposal,
  ProposalTally,
  Proposer,
  StakingPool,
  Votes,
  Deposit,
  Validator,
  StakingParameters,
  Block,
  ValidatorDistribution,
  StakingDelegation,
  WrapStdTx,
  getUserCurrency
} from './utils';
import OsmosAPI from './osmos';
import { SixDataChainConnector } from '@sixnetwork/six-data-chain-sdk';

function commonProcess(res) {
  if (res == null) return res; // handles null and undefined

  if (res && Object.keys(res).includes('result')) {
    return res.result;
  }

  if (res && Object.keys(res).includes('delegation_response')) {
    return res.delegation_response;
  }

  return res;
}

// 头像
export function keybase(identity) {
  return fetch(
    `https://keybase.io/_/api/1.0/user/lookup.json?key_suffix=${identity}&fields=pictures`
  ).then(res => res.json());
}

export default class ChainFetch {
  constructor() {
    this.osmosis = new OsmosAPI();
    this.EndpointVersion = {
      certik: 'v1alpha1'
    };
  }

  getEndpointVersion() {
    return this.EndpointVersion[this.config.chain_name] || 'v1beta1';
  }

  getSelectedConfig() {
    let chain = store.state.chains.selected;
    const lschains = localStorage.getItem('chains');
    if (lschains) {
      chain = JSON.parse(lschains)[chain.chain_name];
    }
    if (!chain.sdk_version) {
      chain.sdk_version = '0.33';
    }
    this.config = chain;
    return this.config;
  }

  isModuleLoaded(name) {
    if (this.config.unload_module) {
      return !this.config.unload_module.includes(name);
    }
    return true;
  }

  async getLatestBlock(config = null) {
    const conf = config || this.getSelectedConfig();
    if (conf.chain_name === 'injective') {
      return ChainFetch.fetch(
        'https://tm.injective.network',
        '/block'
      ).then(data => Block.create(commonProcess(data)));
    }
    return this.get('/cosmos/base/tendermint/v1beta1/blocks/latest', config).then(data => Block.create(data));
  }

  async getBlockByHeight(height, config = null) {
    const conf = config || this.getSelectedConfig();
    if (conf.chain_name === 'injective') {
      return ChainFetch.fetch(
        'https://tm.injective.network',
        `/block?height=${height}`
      ).then(data => Block.create(commonProcess(data)));
    }
    return this.get(`/cosmos/base/tendermint/v1beta1/blocks/${height}`, config).then(data =>
      Block.create(data)
    );
  }

  async getSlashingSigningInfo() {
    return this.get('/cosmos/slashing/v1beta1/signing_infos');
  }

  async getTxs(hash) {
    const ver = this.getSelectedConfig() ? this.config.sdk_version : '0.41';
    // /cosmos/tx/v1beta1/txs/{hash}
    if (ver && compareVersions(ver, '0.40') < 1) {
      return this.get(`/txs/${hash}`).then(data => WrapStdTx.create(data, ver));
    }
    return this.get(`/cosmos/tx/v1beta1/txs/${hash}`).then(data =>
      WrapStdTx.create(data, ver)
    );
  }

  async getTxsBySender(sender, page = 1) {
    // return this.get(`/txs?message.sender=${sender}&page=${page}&limit=20`)
    return this.getTx(
      `/api/all-txs-from-address?pageNumber=${page}&address=${sender}&limit=20`
    );
  }

  async getTxsByRecipient(recipient) {
    return this.get(`/txs?message.recipient=${recipient}`);
  }

  async getTxsByHeight(height) {
    return this.get(`/txs?tx.height=${height}`);
  }

  async getValidatorDistribution(address) {
    return this.get(`/cosmos/distribution/v1beta1/validators/${address}`).then(data => {
      const ret = ValidatorDistribution.create(data);
      // ret.versionFixed(this.config.sdk_version);
      return ret;
    });
  }

  async getStakingDelegatorDelegation(delegatorAddr, validatorAddr) {
    return this.get(
      `/cosmos/staking/v1beta1/validators/${validatorAddr}/delegations/${delegatorAddr}`
    ).then(data => StakingDelegation.create(commonProcess(data)));
  }

  async getBankTotal(denom) {
    if (compareVersions(this.config.sdk_version, '0.40') < 0) {
      return this.get(`/cosmos/bank/v1beta1/supply/by_denom?denom=${denom}`).then(data => {
        const result = {
          amount: commonProcess(data),
          denom
        };
        return result;
      });
    }
    return this.get(`/cosmos/bank/v1beta1/supply/by_denom?denom=${denom}`).then(data => {
      const result = commonProcess(data);
      return result;
    });
  }

  async getBankTotals() {
    if (compareVersions(this.config.sdk_version, '0.40') < 0) {
      return this.get('cosmos/bank/v1beta1/supplyl').then(data => commonProcess(data));
    }
    return this.get('/cosmos/bank/v1beta1/supply').then(data => data.supply);
  }

  async getStakingPool() {
    return this.get('/cosmos/staking/v1beta1/pool').then(data => {
      const processedData = commonProcess(data);
      const result = new StakingPool().init(processedData);
      return result;
    });
  }

  async getMintingInflation() {
    if (this.isModuleLoaded('minting')) {
      return this.get('/cosmos/mint/v1beta1/inflation').then(data => {

        // Handle different API response structures
        let inflationValue;
        if (data.inflation !== undefined) {
          inflationValue = data.inflation;
        } else if (data.result !== undefined) {
          inflationValue = data.result;
        } else {
          inflationValue = data;
        }
        const processedValue = commonProcess(inflationValue);
        const finalValue = Number(processedValue);

        return finalValue;
      });
    }
    return null;
  }

  async getStakingParameters() {
    return this.get('/cosmos/staking/v1beta1/params').then(data => {

      this.getSelectedConfig();
      // Extract the params from the API response
      const processedData = commonProcess(data);
      // The API returns {params: {...}}, so we need to get the params object
      const stakingParams = processedData.params || processedData;
      const result = StakingParameters.create(
        stakingParams,
        this.config.chain_name
      );

      return result;
    }).catch(error => {
      console.error('❌ Error in getStakingParameters:', error);
      // Return a default object to prevent crashes
      return new StakingParameters();
    });
  }

  async getValidatorList() {
    return this.get('/cosmos/staking/v1beta1/validators').then(data => {
      const vals = commonProcess(data).map(i => new Validator().init(i));
      localStorage.setItem(
        `validators-${this.config.chain_name}`,
        JSON.stringify(vals)
      );
      return vals;
    });
  }

  async getValidatorUnbondedList() {
    return this.get(
      '/cosmos/staking/v1beta1/validators?status=BOND_STATUS_UNBONDED'
    ).then(data => {
      const result = commonProcess(data);
      const vals = result.validators ? result.validators : result;
      return vals.map(i => new Validator().init(i));
    });
  }

  async getValidatorListByStatus(status) {
    return this.get(`/cosmos/staking/v1beta1/validators?status=${status}`).then(
      data => {
        const result = commonProcess(data);
        const vals = result.validators ? result.validators : result;
        return vals.map(i => new Validator().init(i));
      }
    );
  }

  async getValidatorListByHeight(height) {
    return this.get(`/cosmos/base/tendermint/v1beta1/validatorsets/${height}`).then(data =>
      commonProcess(data)
    );
  }

  async getStakingValidator(address) {
    return this.get(`/cosmos/staking/v1beta1/validators/${address}`).then(data =>
      new Validator().init(commonProcess(data))
    );
  }

  async getSlashingParameters() {
    if (this.isModuleLoaded('slashing')) {
      return this.get('/cosmos/slashing/v1beta1/params').then(data => commonProcess(data));
    }
    return null;
  }

  async getMintParameters() {
    if (this.isModuleLoaded('minting')) {
      return this.get('/cosmos/mint/v1beta1/params').then(data => commonProcess(data));
    }
    return null;
  }

  async getDistributionParameters() {
    return this.get('/cosmos/distribution/v1beta1/params').then(data =>
      commonProcess(data)
    );
  }

  async getGovernanceParameterDeposit() {
    return this.get('/cosmos/gov/v1beta1/params/deposit').then(data =>
      commonProcess(data)
    );
  }

  async getGovernanceParameterTallying() {
    return this.get('/cosmos/gov/v1beta1/params/tallying').then(data =>
      commonProcess(data)
    );
  }

  async getGovernanceParameterVoting() {
    return this.get('/cosmos/gov/v1beta1/params/voting').then(data => commonProcess(data));
  }

  async getGovernanceTally(pid, total) {
    return this.get(`/cosmos/gov/v1beta1/proposals/${pid}/tally`).then(data =>
      new ProposalTally().init(commonProcess(data), total)
    );
  }

  getGovernance(pid) {
    return this.get(`/cosmos/gov/v1beta1/proposals/${pid}`).then(data => {
      const p = new Proposal().init(commonProcess(data), 0);
      p.versionFixed(this.config.sdk_version);
      return p;
    });
  }

  async getGovernanceProposer(pid) {
    if (this.config.chain_name === 'certik') {
      return this.get(`/shentu/gov/v1alpha1/${pid}/proposer`).then(data =>
        new Proposer().init(commonProcess(data))
      );
    }
    return this.get(`/cosmos/gov/v1beta1/proposals/${pid}/proposer`).then(data =>
      new Proposer().init(commonProcess(data))
    );
  }

  async getGovernanceDeposits(pid) {
    if (this.config.chain_name === 'certik') {
      return this.get(`/shentu/gov/v1alpha1/proposals/${pid}/deposits`).then(
        data => {
          const result = commonProcess(data);
          return Array.isArray(result)
            ? result.reverse().map(d => new Deposit().init(d))
            : result;
        }
      );
    }
    return this.get(`/cosmos/gov/v1beta1//proposals/${pid}/deposits`).then(data => {
      const result = commonProcess(data);
      return Array.isArray(result)
        ? result.reverse().map(d => new Deposit().init(d))
        : result;
    });
  }

  async getGovernanceVotes(pid, next = '', limit = 50) {
    if (compareVersions(this.config.sdk_version, '0.40') < 0) {
      return this.get(`/gov/proposals/${pid}/votes`).then(data => ({
        votes: commonProcess(data).map(d => new Votes().init(d)),
        pagination: {}
      }));
    }
    if (this.config.chain_name === 'certik') {
      return this.get(
        `/shentu/gov/v1alpha1/proposals/${pid}/votes?pagination.key=${encodeURIComponent(
          next
        )}&pagination.limit=${limit}`
      );
    }
    return this.get(
      `/cosmos/gov/v1beta1/proposals/${pid}/votes?pagination.key=${encodeURIComponent(
        next
      )}&pagination.limit=${limit}`
    );
  }

  async getGovernanceList() {
    const url =
      this.config.chain_name === 'certik'
        ? '/shentu/gov/v1alpha1/proposals?pagination.limit=500'
        : '/cosmos/gov/v1beta1/proposals?pagination.limit=500';
    return Promise.all([this.get(url), this.get('/staking/pool')]).then(
      data => {
        const pool = new StakingPool().init(commonProcess(data[1]));
        let proposals = commonProcess(data[0]);
        if (Array.isArray(proposals.proposals)) {
          proposals = proposals.proposals;
        }
        const ret = [];
        if (proposals) {
          proposals.forEach(e => {
            const g = new Proposal().init(e, pool.bondedToken);
            g.versionFixed(this.config.sdk_version);
            ret.push(g);
          });
        }
        return ret;
      }
    );
  }

  async getAuthAccount(address, config = null) {
    return this.get('/cosmos/auth/v1beta1/accounts/'.concat(address), config).then(data => {
      const result = commonProcess(data);
      return result.value ? result : { value: result };
    });
  }

  async getBankAccountBalance(address) {
    return this.get('/cosmos/bank/v1beta1/balances/'.concat(address)).then(data =>
      commonProcess(data)
    );
  }

  async getBankAccountBalanceToken(address) {
    return this.get('/cosmos/bank/v1beta1/balances/'.concat(address)).then(data => {
      return data;
    });
  }

  // async getMetaData() {
  //   return this.getSchema('/').then(data => {
  //     return data;
  //   });
  // }

  async getNftSchema(schema) {
    const sixConnector = new SixDataChainConnector();
    sixConnector.apiUrl = this.getSelectedConfig().apiUrl;
    const apiClient = await sixConnector.connectAPIClient();
    try {
      const res = await apiClient.nftmngrModule.queryNftSchema(schema);
      return res.data;
    } catch (error) {
      return {};
    }
  }

  async getNftSchemaByContract(contract) {
    const sixConnector = new SixDataChainConnector();
    sixConnector.apiUrl = this.getSelectedConfig().apiUrl;
    const apiClient = await sixConnector.connectAPIClient();
    try {
      const res = await apiClient.nftmngrModule.queryNftSchemaByContract(
        contract
      );
      return res.data;
    } catch (error) {
      return {};
    }
  }

  async getSchemaNameByContract(contract) {
    return this.getSchemaTransactionByContract(
      `/sixnft/nftmngr/nft_schema_by_contract/${contract}`
    );
  }

  async getAllTransactions(schemaCode, page = 1) {
    return this.getSchemaTransaction(
      `/api/nft/getAllTransaction?schemaCode=${schemaCode}&page=${page}&limit=20`
    );
  }

  async getTransactionByHash(txHash) {
    return this.getSchemaTransaction(
      `/api/nft/getTransactionByHash?txhash=${txHash}`
    );
  }

  async getRpcMapper(chainName) {
    return this.getSchemaTransaction(`/api/rpc-mapper?chainName=${chainName}`);
  }

  async getStakingReward(address, config = null) {
    if (
      compareVersions(
        config ? config.sdk_version : this.config.sdk_version,
        '0.40'
      ) < 0
    ) {
      return this.get(
        `/cosmos/distribution/v1beta1/delegators/${address}/rewards`,
        config
      ).then(data => commonProcess(data));
    }
    return this.get(
      `/cosmos/distribution/v1beta1/delegators/${address}/rewards`,
      config
    ).then(data => commonProcess(data));
  }

  async getStakingValidators(address) {
    return this.get(
      `/cosmos/distribution/v1beta1/delegators/${address}/validators`
    ).then(data => commonProcess(data));
  }

  async getCommunityTax() {
    return this.get(
      `/cosmos/distribution/v1beta1/params`
    ).then(data => commonProcess(data));
  }

  async getStakingDelegations(address, config = null) {
    if (
      compareVersions(
        config ? config.sdk_version : this.config.sdk_version,
        '0.40'
      ) < 0
    ) {
      return this.get(
        `/staking/delegators/${address}/delegations`,
        config
      ).then(data =>
        commonProcess(data).map(x => {
          const xh = x;
          if (!xh.delegation) {
            xh.delegation = {
              validator_address: x.validator_address,
              delegator_address: x.delegator_address
            };
          }
          return xh;
        })
      );
    }
    return this.get(
      `/cosmos/staking/v1beta1/delegations/${address}`,
      config
    ).then(data => commonProcess(data));
  }

  async getStakingRedelegations(address, config = null) {
    if (
      compareVersions(
        config ? config.sdk_version : this.config.sdk_version,
        '0.40'
      ) < 0
    ) {
      return this.get(
        `/staking/redelegations?delegator=${address}`,
        config
      ).then(data => commonProcess(data));
    }
    return this.get(
      `/cosmos/staking/v1beta1/delegators/${address}/redelegations`,
      config
    ).then(data => commonProcess(data));
  }

  async getStakingUnbonding(address, config = null) {
    if (
      compareVersions(
        config ? config.sdk_version : this.config.sdk_version,
        '0.40'
      ) < 0
    ) {
      return this.get(
        `/staking/delegators/${address}/unbonding_delegations`,
        config
      ).then(data => commonProcess(data));
    }
    return this.get(
      `/cosmos/staking/v1beta1/delegators/${address}/unbonding_delegations`,
      config
    ).then(data => commonProcess(data));
  }

  async getBankBalances(address, config = null) {
    return this.get('/bank/balances/'.concat(address), config).then(data =>
      commonProcess(data)
    );
  }

  async getAllIBCDenoms(config = null) {
    const sdkVersion = config ? config.sdk_version : this.config.sdk_version;
    if (compareVersions(sdkVersion, '0.44.2') < 0) {
      return this.get(
        '/ibc/applications/transfer/v1beta1/denom_traces?pagination.limit=500',
        config
      ).then(data => commonProcess(data));
    }
    return this.get(
      '/ibc/apps/transfer/v1/denom_traces?pagination.limit=500',
      config
    ).then(data => commonProcess(data));
  }

  async getIBCDenomTrace(hash, config = null) {
    const h = hash.substring(hash.indexOf('/') + 1);
    const sdkVersion = config ? config.sdk_version : this.config.sdk_version;
    if (compareVersions(sdkVersion, '0.44.2') < 0) {
      return this.get(
        '/ibc/applications/transfer/v1beta1/denom_traces/'.concat(h),
        config
      ).then(data => commonProcess(data));
    }
    return this.get(
      '/ibc/apps/transfer/v1/denom_traces/'.concat(h),
      config
    ).then(data => commonProcess(data));
  }

  async getIBCChannels(config = null, key = null) {
    if (key) {
      return this.get(
        '/ibc/core/channel/v1/channels?pagination.key='.concat(key),
        config
      ).then(data => commonProcess(data));
    }
    return this.get(
      '/ibc/core/channel/v1/channels?pagination.limit=1000',
      config
    ).then(data => commonProcess(data));
  }

  // eslint-disable-next-line camelcase
  async getIBCChannelClientState(channelId, portId, config = null) {
    // eslint-disable-next-line camelcase
    return this.get(
      `/ibc/core/channel/v1/channels/${channelId}/ports/${portId}/client_state`,
      config
    ).then(data => commonProcess(data));
  }

  // eslint-disable-next-line camelcase
  async getIBCChannel(channelId, portId, config = null) {
    // eslint-disable-next-line camelcase
    return this.get(
      `/ibc/core/channel/v1/channels/${channelId}/ports/${portId}`,
      config
    ).then(data => commonProcess(data));
  }

  static async getBankBalance(baseurl, address) {
    return ChainFetch.fetch(
      baseurl,
      '/bank/balances/'.concat(address)
    ).then(data => commonProcess(data));
  }

  async getGravityPools() {
    return this.get('/cosmos/liquidity/v1beta1/pools').then(data =>
      commonProcess(data)
    );
  }

  async getMarketChart(days = 14, coin = null) {
    const conf = this.getSelectedConfig();
    const currency = getUserCurrency();
    if (conf.assets[0] && conf.assets[0].coingecko_id) {
      return ChainFetch.fetch(
        ' https://api.coingecko.com',
        `/api/v3/coins/${coin ||
        conf.assets[0]
          .coingecko_id}/market_chart?vs_currency=${currency}&days=${days}`
      );
    }
    return null;
  }

  // CoinMarketCap
  static async fetchCoinMarketCap(url) {
    const host = 'https://price.ping.pub';
    return fetch(host + url).then(response => response.json());
  }

  static async fetchTokenQuote(symbol) {
    return ChainFetch.fetchCoinMarketCap(`/quote/${symbol !== "SIX" ? "SIX": symbol}`);
  }

  // Tx Submit
  async broadcastTx(bodyBytes, config = null) {
    const txString = toBase64(TxRaw.encode(bodyBytes).finish());
    const txRaw = {
      tx_bytes: txString,
      mode: 'BROADCAST_MODE_SYNC' // BROADCAST_MODE_SYNC, BROADCAST_MODE_BLOCK, BROADCAST_MODE_ASYNC
    };
    return this.post('/cosmos/tx/v1beta1/txs', txRaw, config).then(res => {
      if (res.code && res.code !== 0) {
        throw new Error(res.message);
      }
      if (res.tx_response && res.tx_response.code !== 0) {
        throw new Error(res.tx_response.raw_log);
      }
      return res;
    });
  }

  async post(url = '', data = {}, config = null) {
    if (!config) {
      this.getSelectedConfig();
    }
    const conf = config || this.config;
    const index = this.getApiIndex(config);
    // Default options are marked with *
    const response = await fetch(
      (Array.isArray(conf.api) ? conf.api[index] : conf.api) + url,
      {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        // mode: 'cors', // no-cors, *cors, same-origin
        // credentials: 'same-origin', // redirect: 'follow', // manual, *follow, error
        // referrerPolicy: 'origin', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        headers: {
          'Content-Type': 'text/plain',
          Accept: '*/*',
          'Accept-Encoding': 'gzip, deflate, br'
        },
        body: JSON.stringify(data) // body data type must match "Content-Type" header
      }
    );
    // const response = axios.post((config ? config.api : this.config.api) + url, data)
    return response.json(); // parses JSON response into native JavaScript objects
  }

  async get(url, config = null) {
    if (!config) {
      this.getSelectedConfig();
    }
    const conf = config || this.config;
    const finalurl =
      (Array.isArray(conf.api)
        ? conf.api[this.getApiIndex(config)]
        : conf.api) + url;
    // finalurl = finalurl.replaceAll('v1beta1', this.getEndpointVersion())
    const ret = await fetch(finalurl).then(response => response.json());
    return ret;
  }

  async getSchema(url, config = null) {
    if (!config) {
      this.getSelectedConfig();
    }
    const conf = config || this.config;
    const finalurl = Array.isArray(conf.schema)
      ? conf.schema[this.getApiIndex(config)]
      : conf.schema;
    // finalurl = finalurl.replaceAll('v1beta1', this.getEndpointVersion())
    const ret = await fetch(finalurl).then(response => response.json());
    return ret;
  }

  async getSchemaTransaction(url, config = null) {
    if (!config) {
      this.getSelectedConfig();
    }

    const conf = config || this.config;
    const finalurl =
      (Array.isArray(conf.datachain)
        ? conf.datachain[this.getApiIndex(config)]
        : conf.datachain) + url;
    // finalurl = finalurl.replaceAll('v1beta1', this.getEndpointVersion())
    const ret = await fetch(finalurl).then(response => response.json());
    return ret;
  }

  async getSchemaTransactionByContract(url, config = null) {
    if (!config) {
      this.getSelectedConfig();
    }

    const conf = config || this.config;
    const finalurl =
      (Array.isArray([conf.apiUrl])
        ? conf.apiUrl[this.getApiIndex(config)]
        : conf.apiUrl) + url;
    // finalurl = finalurl.replaceAll('v1beta1', this.getEndpointVersion())
    const res = await fetch(finalurl).then(response => response.json());
    return res;
  }

  async getTx(url, config = null) {
    if (!config) {
      this.getSelectedConfig();
    }
    const conf = config || this.config;
    const finalurl =
      (Array.isArray(conf.apiTX)
        ? conf.apiTX[this.getApiIndex(config)]
        : conf.apiTX) + url;
    // finalurl = finalurl.replaceAll('v1beta1', this.getEndpointVersion())
    const ret = await fetch(finalurl).then(response => response.json());
    return ret;
  }

  getApiIndex(config = null) {
    const conf = config || this.config;
    const index = Number(
      localStorage.getItem(`${conf.chain_name}-api-index`) || 0
    );
    return index < conf.api.length ? index : 0;
  }

  async getUrl(url) {
    this.getSelectedConfig();
    return fetch(url).then(res => res.json());
  }

  static fetch(host, url) {
    const ret = fetch(
      (Array.isArray(host) ? host[0] : host) + url
    ).then(response => response.json());
    return ret;
  }
}

// export default chainAPI
