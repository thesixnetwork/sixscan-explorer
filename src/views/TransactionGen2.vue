<template>
  <div v-if="loading === false">
    <div v-if="nFTSchema['code']">
      <b-row>
        <b-col lg="6" md="12" sm="12" xs="12">
          <b-card class="style-card">
            <b-card-body class="p-0">
              <b-row
                class="customizer-overviews divider-bottom px-1 pt-0 text-bold"
              >
                <h5 class="font-weight-bolder customizer-text">
                  Overview
                </h5>
              </b-row>
              <!-- <b-row>
              <span class="text-secondary text-small px-1 pt-25 pb-25">
                Min price
              </span>
            </b-row>
            <b-row class="pt-0 pb-25 customizer-overviews divider-bottom">
              <span class="text-small px-1">$0.00</span>
              <span class="text-secondary text-small px-1">0.0000 SIX</span>
            </b-row> -->
              <b-row class="customizer-overviews">
                <b-col lg="4">
                  <span class="text-small">Max Total Supply:</span>
                </b-col>
                <b-col lg="8">
                  <span class="text-sm-detail style-text">{{
                    totalSupply
                  }}</span>
                </b-col>
              </b-row>
              <!-- <b-row class="customizer-overviews">
              <b-col lg="4">
                <span>Holders:</span>
              </b-col>
              <b-col lg="8">
                <span>6,666</span>
              </b-col>
            </b-row> -->
              <!-- <b-row class="pt-1">
              <b-col lg="4">
                <span>Transfers:</span>
              </b-col>
              <b-col lg="8">
                <span>66,666</span>
              </b-col>
            </b-row> -->
            </b-card-body>
          </b-card>
        </b-col>
        <b-col lg="6" md="12" sm="12" xs="12">
          <b-card class="style-card">
            <b-card-body v-if="nFTSchema['code']" class="p-0">
              <b-row
                class="customizer-overviews divider-bottom px-1 pt-0 text-bold"
              >
                <h5 class="font-weight-bolder customizer-text">
                  Profile Summary
                </h5>
              </b-row>
              <b-row class="customizer-overviews divider-bottom">
                <b-col lg="3">
                  <span class="text-small">Collection:</span>
                </b-col>
                <b-col lg="9">
                  <span class="text-sm-detail style-text">
                    {{ nFTSchema['name'] }}
                  </span>
                </b-col>
              </b-row>
              <b-row class="customizer-overviews divider-bottom">
                <b-col lg="3">
                  <span class="text-small">Contract:</span>
                </b-col>
                <b-col lg="9" class="text-truncate">
                  <span class="customizer-text text-truncate text-sm-detail">
                    {{ nFTSchema['origin_data']['origin_contract_address'] }}
                    <feather-icon
                      :icon="'CopyIcon'"
                      size="16"
                      class="ml-25 customizer-copy"
                      @click="
                        copy(
                          nFTSchema['origin_data']['origin_contract_address']
                        )
                      "
                    />
                  </span>
                </b-col>
              </b-row>
              <b-row class="customizer-overviews">
                <b-col lg="3">
                  <span class="text-small">Schema code:</span>
                </b-col>
                <b-col lg="9" class="style-text text-sm-detail">
                  <span> {{ nFTSchema['code'] }} </span>
                </b-col>
              </b-row>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>
      <b-card>
        <b-tabs content-class="mt-1">
          <b-tab title="Gen2 Txn" active class="pa-0">
            <div class="mb-1">
              <span class="text-secondary">
                A total of
                <span class="font-weight-bold text-primary px-50">
                  {{ txs.length }}
                </span>
                transactions found
              </span>
            </div>
            <b-table
              :items="txs"
              :busy="isBusy"
              :fields="fields"
              striped
              hover
              responsive="md"
              stacked="sm"
              :style="{ fontSize: 'smaller' }"
            >
              <template #table-busy>
                <div class="text-center text-secondary my-2">
                  <b-spinner small class="align-middle mr-50" />
                  <strong>Loading...</strong>
                </div>
              </template>
              <template #cell(txhash)="data">
                <router-link :to="`/txn-gen2/txs-details/${data.item.txhash}`">
                  {{ formatHash(data.item.txhash) }}
                </router-link>
              </template>
              <template #cell(method)="data">
                <b-badge variant="light-secondary">
                  {{ data.item.method }}
                </b-badge>
              </template>
            </b-table>
            <b-pagination
              v-if="Number(transactions.data.totalPage) > 1"
              :total-rows="Number(transactions.data.totalCount)"
              :per-page="20"
              :value="page_number"
              align="center"
              class="mt-1"
              @change="pageload"
            />
          </b-tab>
          <b-tab title="Collection">
            <div class="flex justify-content-end mb-1">
              <b-pagination
                v-if="Number(totalSupply / limit) > 1"
                v-model="currentPage"
                :total-rows="totalSupply"
                :per-page="limit"
                :value="currentPage"
                size="sm"
                @change="pageCollectionChange"
              />
            </div>
            <b-row v-if="totalPages.length > 0 && isCollectionLoader == false">
              <b-col
                v-for="(item, index) in totalPages"
                :key="index"
                lg="2"
                md="4"
                sm="6"
                xs="6"
                class="pl-20"
              >
                <router-link
                  :to="
                    `/txn-gen2/nft-txs/${(currentPage - 1) * limit +
                      (index + 1)}/${tokenCode}`
                  "
                >
                  <b-card-body class="customizer-card">
                    <div class="d-flex justify-content-center mb-1">
                      <b-img-lazy
                        :src="
                          `${
                            reg.test(item.image)
                              ? require('@/assets/images/icons/no-pic.png')
                              : item.image
                          }`
                        "
                        :blank-src="require('@/assets/images/icons/no-pic.png')"
                        :alt="item.image"
                        height="120px"
                        width="120px"
                        fluid
                      />
                    </div>
                    <div class="d-flex">
                      <span class="mr-25 text-xs">Token ID:</span>
                      <span
                        class="customizer-text text-truncate d-inline-block text-xs"
                      >
                        {{ item.name }}
                      </span>
                    </div>
                    <div class="d-flex">
                      <span class="mr-25 text-xs">Owner:</span>
                      <span
                        class="customizer-text text-truncate d-inline-block text-xs"
                      >
                        {{ item.owner }}
                      </span>
                    </div>
                  </b-card-body>
                </router-link>
              </b-col>
            </b-row>
            <b-row
              v-else
              class="flex align-items-center justify-content-center"
            >
              <b-spinner small class="align-middle mr-50" />
              <span class="text-center mb-0">
                Loading ...
              </span>
            </b-row>
          </b-tab>
        </b-tabs>
      </b-card>
    </div>
    <div v-else>
      <b-card>
        <h4 class="text-center mb-0">
          Data Not found !
        </h4>
      </b-card>
    </div>
  </div>
  <div v-else>
    <b-card>
      <div class="flex align-items-center justify-content-center">
        <b-spinner small class="mr-50" />
        <span class="text-center mb-0">
          Loading Data 🕵🏻‍♀️
        </span>
      </div>
    </b-card>
  </div>
