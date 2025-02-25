<template>
  <div>
    <div v-if="!error">
      <b-card class="d-flex flex-row">
        <b-card-body class="pl-0 pr-0">
          <b-row>
            <b-col lg="3" md="12" sm="12" xs="12" align-self="center">
              <div class="text-center">
                <vue-qr :text="address" :logo-src="iconUrl" :logo-scale="0.2" :logo-margin="0.5" :dot-scale="0.6"
                  :margin="4" :size="200" color-dark="#343a40" background-color="#FFFFFF00"
                  :style="{ boxShadow: '0px 6px 10px #00000040' }" />
              </div>
            </b-col>
            <b-col lg="9" md="12" sm="12" xs="12">
              <div v-if="account" class="text-trancate mb-0 mt-1">
                <div class="d-flex align-items-center justify-content-between mb-1">
                  <h5 class="mb-25">
                    Overview
                  </h5>
                  <div class="d-flex align-items-center">
                    <span v-b-tooltip.hover.bottom="{ variant: 'secondary' }" :title="address"
                      class="customizer-addr mx-25 d-none d-sm-block">
                      {{ address }}
                    </span>
                    <span v-b-tooltip.hover.bottom="{ variant: 'secondary' }" :title="address"
                      class="customizer-addr mx-25 d-sm-block d-md-none d-lg-none">
                      {{ formatAddress(address) }}
                    </span>
                    <feather-icon icon="CopyIcon" size="16" class="cursor-pointer" @click="copy()" />
                  </div>
                </div>
                <div v-for="(token, index) in assetTable.items" :key="`asset-${index}`"
                  class="d-flex justify-content-between mb-25">
                  <div class="d-flex align-items-center">
                    <b-avatar :variant="`light-${token.color}`" rounded>
                      <feather-icon :icon="token.icon" size="16" :class="`text-${token.color}`" />
                    </b-avatar>
                    <span class="font-weight-bold ml-75 d-none d-md-block">
                      {{ token.type }}
                    </span>
                    <span class="ml-25">{{ token.percent }}%</span>
                  </div>
                  <div class="d-flex flex-column">
                    <span class="text-right">{{ formatToken(token) }}</span>
                    <small class="text-right">
                      {{ currency }}{{ formatNumber(token.currency) }}
                    </small>
                  </div>
                </div>
                <!--/ tokens -->
                <!-- Token other -->
                <div v-if="options.length > 0" class="d-flex align-items-center mt-1">
                  <span class="font-weight-bold mr-1">
                    Token:
                  </span>
                  <v-select class="style-chooser w-100 p-0" :options="options" label="id" :placement="placement" select />
                </div>
                <div class="text-right border-top mt-1">
                  <h5 class="mt-1 mb-0">
                    Total: {{ currency }}{{ formatNumber(assetTable.currency) }}
                  </h5>
                </div>
              </div>
            </b-col>
          </b-row>
        </b-card-body>
      </b-card>

      <div class="text-right mb-2">
        <b-button variant="link" size="sm" class="customizer-button" @click="csvExport(dataCsv)">
          Export to CSV
          <feather-icon icon="FileTextIcon" size="16" />
        </b-button>
      </div>

      <b-card title="Transactions" no-body class="text-truncate overflow-auto">
        <b-table :items="txs" :busy="isBusy" :fields="list_fields" striped hover responsive="md" stacked="sm"
          :style="{ fontSize: 'smaller' }">
          <template #table-busy>
            <div class="text-center text-secondary my-2">
              <b-spinner class="align-middle mr-25" />
              <strong>Loading...</strong>
            </div>
          </template>
          <template #cell(block)="data">
            <router-link :to="`../blocks/${data.item.block}`">
              {{ data.item.block }}
            </router-link>
          </template>
          <template #cell(txhash)="data">
            <router-link :to="`../tx/${data.item.txhash}`">
              {{ formatHash(data.item.txhash) }}
            </router-link>
          </template>
          <template #cell(type)="data">
            <b-badge variant="light-secondary">
              {{ data.item.type }}
            </b-badge>
          </template>
          <template #cell(status)="data">
            <b-badge v-if="data.item.status" variant="light-danger">
              Failed
            </b-badge>
            <b-badge v-else variant="light-success">
              Success
            </b-badge>
          </template>
        </b-table>

        <b-pagination v-if="Number(transactions.page_total) > 1" :total-rows="transactions.total_count"
          :per-page="transactions.limit" :value="transactions.page_number" align="center" class="mt-1"
          @change="pageload" />
      </b-card>
      <operation-modal :type="operationModalType" :address="address" :validator-address="selectedValidator" />
      <div id="txevent" />
    </div>
    <div v-else>
      <div class="misc-inner p-2 p-sm-3">
        <div class="w-100 text-center">
          <h2 class="mb-1">
            Account not found 🕵🏻‍♀️
          </h2>
          <span class="mb-2"> Oops! 😖 {{ error }}. </span>
          <operation-modal :type="operationModalType" :address="address" :validator-address="selectedValidator" />
          <b-button variant="primary" class="mb-2 btn-sm-block" :to="{ path: '../' }">
            Back to home
          </b-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs';
