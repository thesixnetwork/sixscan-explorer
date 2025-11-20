<template>
  <div>
    <b-card class="customizer-border">
      <b-row>
        <!-- User Info: Left col -->
        <b-col
          cols="12"
          xl="6"
          class="d-flex justify-content-between flex-column"
        >
          <!-- User Avatar & Action Buttons -->
          <div class="d-flex justify-content-start">
            <b-avatar
              v-if="validator.description.details"
              :src="avatarUrl(validator.description.details)"
              alt="avatar"
              variant="link"
              class="customizer-icon"
              size="104px"
              rounded
              :style="{ border: '1px solid rgba(198,198,198,0.5)' }"
            />
            <b-avatar
              v-else
              alt="avatar"
              variant="link"
              class="customizer-icon"
              size="104px"
              rounded
              :style="{ border: '1px solid rgba(198,198,198,0.5)' }"
            />
            <div class="d-flex flex-column ml-1">
              <div class="mb-1">
                <h4 class="mb-25 text-uppercase">
                  {{ validator.description.moniker }}
                </h4>
                <span v-if="validator.description.details">
                  {{ fetch_details(validator.description.details).sd }}
                </span>
              </div>
              <!-- <div class="d-flex flex-wrap">
                <b-button
                  v-b-modal.operation-modal
                  variant="link"
                  class="mr-25 mb-25 customizer-button"
                >
                  Delegate
                </b-button>
              </div> -->
            </div>
          </div>

          <!-- User Stats -->
          <div class="d-flex flex-wrap align-items-center mt-2">
            <div class="d-flex align-items-center mr-2">
              <b-avatar variant="light-primary" rounded>
                <feather-icon icon="DollarSignIcon" size="18" />
              </b-avatar>
              <div class="ml-1">
                <h5 class="mb-0">
                  {{ tokenFormatter(validator.tokens) }}
                </h5>
                <small>Bonded Tokens</small>
              </div>
            </div>

            <div class="d-flex align-items-center mr-2">
              <b-avatar variant="light-warning" rounded>
                <feather-icon icon="DivideCircleIcon" size="18" />
              </b-avatar>
              <div class="ml-1">
                <h5 class="mb-0">
                  {{
                    percentFormat(
                      selfDelegation.balance.amount / validator.tokens
                    )
                  }}%
                </h5>
                <small>Self Delegation</small>
              </div>
            </div>

            <div v-if="mintInflation" class="d-flex align-items-center">
              <b-avatar variant="light-success" rounded>
                <feather-icon icon="TrendingUpIcon" size="18" />
              </b-avatar>
              <div class="ml-1">
                <h5 class="mb-0">
                  {{ getAnnualProfit() }}
                </h5>
                <small>Annual Profit</small>
              </div>
            </div>
          </div>
        </b-col>

        <!-- Right Col: Table -->
        <b-col cols="12" xl="6">
          <table class="mt-2 mt-xl-0 w-100">
            <tr>
              <th class="pb-50 d-flex align-items-center">
                <feather-icon icon="ActivityIcon" class="mr-75" />
                <span class="font-weight-bold">Status</span>
              </th>
              <td class="pb-50 text-capitalize">
                <b-badge v-if="validator.status === 'BOND_STATUS_BONDED' || validator.status == 3" variant="light-success">
                  Active
                </b-badge>
                <b-badge v-else-if="validator.status === 'BOND_STATUS_UNBONDING'" variant="light-warning">
                  Unbonding
                </b-badge>
                <b-badge v-else-if="validator.status === 'BOND_STATUS_UNBONDED'" variant="light-danger">
                  Unbonded
                </b-badge>
                <span v-else>{{ validator.status }}</span>
              </td>
            </tr>
            <tr>
              <th class="pb-50 d-flex align-items-center">
                <feather-icon icon="StarIcon" class="mr-75" />
                <span class="font-weight-bold">Min Self Delegation</span>
              </th>
              <td class="pb-50">
                {{ tokenFormatter(validator.min_self_delegation) }}
              </td>
            </tr>
            <tr>
              <th class="d-flex align-items-center">
                <feather-icon icon="GlobeIcon" class="mr-75" />
                <span class="font-weight-bold">Website</span>
              </th>
              <td v-if="validator.description.website">
                <a
                  :href="validator.description.website"
                  target="_blank"
                  rel="nofollow"
                >
                  <span class="d-inline-block text-truncate customizer-url">
                    {{ validator.description.website }}
                  </span>
                </a>
              </td>
              <td v-else class="pb-50">
                <span>{{ '-' }}</span>
              </td>
            </tr>
            <tr>
              <th class="d-flex align-items-center">
                <feather-icon icon="FacebookIcon" class="mr-75" />
                <span class="font-weight-bold">Facebook</span>
              </th>
              <td v-if="validator.description.security_contact">
                <a
                  :href="
                    fetch_details(validator.description.security_contact).fb
                  "
                  target="_blank"
                  rel="nofollow"
                >
                  <span class="d-inline-block text-truncate customizer-url">
                    {{
                      fetch_details(validator.description.security_contact)
                        .fb || '-'
                    }}
                  </span>
                </a>
              </td>
              <td v-else>
                <span>{{ '-' }}</span>
              </td>
            </tr>
            <!-- SIX Protocol specific fields -->
            <tr v-if="validator.max_license">
              <th class="d-flex align-items-center">
                <feather-icon icon="AwardIcon" class="mr-75" />
                <span class="font-weight-bold">Max License</span>
              </th>
              <td class="pb-50">
                {{ validator.max_license }}
              </td>
            </tr>
            <tr v-if="validator.license_count">
              <th class="d-flex align-items-center">
                <feather-icon icon="CreditCardIcon" class="mr-75" />
                <span class="font-weight-bold">License Count</span>
              </th>
              <td class="pb-50">
                {{ validator.license_count }}
              </td>
            </tr>
            <tr v-if="validator.mode">
              <th class="d-flex align-items-center">
                <feather-icon icon="SettingsIcon" class="mr-75" />
                <span class="font-weight-bold">Mode</span>
              </th>
              <td class="pb-50">
                <b-badge variant="light-info">
                  {{ formatValidatorMode(validator.mode) }}
                </b-badge>
              </td>
            </tr>
            <tr v-if="typeof validator.enable_redelegation !== 'undefined'">
              <th class="d-flex align-items-center">
                <feather-icon icon="RefreshCwIcon" class="mr-75" />
                <span class="font-weight-bold">Redelegation</span>
              </th>
              <td class="pb-50">
                <b-badge :variant="validator.enable_redelegation ? 'light-success' : 'light-danger'">
                  {{ validator.enable_redelegation ? 'Enabled' : 'Disabled' }}
                </b-badge>
              </td>
            </tr>
          </table>
        </b-col>
      </b-row>
    </b-card>

    <!-- First Row -->
    <template>
      <b-row class="match-height">
        <b-col lg="4" md="12">
          <staking-commission-component :data="validator.commission" />
        </b-col>
        <b-col lg="4" md="12">
          <staking-reward-component
            :data="distribution"
            :validator="validator.operator_address"
            :address="accountAddress"
          />
        </b-col>
        <b-col lg="4" md="12">
          <staking-address-component
            :hex-address="hexAddress"
            :operator-address="validator.operator_address"
            :consensus-pubkey="validator.consensus_pubkey"
            :account-address="accountAddress"
          />
        </b-col>
      </b-row>
      <div class="groupContainer">
        <b-form-group class="mb-0">
          <b-form-radio-group
            id="tab-table"
            v-model="selectedOption"
            button-variant="outline-primary"
            :options="optionBlock"
            buttons
            name="btn-default"
            @change="validatorBlocks"
          />
        </b-form-group>
        <div class="csvStyle">
          <b-button
            v-if="selectedOption === 'account_tx'"
            variant="link"
            size="sm"
            class="customizer-button"
            @click="csvExport(accountTxsCsv)"
          >
            Account Txs to CSV
            <feather-icon icon="FileTextIcon" size="16" />
          </b-button>
          <b-button
            v-else-if="selectedOption === 'validator_tx'"
            variant="link"
            size="sm"
            class="customizer-button"
            @click="csvExport(validatorTxsCsv)"
          >
            Validator Txs to CSV
            <feather-icon icon="FileTextIcon" size="16" />
          </b-button>
          <b-button
            v-else
            variant="link"
            size="sm"
            class="customizer-button"
            @click="csvExport(blockCsv)"
          >
            Propose to CSV
            <feather-icon icon="FileTextIcon" size="16" />
          </b-button>
        
        </div>
      </div>
      <b-card
        v-if="selectedOption === 'account_tx'"
        no-body
        class="overflow-auto"
      >
        <b-card-body class="pl-0 pr-0 pb-0">
          <b-table
            :items="accountTxs"
            :busy="isBusy"
            striped
            hover
            responsive
            stacked="sm"
            :style="{ fontSize: 'smaller' }"
          >
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
          <b-pagination
            v-if="Number(account_txs.page_total) > 1"
            :total-rows="account_txs.total_count"
            :per-page="account_txs.limit"
            :value="account_txs.page_number"
            align="center"
            class="mt-1"
            @change="pageload"
          />
        </b-card-body>
      </b-card>
      <b-card
        v-else-if="selectedOption === 'validator_tx'"
        no-body
        class="overflow-auto"
      >
        <b-card-body class="pl-0 pr-0 pb-0">
          <b-table
            :items="validatorTxs"
            :busy="isBusy"
            striped
            hover
            responsive
            stacked="sm"
            :style="{ fontSize: 'smaller' }"
          >
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
          <b-pagination
            v-if="Number(validator_txs.page_total) > 1"
            :total-rows="validator_txs.total_count"
            :per-page="validator_txs.limit"
            :value="validator_txs.page_number"
            align="center"
            class="mt-1"
            @change="pageload"
          />
        </b-card-body>
      </b-card>
      <b-card v-else no-body class="overflow-auto">
        <b-card-body class="pl-0 pr-0 pb-0">
          <b-table
            :items="proposeTxs"
            :busy="isBusy"
            :fields="list_blocks"
            striped
            hover
            responsive
            stacked="sm"
            :style="{ fontSize: 'smaller' }"
          >
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
          <b-pagination
            v-if="Number(proposeTransactions.page_total) > 1"
            :total-rows="proposeTransactions.total_count"
            :per-page="proposeTransactions.limit"
            :value="proposeTransactions.page_number"
            align="center"
            class="mt-1"
            @change="pageload"
          />
        </b-card-body>
      </b-card>
    </template>
    <operation-modal
      type="Delegate"
      :validator-address="validator.operator_address"
    />
    <div id="txevent" />
  </div>