</template>

<script>
import {
  BCard,
  BCardBody,
  BRow,
  BCol,
  BTab,
  BTabs,
  BTable,
  BSpinner,
  BPagination,
  BImgLazy,
  BBadge
} from 'bootstrap-vue';

import { toDay, abbrAddress } from '@/libs/utils';
import TestNfts from '@/abi/TestNfts.json';
import { STATUS_CODE } from '@/libs/web3';
import axios from 'axios';
import Web3 from 'web3';
import ToastificationContent from '@core/components/toastification/ToastificationContent.vue';
import _ from 'lodash';

export default {
  components: {
    BCard,
    BCardBody,
    BRow,
    BCol,
    BTab,
    BTabs,
    BTable,
    BSpinner,
    BPagination,
    BImgLazy,
    BBadge
  },
  beforeRouteUpdate(to, from, next) {
    const { address, tokenCode, contract } = to.params;
    this.initial(tokenCode, contract);
    if (tokenCode !== undefined && tokenCode !== '') {
      this.$http.getAllTransactions(tokenCode).then(res => {
        this.transactions = res;
      });
      next();
    }
  },
  data() {
    const { tokenCode, contract, chain } = this.$route.params;
    return {
      isCollectionLoader: true,
      isBusy: false,
      transactions: [],
      tabs: [],
      nfts: [],
      fields: [
        { key: 'txhash', label: 'Txn Hash' },
        { key: 'method', label: 'Method' },
        { key: 'age', label: 'Age' },
        { key: 'by', label: 'By' }
      ],
      nFTSchema: {},
      tokenCode,
      contract,
      page_number: 1,
      totalSupply: 0,
      limit: 12,
      currentPage: 0,
      loading: true,
      reg: /^ipfs:/
    };
  },
  computed: {
    txs() {
      if (this.transactions.data) {
        this.isBusy = false;
        return this.transactions.data.txs.map(x => ({
          txhash: x.txhash,
          method:
            x.type === '/sixnft.nftmngr.MsgCreateNFTSchema'
              ? 'Create NFT Schema'
              : x.type === '/sixnft.nftmngr.MsgCreateMetadata'
              ? 'Create Metadata'
              : x.type === '/sixnft.nftmngr.MsgPerformActionByAdmin'
              ? 'NFT Action'
              : x.type,

          age: toDay(x.time_stamp),
          by: abbrAddress(x.decode_tx.creator)
        }));
      } else {
        this.isBusy = true;
        return [
          {
            txhash: '',
            method: '',
            age: '',
            by: ''
          }
        ];
      }
    },
    totalPages: function() {
      if (this.nfts.length > 0) {
        return this.nfts;
      } else {
        return [];
      }
    }
  },
  created() {
    this.tabs = this.$children;
    // this.initial(this.tokenCode);
    if (this.tokenCode !== undefined && this.tokenCode !== '') {
      this.$http.getAllTransactions(this.tokenCode).then(res => {
        this.transactions = res;
      });
    }
  },
  mounted() {
    this.initial(this.tokenCode, this.contract);
  },
  methods: {
    async initial(tc, contractAddress) {
      this.isCollectionLoader = true;
      this.loading = true;
      if (tc !== undefined && tc !== '') {
        this.$http.getNftSchema(tc).then(async res => {
          if (res.nFTSchema !== undefined) {
            this.loading = false;
            this.nFTSchema = res.nFTSchema;
            this.$http
              .getRpcMapper(res.nFTSchema.origin_data.origin_chain)
              .then(async rpc => {
                // const webs = new Web3(
                //   STATUS_CODE[res.nFTSchema.origin_data.origin_chain]
                //     .PROVIDER || ''
                // );
                if (rpc.statusCode === 'V:0001') {
                  const webs = new Web3(rpc.data.rpcUrl || '');
                  const nftContract = new webs.eth.Contract(
                    TestNfts,
                    res.nFTSchema.origin_data.origin_contract_address || ''
                  );

                  const totalSupply = await nftContract.methods
                    .totalSupply()
                    .call();
                  this.totalSupply = totalSupply;

                  if (totalSupply > 12) {
                    this.currentPage = 0;
                  } else {
                    this.currentPage = 1;
                  }

                  const aggregate = [
                    ...Array(
                      totalSupply > 12
                        ? parseInt(this.limit)
                        : parseInt(totalSupply)
                    )
                  ].map((x, index) =>
                    nftContract.methods.tokenURI(parseInt(index + 1)).call()
                  );

                  const ownerOf = [
                    ...Array(
                      totalSupply > 12
                        ? parseInt(this.limit)
                        : parseInt(totalSupply)
                    )
                  ].map((x, index) =>
                    nftContract.methods.ownerOf(parseInt(index + 1)).call()
                  );
                  const alloOwnerOfChannel = Promise.all(ownerOf);
                  const allChannel = Promise.all(aggregate);
                  const [alloOwnerOf, all] = await Promise.all([
                    alloOwnerOfChannel,
                    allChannel
                  ]);
                  const built = all.map(uri =>
                    axios.get(uri + '?rpc=THE_MERGE')
                  );
                  const allNfts = await Promise.all(built);
                  const allData = allNfts.map((x, i) => {
                    return { ...x.data, owner: alloOwnerOf[i], id: i };
                  });

                  this.nfts = allData;
                  this.isCollectionLoader = false;
                }
              });
          } else {
            this.nfts = [];
            this.loading = false;
            this.nFTSchema = {};
            this.isCollectionLoader = false;
          }
        });
      } else if (contractAddress !== undefined && contractAddress !== '') {
        // this.$http.getSchemaNameByContract(contractAddress).then(res => {

        this.loading = false;
        // });
      } else {
        this.loading = false;
      }
    },
    async pageCollectionChange(v) {
      if (this.tokenCode !== undefined && this.tokenCode !== '') {
        this.isCollectionLoader = true;
        const pageCollectionsNumber = v;
        this.$http
          .getRpcMapper(this.nFTSchema.origin_data.origin_chain)
          .then(async rpc => {
            if (rpc.statusCode === 'V:0001') {
              const webs = new Web3(rpc.data.rpcUrl || '');
              const nftContract = new webs.eth.Contract(
                TestNfts,
                this.nFTSchema.origin_data.origin_contract_address || ''
              );
              let endId = pageCollectionsNumber * parseInt(this.limit);
              if (endId > this.totalSupply) endId = this.totalSupply - 1;

              const fetchLength = _.range(endId - parseInt(this.limit), endId);
              const aggregate = fetchLength
                // ...Array(parseInt(this.limit))
                .map((x, index) => {
                  return nftContract.methods.tokenURI(parseInt(x + 1)).call();
                });

              const ownerOf = fetchLength.map((x, index) =>
                nftContract.methods.ownerOf(parseInt(x + 1)).call()
              );
              const alloOwnerOfChannel = Promise.all(ownerOf);
              const allChannel = Promise.all(aggregate);
              const [alloOwnerOf, all] = await Promise.all([
                alloOwnerOfChannel,
                allChannel
              ]);
              const built = all.map(uri => axios.get(uri + '?rpc=THE_MERGE'));
              const allNfts = await Promise.all(built);
              const allData = allNfts.map((x, i) => {
                return { ...x.data, owner: alloOwnerOf[i] };
              });
              this.nfts = allData;
              this.isCollectionLoader = false;
            }
          });
      } else if (this.contract !== undefined && this.contract !== '') {
      } else {
        this.loading = false;
      }
    },
    pageload(v) {
      if (this.tokenCode !== undefined && this.tokenCode !== '') {
        this.page_number = v;
        this.$http.getAllTransactions(this.tokenCode, v).then(res => {
          this.transactions = res;
        });
      } else {
        this.loading = false;
      }
    },
    formatHash: abbrAddress,
    copy(v) {
      this.$copyText(v).then(
        () => {
          this.$toast({
            component: ToastificationContent,
            props: {
              title: 'Address copied',
              icon: 'BellIcon'
            }
          });
        },
        e => {
          this.$toast({
            component: ToastificationContent,
            props: {
              title: `Failed to copy address! ${e}`,
              icon: 'BellIcon',
              variant: 'danger'
            }
          });
        }
      );
    }
  }
};
</script>