import {
  BCard,
  BAvatar,
  BTable,
  BRow,
  BCol,
  BButton,
  BBadge,
  VBModal,
  VBTooltip,
  BPagination,
  BSpinner,
  BCardBody
  // BFormSelect
} from 'bootstrap-vue';
import FeatherIcon from '@/@core/components/feather-icon/FeatherIcon.vue';
import ToastificationContent from '@core/components/toastification/ToastificationContent.vue';
import Ripple from 'vue-ripple-directive';
import VueQr from 'vue-qr';
import chainAPI from '@/libs/fetch';
import {
  formatToken,
  formatTokenAmount,
  formatTokenDenom,
  formatGasAmount,
  getStakingValidatorOperator,
  percent,
  tokenFormatter,
  toDay,
  toDuration,
  abbrMessage,
  abbrAddress,
  getUserCurrency,
  getUserCurrencySign,
  numberWithCommas,
  toETHAddress
} from '@/libs/utils';
import fromExponential from 'from-exponential';
import { codeMessage } from '@/constants/module';
// import ObjectFieldComponent from './ObjectFieldComponent.vue';
import OperationModal from '@/views/components/OperationModal/index.vue';
// import ChartComponentDoughnut from './ChartComponentDoughnut.vue';
import _ from 'lodash';
// import Dropdown from 'vue-simple-search-dropdown';
import vSelect from 'vue-select';