</template>

<script>
import {
  BCard,
  BButton,
  BAvatar,
  BRow,
  BCol,
  BTable,
  VBTooltip,
  VBModal,
  BBadge,
  BPagination,
  BFormRadioGroup,
  BFormGroup,
  BSpinner
} from 'bootstrap-vue';
import {
  percent,
  formatToken,
  StakingParameters,
  Validator,
  operatorAddressToAccount,
  consensusPubkeyToHexAddress,
  toDay,
  abbrAddress,
  formatTokenAmount,
  formatGasAmount
} from '@/libs/utils';
import _ from 'lodash';
import moment from 'moment';
import { keybase } from '@/libs/fetch';
import { codeMessage } from '@/constants/module';
import fromExponential from 'from-exponential';
import StakingAddressComponent from './StakingAddressComponent.vue';
import StakingCommissionComponent from './StakingCommissionComponent.vue';
import StakingRewardComponent from './StakingRewardComponent.vue';
import OperationModal from '@/views/components/OperationModal/index.vue';

export default {
  components: {
    BCard,
    BButton,
    BRow,
    BCol,
    BAvatar,
    BBadge,
    BPagination,
    BTable,
    BSpinner,
    BFormRadioGroup,
    BFormGroup,
    StakingAddressComponent,
    StakingCommissionComponent,
    StakingRewardComponent,
    // eslint-disable-next-line vue/no-unused-components
    OperationModal
  },
  directives: {
    'b-modal': VBModal,
    'b-tooltip': VBTooltip
  },
  data() {
    return {
      commission: {
        series: [90],
        completed: 89,
        inProgress: 64
      },
      selfDelegation: {
        balance: { amount: 0 }
      },
      latestHeight: 0,
      accountAddress: '-',
      hexAddress: '-',
      stakingPool: {},
      bankTotals: {},
      communityTax: {},
      mintInflation: 0,
      stakingParameter: new StakingParameters(),
      validator: new Validator(),
      userData: {},
      blocks: Array.from('0'.repeat(100)).map(x => [Boolean(x), Number(x)]),
      distribution: {},
      account_txs: {},
      validator_txs: {},
      isBusy: false,
      proposeTransactions: [], // Initialize as array, not object
      proposeApiLoaded: false, // Track if API has completed
      optionBlock: [
        { text: 'Account Txs', value: 'account_tx' },
        { text: 'Validator Txs', value: 'validator_tx' },
        { text: 'Proposal Block', value: 'proposal_block' }
      ],
      selectedOption: 'account_tx',
      list_blocks: [
        {
          key: 'date',
          label: 'Date',
          sortable: true
        },
        { key: 'totalTxs', label: 'Total Txs', sortable: true },
        {
          key: 'totalProposed',
          label: 'Total Block Proposed',
          sortable: true
        }
      ]
    };
  },

  computed: {
    accountTxs() {
      if (this.account_txs.txs) {
        this.isBusy = false;
        return this.account_txs.txs.map(x => ({
          txhash: x.txhash,
          type:
            typeof codeMessage[x.type.split('.').slice(-1)] !== 'undefined'
              ? x.type.split('.').slice(-1)[0] === 'MsgSend' &&
                x.decode_tx.fromAddress !== this.accountAddress
                ? 'Receive'
                : codeMessage[x.type.split('.').slice(-1)].message
              : x.type,
          block: Number(x.block_height),
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
            value: '',
            commission: '',
            txnFee: '',
            time: ''
          }
        ];
      }
    },
    validatorTxs() {
      if (this.validator_txs.txs) {
        this.isBusy = false;
        return this.validator_txs.txs.map(x => ({
          txhash: x.txhash,
          type:
            typeof codeMessage[x.type.split('.').slice(-1)] !== 'undefined'
              ? x.type.split('.').slice(-1)[0] === 'MsgSend' &&
                x.decode_tx.fromAddress !== this.accountAddress
                ? 'Receive'
                : codeMessage[x.type.split('.').slice(-1)].message
              : x.type,
          block: Number(x.block_height),
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
            value: '',
            commission: '',
            txnFee: '',
            time: ''
          }
        ];
      }
    },
    proposeTxs() {
      // Check if we should show loading state
      if (!this.proposeApiLoaded) {
        this.isBusy = true;
        return [
          {
            date: '',
            totalTxs: '',
            totalProposed: ''
          }
        ];
      }
      
      // Ensure we have a valid array with data
      if (Array.isArray(this.proposeTransactions) && this.proposeTransactions.length > 0) {

        this.isBusy = false;
        
        return this.proposeTransactions.map(x => {

          return {
            date:
              moment(String(x._id?.month || '')).format('MMMM') +
              ' ' +
              moment(String(x._id?.year || '')).format('YYYY'),
            totalTxs: x.txsSize || 0,
            totalProposed: x.proposeCount || 0
          };
        });
      } else {

        this.isBusy = false; // Don't show loading, show empty state
        return [];
      }
    },
    accountTxsCsv() {
      if (this.account_txs.txs) {
        return this.account_txs.txs.map(x => ({
          txhash: x.txhash,
          type:
            typeof codeMessage[x.type.split('.').slice(-1)] !== 'undefined'
              ? x.type.split('.').slice(-1)[0] === 'MsgSend' &&
                x.decode_tx.fromAddress !== this.accountAddress
                ? 'Receive'
                : codeMessage[x.type.split('.').slice(-1)].message
              : x.type,
          block: Number(x.block_height),
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
    validatorTxsCsv() {
      if (this.validator_txs.txs) {
        return this.validator_txs.txs.map(x => ({
          txhash: x.txhash,
          type:
            typeof codeMessage[x.type.split('.').slice(-1)] !== 'undefined'
              ? x.type.split('.').slice(-1)[0] === 'MsgSend' &&
                x.decode_tx.fromAddress !== this.accountAddress
                ? 'Receive'
                : codeMessage[x.type.split('.').slice(-1)].message
              : x.type,
          block: Number(x.block_height),
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
    blockCsv() {
      if (Array.isArray(this.proposeTransactions) && this.proposeTransactions.length) {
        return this.proposeTransactions.map(x => ({
          date:
            moment(String(x._id?.month || '')).format('MMMM') +
            ' ' +
            moment(String(x._id?.year || '')).format('YYYY'),
          totalTxs: x.txsSize || 0,
          totalProposed: x.proposeCount || 0
        }));
      }
      return [];
    }
  },
  created() {
    this.$http.getStakingPool().then(res => {
      this.stakingPool = res.element.pool;
    });
    this.$http.getStakingParameters().then(res => {
      this.stakingParameter = res;
    });
    this.$http.getMintingInflation().then(res => {
      this.mintInflation = res;
    });
    this.$http.getBankTotals().then(res => {
      this.bankTotals = res;
    });
    this.$http.getCommunityTax().then(res => {
      this.communityTax = res;
    });
    this.address = this.$route.params.address;
    this.initial();
  },
  mounted() {
    const elem = document.getElementById('txevent');
    elem.addEventListener('txcompleted', () => {
      this.initial();
    });
  },
  methods: {
    initial() {
      // Try direct API call first to get raw data
      const validatorUrl = `${this.$http.config.api}/cosmos/staking/v1beta1/validators/${this.address}`;
      
      fetch(validatorUrl)
        .then(response => response.json())
        .then(rawData => {
          if (rawData.validator) {
            const validator = rawData.validator;

            // Use raw data with minimal processing
            this.validator = {
              ...validator,
              tokens: Number(validator.tokens),
              delegator_shares: Number(validator.delegator_shares),
              min_self_delegation: Number(validator.min_self_delegation || 0),
              // Keep commission structure as-is from API
              commission: validator.commission
            };
            
           
            
            // Continue with rest of initialization
            this.processAddress(this.validator.operator_address, this.validator.consensus_pubkey);
            this.$http.getTxsBySender(this.accountAddress).then(res => {
              this.account_txs = res;
            });
            this.$http.getTxsBySender(this.operatorAddress).then(res => {
              this.validator_txs = res;
            });

            const { identity } = this.validator.description;
            keybase(identity).then(d => {
              if (Array.isArray(d.them) && d.them.length > 0) {
                this.$set(this.validator, 'avatar', d.them[0].pictures.primary.url);
                this.$store.commit('cacheAvatar', {
                  identity,
                  url: d.them[0].pictures.primary.url
                });
              }
            });
            this.hexAddress = consensusPubkeyToHexAddress(this.validator.consensus_pubkey);

            
            if (!this.hexAddress || this.hexAddress === '-' || this.hexAddress === 'N/A') {
              this.proposeTransactions = [];
              this.proposeApiLoaded = true; // Mark as loaded so it doesn't show loading state
              return;
            }
            
            // Use environment variable or fallback to a reasonable default
            const apiValidatorBase = process.env.VUE_APP_API_VALIDATOR;
            const proposeUrl = `${apiValidatorBase}/api/validator/propose-count?proposerAddr=${this.hexAddress}`;

            
            fetch(proposeUrl)
              .then(response => {
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
              })
              .then(resp => {
                this.proposeTransactions = Array.isArray(resp.data) ? resp.data : [];
                this.proposeApiLoaded = true; // Mark API as loaded
              })
              .catch(error => {
                this.proposeTransactions = []; // Ensure it's always an array
                this.proposeApiLoaded = true; // Mark API as loaded even on error
              });
          }
        })
        .catch(error => {
          
          // Fallback to the original processed data
          this.$http.getStakingValidator(this.address).then(data => {
            this.validator = data;
            this.processAddress(data.operator_address, data.consensus_pubkey);
            this.$http.getTxsBySender(this.accountAddress).then(res => {
              this.account_txs = res;
            });
            this.$http.getTxsBySender(this.operatorAddress).then(res => {
              this.validator_txs = res;
            });

            const { identity } = data.description;
            keybase(identity).then(d => {
              if (Array.isArray(d.them) && d.them.length > 0) {
                this.$set(this.validator, 'avatar', d.them[0].pictures.primary.url);
                this.$store.commit('cacheAvatar', {
                  identity,
                  url: d.them[0].pictures.primary.url
                });
              }
            });
            this.hexAddress = consensusPubkeyToHexAddress(data.consensus_pubkey);            
            if (!this.hexAddress || this.hexAddress === '-' || this.hexAddress === 'N/A') {
              this.proposeTransactions = [];
              this.proposeApiLoaded = true; // Mark as loaded so it doesn't show loading state
              return;
            }
            
            // Use environment variable or fallback to a reasonable default
            const apiValidatorBase = process.env.VUE_APP_API_VALIDATOR;
            const proposeUrl = `${apiValidatorBase}/api/validator/propose-count?proposerAddr=${this.hexAddress}`;
            fetch(proposeUrl)
              .then(response => {

                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
              })
              .then(resp => {
                this.proposeTransactions = Array.isArray(resp.data) ? resp.data : [];
                this.proposeApiLoaded = true; // Mark API as loaded
              })
              .catch(error => {
                this.proposeTransactions = []; // Ensure it's always an array
                this.proposeApiLoaded = true; // Mark API as loaded even on error
              });
          });
        });
        
      // Load validator distribution data
      this.$http.getValidatorDistribution(this.address).then(res => {        
        // Process self bond rewards - handle both null and empty array
        const self = res.self_bond_rewards && Array.isArray(res.self_bond_rewards) && res.self_bond_rewards.length > 0 
          ? res.self_bond_rewards.map(x => {
              const xh = { ...x };
              xh.amount = xh.denom === 'asix'
                ? Number(fromExponential(Number(x.amount) / 10 ** 18)).toFixed(2)
                : xh.amount;
              return xh;
            })
          : []; // Return empty array instead of false
        
        // Process commission - handle both null and empty array
        const commission = res.val_commission && Array.isArray(res.val_commission) && res.val_commission.length > 0
          ? res.val_commission.map(x => {
              const xh = { ...x };
              xh.amount = xh.denom === 'asix'
                ? Number(fromExponential(Number(x.amount) / 10 ** 18)).toFixed(2)
                : xh.amount;
              return xh;
            })
          : []; // Return empty array instead of false

        const mapObject = {
          element: res.element,
          operator_address: res.operator_address,
          self_bond_rewards: self,
          val_commission: commission
        };
        this.distribution = mapObject;
      }).catch(error => {
        // Set empty distribution object on error
        this.distribution = {
          operator_address: '',
          self_bond_rewards: [],
          val_commission: []
        };
      });
    },
    pageload(v) {
      this.$http.getTxsBySender(this.accountAddress, v).then(res => {
        this.account_txs = res;
      });
      this.$http.getTxsBySender(this.operatorAddress, v).then(res => {
        this.validator_txs = res;
      });
    },
    formatHash: abbrAddress,
    timeFormat(value) {
      return toDay(value);
    },
    percentFormat(value) {
      return percent(value);
    },
    processAddress(operAddress, consensusPubkey) { 
      this.accountAddress = operatorAddressToAccount(operAddress);
      this.operatorAddress = operAddress;
      
      try {
        // The consensusPubkeyToHexAddress function expects the full pubkey object
        // not just the key string
        if (consensusPubkey && typeof consensusPubkey === 'object') {
          // Unwrap Vue Observer to get raw object before passing to utility function
          const rawConsensusPubkey = JSON.parse(JSON.stringify(consensusPubkey));
          this.hexAddress = consensusPubkeyToHexAddress(rawConsensusPubkey);
        } else if (typeof consensusPubkey === 'string') {
          // For string format, try direct conversion
          this.hexAddress = consensusPubkeyToHexAddress(consensusPubkey);
        } else {
          this.hexAddress = '-';
          return;
        }
      } catch (error) {
        
        // For now, just skip the hex address conversion and set a placeholder
        // This will allow the rest of the component to work properly
        this.hexAddress = 'N/A';

      }
      
      this.$http
        .getStakingDelegatorDelegation(this.accountAddress, operAddress)
        .then(d => {
          this.selfDelegation = d;
        })
        .catch(error => {
          this.selfDelegation = { balance: { amount: 0 } };
        });
    },
    tokenFormatter(token) {
      const denomination = this.stakingParameter?.bond_denom || 'usix'; // Fallback to usix
      const result = formatToken({
        amount: token,
        denom: denomination
      });
      return result;
    },
    apr(rate) {
      
      // Check if required data is available
      if (!this.mintInflation || !this.bankTotals || !Array.isArray(this.bankTotals) || this.bankTotals.length === 0) {
        return '0.00 %';
      }
      
      const bondedTokenExists = this.stakingPool?.bondedToken || this.stakingPool?.bonded_tokens;
      if (!bondedTokenExists) {
        return '0.00 %';
      }
      
      const communityTaxExists = this.communityTax?.params?.community_tax !== undefined || this.communityTax?.community_tax !== undefined;
      if (!communityTaxExists) {
        return '0.00 %';
      }
      
      // Get bank total supply - handle different possible formats
      const bankAmount = Number(this.bankTotals[0]?.amount || 0);
      
      // Convert bank amount to same unit as bonded tokens (divide by 10^18 for SIX Protocol)
      // SIX Protocol uses 18 decimals, but staking amounts are typically in 6 decimals
      const normalizedBankAmount = bankAmount / (10 ** 18); // Convert from asix to SIX
      
      // Calculate provision using normalized amount
      const provision = (this.mintInflation * normalizedBankAmount) || 0;
      
      const bondedTokenValue = this.stakingPool.bondedToken || this.stakingPool.bonded_tokens;
      
      // Convert bonded tokens to SIX units (from usix)
      const allStakedToken = Number(bondedTokenValue) / (10 ** 6) || 0; // Convert from usix to SIX
      
      // Prevent division by zero
      if (allStakedToken === 0) {
        return '0.00 %';
      }
      
      const communityTaxValue = this.communityTax.params?.community_tax || this.communityTax.community_tax;
      const communityTaxRate = Number(communityTaxValue || 0);
      
      // Handle string rates that might need to be converted from string decimals
      let validatorRate = 0;
      if (typeof rate === 'string' && rate.includes('.')) {
        validatorRate = parseFloat(rate);
      } else {
        validatorRate = Number(rate || 0);
      }
      
      // Special handling for 100% commission validators
      if (validatorRate >= 1.0) {
        
        return '0.00 % (100% Commission)';
      }
      
      // Calculate the ratio of provision to staked tokens
      const provisionRatio = provision / allStakedToken;
      
      const annualProfit =
        provisionRatio *
        (1 - communityTaxRate) *
        (1 - validatorRate);
        
      // Check for invalid results or unreasonable values
      if (!isFinite(annualProfit) || isNaN(annualProfit)) {
        return '0.00 %';
      }
    
      const percentResult = parseFloat((annualProfit * 100).toFixed(3));
      
      return `${percentResult} %`;
    },
    fetch_status(item, lastHeight) {
      return this.$http.getBlockByHeight(item[1]).then(res => {
        if (item[1] !== lastHeight) {
          const sigs = res.block.last_commit.signatures.find(
            s => s.validator_address === this.hexAddress
          );
          const block = this.blocks.find(b => b[1] === item[1]);
          if (typeof block !== 'undefined') {
            this.$set(block, 0, typeof sigs !== 'undefined');
          }
        }
      });
    },
    fetch_latest() {
      this.$http.getLatestBlock().then(res => {
        const sigs = res.block.last_commit.signatures.find(
          s => s.validator_address === this.hexAddress
        );
        const block = this.blocks.find(
          b => b[1] === res.block.last_commit.height
        );
        if (typeof block === 'undefined') {
          // mei
          // this.$set(block, 0, typeof sigs !== 'undefined')
          if (this.blocks.length > 999) this.blocks.shift();
          this.blocks.push([
            typeof sigs !== 'undefined',
            res.block.last_commit.height
          ]);
        }
      });
    },
    fetch_details(data) {
      const output = {};
      if (!data || typeof data !== 'string') return output;

      try {
        data.split('|').forEach(pair => {
          const [key, value] = pair.split('=');
          if (key && value) _.set(output, key, value);
        });
      } catch (err) {
        // Silently handle parsing errors
      }

      return output;
    },
    avatarUrl(details) {
      if (!details) return null;

      const { im } = this.fetch_details(details);
      if (!im) return null;

      if (im.startsWith('n:')) {
        const id = im.slice(2);
        const url = `https://files.catbox.moe/${id}.png`;
        return url;
      }

      const url = `https://i.imgur.com/${im}.png`;
      return url;
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
      link.setAttribute('download', `export-${this.selectedOption}-txs.csv`);
      link.click();
    },
    // csvExportPropose(arrData) {
    //   let csvContent = 'data:text/csv;charset=utf-8,';
    //   csvContent += [
    //     Object.keys(arrData[0]).join(','),
    //     ...arrData.map(item => Object.values(item).join(','))
    //   ]
    //     .join('\n')
    //     .replace(/(^\[)|(\]$)/gm, '');
    //   const data = encodeURI(csvContent);
    //   const link = document.createElement('a');
    //   link.setAttribute('href', data);
    //   link.setAttribute('download', 'export-validate-propose.csv');
    //   link.click();
    // },
    validatorBlocks() {
      if (this.isInactiveLoaded) return;
      this.isInactiveLoaded = true;
    },
    formatValidatorMode(mode) {
      if (!mode) return '';
      return mode.replace('MODE_', '');
    },
    getAnnualProfit() {      
      const rate = this.validator.commission?.commission_rates?.rate || 
                   this.validator.commission?.rate || 0;
      return this.apr(rate);
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
  font-size: 0.9rem;
  border-radius: 12px;
  padding: 6px 14px;

  .dark-layout & {
    background-color: $primary;
    color: #fff;
  }
}

.customizer-icon {
  color: $info;
  background-color: rgba($info, 0.12);

  .dark-layout & {
    color: $primary;
    background-color: rgba($primary, 0.12);
  }
}

.customizer-border {
  border: 1px solid $info;

  .dark-layout & {
    border: 1px solid $primary;
  }
}

.customizer-url {
  max-width: unset;

  @include media-breakpoint-down(xs) {
    max-width: 140px !important;
  }
}

.groupContainer {
  margin-bottom: 14px;

  @include media-breakpoint-up(sm) {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.csvStyle {
  @include media-breakpoint-up(md) {
    text-align: right;
  }

  @include media-breakpoint-down(xs) {
    margin-top: 14px;
  }
}
</style>