<style lang="scss" scoped>
@import '~@core/scss/base/bootstrap-extended/include';
@import '~@core/scss/base/components/variables-dark';

.customizer-copy {
  cursor: pointer;
  color: $info;

  .dark-layout & {
    color: $primary;
  }
}

.customizer-button {
  background-color: $info;
  color: #fff;
  font-size: 0.8rem;
  border-radius: 12px;
  padding: 8px 14px;

  .dark-layout & {
    background-color: $primary;
    color: #fff;
  }
}

.customizer-card {
  color: $secondary;
  border-radius: 12px;
  border: 1px solid $light;
  cursor: pointer;
  margin-bottom: 20px;
  padding: 10px 12px;
}

.style-card {
  height: 200px;

  @include media-breakpoint-down(md) {
    height: auto;
  }
}

.customizer-text {
  color: $info;
  max-width: 150px;
  align-items: center;

  .dark-layout & {
    color: $primary;
  }
}

.style-text {
  color: $info;

  .dark-layout & {
    color: $primary;
  }
}

.customizer-overviews {
  padding-bottom: 10px;
  padding-top: 10px;
  align-items: center;
}

.divider-bottom {
  border-bottom: 1px solid $light;

  .dark-layout & {
    border-bottom: 0.5px solid $secondary;
  }
}

.text-small {
  font-size: 14px;

  @include media-breakpoint-down(lg) {
    font-size: 10px;
  }
}

.text-xs {
  font-size: 9px;
}

.text-sm-detail {
  font-size: 13px;

  @include media-breakpoint-down(lg) {
    font-size: 12px;
  }
}
</style>