export default {
  components: {
    BRow,
    BCol,
    BCard,
    BAvatar,
    BTable,
    BSpinner,
    FeatherIcon,
    VueQr,
    BButton,
    BBadge,
    BPagination,
    // BFormSelect,
    // eslint-disable-next-line vue/no-unused-components
    ToastificationContent,
    // ObjectFieldComponent,
    // ChartComponentDoughnut,
    OperationModal,
    // Dropdown,
    BCardBody,
    vSelect
    // QRCodeVue3
  },
  directives: {
    'b-modal': VBModal,
    'b-tooltip': VBTooltip,
    Ripple
  },
  beforeRouteUpdate(to, from, next) {
    const { address } = to.params;
    if (address !== from.params.hash) {
      this.address = address;
      this.$http
        .getAuthAccount(this.address)
        .then(acc => {
          this.account = acc;
          this.initial();
          this.$http.getTxsBySender(this.address).then(res => {
            this.transactions = res;
          });
        })
        .catch(err => {
          this.error = err;
        });
      next();
    }
  },
  data() {
    const { address } = this.$route.params;
    return {
      placement: 'down',
      currency: getUserCurrencySign(),
      selectedValidator: '',
      totalCurrency: 0,
      address,
      account: null,
      assets: [],
      reward: [],
      delegations: [],
      redelegations: [],
      unbonding: [],
      quotes: {},
      transactions: [],
      stakingParameters: {},
      operationModalType: '',
      error: null,
      isBusy: false,
      selected: { name: null, id: null },
      isActive: true,
      selectedIndex: 0, // the index of the selected tab,
      tabs: [],
      iconUrl: require('../assets/images/logo/six-protocol.png'),
      options: [{}],
      list_fields: [
        {
          key: 'txhash',
          thClass: 'px-50 py-50',
          tdClass: 'px-50 py-50'
        },
        {
          key: 'type',
          thClass: 'px-50 py-50',
          tdClass: 'px-50 py-50'
        },
        {
          key: 'block',
          thClass: 'px-50 py-50',
          tdClass: 'px-50 py-50'
        },
        {
          key: 'status',
          thClass: 'px-50 py-50',
          tdClass: 'px-50 py-50'
        },
        {
          key: 'from',
          thClass: 'px-50 py-50',
          tdClass: 'px-50 py-50'
        },
        {
          key: 'to',
          thClass: 'px-50 py-50',
          tdClass: 'px-50 py-50'
        },
        {
          key: 'value',
          thClass: 'px-50 py-50',
          tdClass: 'px-50 py-50'
        },
        {
          key: 'commission',
          thClass: 'px-50 py-50',
          tdClass: 'px-50 py-50'
        },
        {
          key: 'txnFee',
          thClass: 'px-50 py-50',
          tdClass: 'px-50 py-50'
        },
        {
          key: 'time',
          thClass: 'px-50 py-50',
          tdClass: 'px-50 py-50'
        }
      ]
    };
  },
  computed: {
    accountTitle() {
      if (this.account && this.account.type) {
        return this.account.type.substring(this.account.type.indexOf('/') + 1);
      }
      return 'Profile';
    },
    txs() {
      if (this.transactions.txs) {
        this.isBusy = false;
        return this.transactions.txs.map(x => ({
          txhash: x.txhash,
          type:
            typeof codeMessage[x.type.split('.').slice(-1)] !== 'undefined'
              ? x.type.split('.').slice(-1)[0] === 'MsgSend' &&
                x.decode_tx.fromAddress !== this.address
                ? 'Receive'
                : codeMessage[x.type.split('.').slice(-1)].message
              : x.type,
          block: Number(x.block_height),
          status: x.decode_tx.err_msg,
          from: x.decode_tx.fromAddress
            ? abbrAddress(x.decode_tx.fromAddress)
            : x.decode_tx.creator
              ? abbrAddress(x.decode_tx.creator)
              : x.decode_tx.delegatorAddress
                ? abbrAddress(x.decode_tx.delegatorAddress)
                : x.decode_tx.depositor
                  ? abbrAddress(x.decode_tx.depositor)
                  : x.decode_tx.voter
                    ? abbrAddress(x.decode_tx.voter)
                    : x.decode_tx.relate_addr.length > 0
                      ? abbrAddress(x.decode_tx.relate_addr[0])
                      : '-',
          to: x.decode_tx.toAddress
            ? abbrAddress(x.decode_tx.toAddress)
            : x.decode_tx.validatorAddress
              ? abbrAddress(x.decode_tx.validatorAddress)
              : '-',
          value:
            typeof x.decode_tx.amount !== 'undefined'
              ? (typeof x.decode_tx.amount.amount !== 'undefined' &&
                `${formatTokenAmount(x.decode_tx.amount.amount) +
                ' ' +
                'SIX'}`) ||
              (typeof x.decode_tx.amount[0] !== 'undefined' &&
                `${formatTokenAmount(x.decode_tx.amount[0].amount) +
                ' ' +
                'SIX'}`) ||
              '-'
              : '-',
          commission:
            typeof x.decode_tx.commission !== 'undefined'
              ? (typeof x.decode_tx.commission.amount !== 'undefined' &&
                `${formatTokenAmount(x.decode_tx.commission.amount) +
                ' ' +
                'SIX'}`) ||
              (typeof x.decode_tx.commission[0] !== 'undefined' &&
                `${formatTokenAmount(x.decode_tx.commission[0].amount) +
                ' ' +
                'SIX'}`) ||
              '-'
              : '-',
          txnFee: `${formatGasAmount(x.decode_tx.fee_amount) + ' ' + 'SIX'}`,
          time: toDay(x.time_stamp)
        }));
      } else {
        this.isBusy = true;
        return [
          {
            txhash: '',
            type: '',
            block: '',
            status: '',
            from: '',
            to: '',
            value: '',
            commission: '',
            txnFee: '',
            time: ''
          }
        ];
      }
    },
    dataCsv() {
      if (this.transactions.txs) {
        return this.transactions.txs.map(x => ({
          txhash: x.txhash,
          type:
            typeof codeMessage[x.type.split('.').slice(-1)] !== 'undefined'
              ? x.type.split('.').slice(-1)[0] === 'MsgSend' &&
                x.decode_tx.fromAddress !== this.address
                ? 'Receive'
                : codeMessage[x.type.split('.').slice(-1)].message
              : x.type,
          block: Number(x.block_height),
          from: x.decode_tx.fromAddress
            ? x.decode_tx.fromAddress
            : x.decode_tx.creator
              ? x.decode_tx.creator
              : x.decode_tx.delegatorAddress
                ? x.decode_tx.delegatorAddress
                : x.decode_tx.depositor
                  ? x.decode_tx.depositor
                  : x.decode_tx.voter
                    ? x.decode_tx.voter
                    : x.decode_tx.relate_addr.length > 0
                      ? x.decode_tx.relate_addr[0]
                      : '-',
          to: x.decode_tx.toAddress
            ? x.decode_tx.toAddress
            : x.decode_tx.validatorAddress
              ? x.decode_tx.validatorAddress
              : '-',
          value:
            typeof x.decode_tx.amount !== 'undefined'
              ? (typeof x.decode_tx.amount.amount !== 'undefined' &&
                `${x.decode_tx.amount.amount / Math.pow(10, 6) +
                ' ' +
                'SIX'}`) ||
              (typeof x.decode_tx.amount[0] !== 'undefined' &&
                `${x.decode_tx.amount[0].amount / Math.pow(10, 6) +
                ' ' +
                'SIX'}`) ||
              '-'
              : '-',
          commission:
            typeof x.decode_tx.commission !== 'undefined'
              ? (typeof x.decode_tx.commission.amount !== 'undefined' &&
                `${x.decode_tx.commission.amount / Math.pow(10, 6) +
                ' ' +
                'SIX'}`) ||
              (typeof x.decode_tx.commission[0] !== 'undefined' &&
                `${x.decode_tx.commission[0].amount / Math.pow(10, 6) +
                ' ' +
                'SIX'}`) ||
              '-'
              : '-',
          txnFee: `${formatGasAmount(x.decode_tx.fee_amount) + ' ' + 'SIX'}`,
          time: toDay(x.time_stamp)
        }));
      }
      return [];
    },
    assetTable() {
      let total = [];
      let sum = 0;
      let sumCurrency = 0;
      total = total.concat(
        this.assets.map(x => {
          const xh = x;
          xh.type = 'Balance';
          xh.color = 'success';
          xh.icon = 'CreditCardIcon';
          xh.currency = this.formatCurrency(xh.amount, xh.denom);
          sumCurrency += xh.currency;
          sum += Number(xh.amount);
          return xh;
        })
      );

      let stakingDenom = '';
      if (this.delegations && this.delegations.length > 0) {
        let temp = 0;
        this.delegations.forEach(x => {
          const xh = x.balance;
          temp += Number(xh.amount);
          sumCurrency += this.formatCurrency(xh.amount, xh.denom);
          sum += Number(xh.amount);
          stakingDenom = xh.denom;
        });
        total.push({
          type: 'Delegation',
          color: 'primary',
          icon: 'LockIcon',
          amount: temp,
          denom: stakingDenom,
          currency: this.formatCurrency(temp, stakingDenom)
        });
      }

      if (this.reward.total) {
        total = total.concat(
          this.reward.total.filter(x => {
            const xh = x;
            xh.type = 'Reward';
            xh.color = 'warning';
            xh.icon = 'TrendingUpIcon';
            xh.currency = this.formatCurrency(xh.amount, xh.denom);
            // sumCurrency += xh.currency;
            if (xh.denom === 'usix') {
              sumCurrency += xh.currency;
              sum += Number(xh.amount);
            }
            // sum += Number(xh.amount);
            return xh.denom === 'usix';
          })
        );
      }
      if (this.unbonding) {
        let tmp1 = 0;
        this.unbonding.forEach(x => {
          x.entries.forEach(e => {
            tmp1 += Number(e.balance);
          });
        });
        if (this.stakingParameters)
          stakingDenom = this.stakingParameters.bond_denom;
        const unbonding = this.formatCurrency(tmp1, stakingDenom);
        sumCurrency += unbonding;
        sum += tmp1;
        total.push({
          type: 'unbonding',
          color: 'danger',
          icon: 'TrendingDownIcon',
          denom: stakingDenom,
          amount: tmp1,
          percent: 0,
          currency: unbonding
        });
      }

      total = total.map(x => {
        const xh = x;
        xh.percent = percent(Number(x.amount) / sum);
        xh.amount = xh.denom === "asix" ? Number(fromExponential(Number(x.amount) / 10 ** 18)).toFixed(2) : xh.amount;
        xh.denom = xh.denom === "asix" ? "six (evm)" : xh.denom;
        return xh;
      });
      return {
        items: total,
        currency: parseFloat(sumCurrency.toFixed(2))
      };
    },
    deleTable() {
      const re = [];
      if (
        this.reward.rewards &&
        this.delegations &&
        this.delegations.length > 0
      ) {
        this.delegations.forEach(e => {
          const reward = this.reward.rewards.find(
            r => r.validator_address === e.delegation.validator_address
          );

          re.push({
            validator: getStakingValidatorOperator(
              this.$http.config.chain_name,
              e.delegation.validator_address,
              8
            ),
            token: formatToken(e.balance, {}, 2),
            reward: tokenFormatter(reward.reward, this.denoms),
            action: e.delegation.validator_address
          });
        });
      }
      return re;
    },
    accTable() {
      let table = {};
      if (
        this.account &&
        this.account.type === 'cosmos-sdk/PeriodicVestingAccount'
      ) {
        table = this.account.value;
      }
      return table;
    },
    denoms() {
      return this.$store.state.chains.denoms;
    },
    isEthAddr() {
      return JSON.stringify(this.account).indexOf('PubKeyEthSecp256k1') > 0;
    }
  },
  created() {
    this.tabs = this.$children;
    this.$http
      .getAuthAccount(this.address)
      .then(acc => {
        this.account = acc;
        this.initial();
        this.$http.getTxsBySender(this.address).then(res => {
          this.transactions = res;
        });
        this.$http.getStakingParameters().then(res => {
          this.stakingParameters = res;
        });
      })
      .catch(err => {
        this.error = err;
      });
  },
  mounted() {
    const elem = document.getElementById('txevent');
    elem.addEventListener('txcompleted', () => {
      this.initial();
    });
  },
  methods: {
    initial() {
      this.$http.getBankAccountBalance(this.address).then(bal => {
        this.assets = bal;
        bal.forEach(x => {
          const symbol = formatTokenDenom(x.denom);
          if (!this.quotes[symbol] && symbol.indexOf('/') === -1) {
            chainAPI.fetchTokenQuote(symbol).then(quote => {
              this.$set(this.quotes, symbol, quote);
            });
          }
        });
      });
      this.$http.getBankAccountBalanceToken(this.address).then(bal => {
        let array = [];
        const filterData = bal.result.filter(x => {
          // return x.denom === 'usix';
          return x.denom;
        });
        if (filterData.length > 0) {
          bal.result.map((x, i) => {
            array.push({
              name: formatTokenDenom(x.denom),
              id: x.denom !== "asix" ? this.formatAmount(x.amount) + ' ' + formatTokenDenom(x.denom)
                : parseFloat(Number(x.amount) / Math.pow(10, 18)).toFixed(2)
                + ' '
                + "six (evm)"
            });
          });
        }
        this.options = array;
      });
      this.$http.getStakingReward(this.address).then(res => {
        const amount = res.rewards.map(val => {
          return val.reward;
        });
        const validatorAddress = res.rewards.map(val => {
          return val.validator_address;
        });
        const rewards = amount[0];
        const mapObject = {
          rewards: [
            {
              reward: rewards,
              validator_address: validatorAddress[0]
            }
          ],
          total: res.total
        };

        this.reward = mapObject;
      });
      this.$http.getStakingDelegations(this.address).then(res => {
        this.delegations = res.delegation_responses || res;
      });
      this.$http.getStakingUnbonding(this.address).then(res => {
        this.unbonding = res.unbonding_responses || res;
      });
    },
    validateSelection(selection) {
      this.selected = selection;
    },
    formatNumber(v) {
      return numberWithCommas(v);
    },
    pageload(v) {
      this.$http.getTxsBySender(this.address, v).then(res => {
        this.transactions = res;
      });
    },
    selectValue(v, type) {
      this.selectedValidator = v;
      this.setOperationModalType(type);
    },
    setOperationModalType(type) {
      this.operationModalType = type;
    },
    formatHash: abbrAddress,
    formatAddress: abbrAddress,
    formatDenom(v) {
      return formatTokenDenom(this.denoms[v] ? this.denoms[v] : v);
    },
    formatAmount(v, dec = 2, denom = 'uatom', format = true) {
      return formatTokenAmount(v, dec, denom, format);
    },
    formatToken(v) {
      return tokenFormatter(v, this.denoms);
    },
    formatCurrency(amount, denom) {
      const qty = this.formatAmount(amount, 2, denom, false);
      const d2 = this.formatDenom(denom);
      const userCurrency = getUserCurrency();
      const quote = this.$store.state.chains.quotes['six-network'];
      if (quote) {
        const price = quote[userCurrency];
        return parseFloat((qty * price).toFixed(2));
      }
      return 0;
    },
    formatDate: v => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
    formatTime: v => toDay(Number(v) * 1000),
    formatLength: v => toDuration(Number(v) * 1000),
    copy() {
      this.$copyText(this.address).then(
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
    },
    ethaddress() {
      return toETHAddress(this.address);
    },
    csvExport(arrData) {
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += [
        Object.keys(arrData[0]).join(','),
        ...arrData.map(item => Object.values(item).join(','))
      ]
        .join('\n')
        .replace(/(^\[)|(\]$)/gm, '');
      const data = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', data);
      link.setAttribute('download', 'export-transaction-account.csv');
      link.click();
    }
  }
};
</script>

<style lang="scss" scoped>
@import '~@core/scss/base/bootstrap-extended/include';
@import '~@core/scss/base/components/variables-dark';

.customizer-button {
  background-color: $info;
  color: #fff;
  border-radius: 12px;
  font-size: 0.9rem;
  padding: 6px 14px;

  .dark-layout & {
    background-color: $primary;
  }
}

.customizer-button-danger {
  background-color: $danger;
  color: #fff;
  border-radius: 12px;
}

.customizer-addr {
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
  font-size: 0.9rem;
  font-weight: 600;
}
</style>
