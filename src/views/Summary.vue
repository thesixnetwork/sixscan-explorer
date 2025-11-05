<template>
  <div>
    <b-alert variant="danger" :show="syncing">
      <div class="alert-body">
        <span>
          No new blocks have been produced since
          <strong>{{ latestTime }}</strong>
        </span>
      </div>
    </b-alert>
    <b-row>
      <b-col>
        <summary-parmeters-component :data="chain" />
      </b-col>
    </b-row>
    <b-row v-if="marketChartData">
      <b-col>
        <b-card>
          <summary-price-chart
            :chart-data="marketChartData"
            :height="150"
            :min-height="150"
          />
        </b-card>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <summary-assets-component />
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-card no-body class="text-truncate">
          <b-card-header>
            <b-card-title>
              Blocks
            </b-card-title>
          </b-card-header>
          <b-table
            :items="blocks"
            :fields="list_fields"
            :sort-desc="true"
            sort-by="tokens"
            striped
            hover
            stacked="sm"
          >
            <!-- Column: Height -->
            <template #cell(height)="data">
              <router-link
                :to="`/${chain.title}/blocks/${data.item.block.header.height}`"
              >
                {{ data.item.block.header.height }}
              </router-link>
            </template>
            <template #cell(hash)="data">
              <small>{{ data.item.block_id.hash }}</small>
            </template>
            <template #cell(time)="data">
              {{ formatTime(data.item.block.header.time) }}
            </template>
            <template #cell(proposer)="data">
              {{ formatProposer(data.item.block.header.proposer_address) }}
            </template>
          </b-table>
        </b-card>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import {
  BRow,
  BCol,
  BAlert,
  BCard,
  BTable,
  BCardHeader,
  BCardTitle
} from 'bootstrap-vue';
import {
  formatNumber,
  formatTokenAmount,
  getUserCurrency,
  getCachedValidators,
  getStakingValidatorByHex,
  isToken,
  percent,
  timeIn,
  toDay,
  toDuration,
  tokenFormatter
} from '@/libs/utils';

import SummaryParmetersComponent from './SummaryParmetersComponent.vue';
import SummaryAssetsComponent from './SummaryAssetsComponent.vue';
import SummaryPriceChart from './SummaryPriceChart.vue';

export default {
  components: {
    BTable,
    BRow,
    BCol,
    BAlert,
    BCard,
    BCardHeader,
    BCardTitle,
    SummaryParmetersComponent,
    SummaryAssetsComponent,
    SummaryPriceChart
  },
  data() {
    return {
      syncing: false,
      latestTime: '',
      marketData: null,
      chain: {
        title: '',
        class: 'customizer-border',
        items: [
          { subtitle: 'height', icon: 'BoxIcon', color: 'light-success' },
          {
            subtitle: 'bonded_and_supply',
            icon: 'DollarSignIcon',
            color: 'light-danger'
          },
          {
            subtitle: 'bonded_ratio',
            icon: 'PercentIcon',
            color: 'light-warning'
          },
          {
            subtitle: 'inflation',
            icon: 'TrendingUpIcon',
            color: 'light-primary'
          }
        ]
      },
      staking: {
        title: 'Staking Parameters',
        items: []
      },
      distribution: {
        title: 'Distribution Parameters',
        items: []
      },
      slashing: {
        title: 'Slashing Parameters',
        items: null
      },
      mint: {
        title: 'Mint Parameters',
        items: null
      },
      gov: {
        title: 'Governance Parameters',
        items: []
      },
      islive: true,
      blocks: [],
      list_fields: [
        {
          key: 'height',
          sortable: true
        },
        {
          key: 'hash',
          thClass: 'd-none d-lg-block',
          tdClass: 'd-none d-lg-block text-truncate'
        },
        {
          key: 'proposer',
          tdClass: 'text-truncate'
        },
        {
          key: 'time',
          thClass: 'd-none d-md-block',
          tdClass: 'd-none d-md-block'
        }
      ]
    };
  },
  computed: {
    marketChartData() {
      if (this.marketData && this.marketData.prices) {
        const labels = this.marketData.prices.map(x => x[0]);
        const data = this.marketData.prices.map(x => x[1]);
        return {
          labels,
          datasets: [
            {
              label: `Price (${getUserCurrency().toUpperCase()})`,
              data,
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
              pointStyle: 'dash',
              barThickness: 15
            }
          ]
        };
      }
      return null;
    }
  },
  created() {
    this.$http.getLatestBlock().then(res => {
      this.blocks.push(res);
      const list = [];
      const { height } = res.block.header;
      for (let i = 1; i < 10; i += 1) {
        list.push(height - i);
      }

      if (!getCachedValidators()) {
        this.$http.getValidatorList();
      }

      let promise = Promise.resolve();
      list.forEach(item => {
        promise = promise.then(
          () =>
            new Promise(resolve => {
              this.$http.getBlockByHeight(item).then(b => {
                resolve();
                this.blocks.push(b);
              });
            })
        );
      });
      this.timer = setInterval(this.fetch, 6000);
    });

    this.$http.getLatestBlock().then(res => {
      const height = this.chain.items.findIndex(x => x.subtitle === 'height');
      this.$set(this.chain, 'title', `${res.block.header.chain_id}`);
      this.$set(this.chain.items[height], 'title', res.block.header.height);
      if (timeIn(res.block.header.time, 3, 'm')) {
        this.syncing = true;
      } else {
        this.syncing = false;
      }
      this.latestTime = toDay(res.block.header.time, 'long');
    });

    this.$http.getMarketChart().then(res => {
      this.marketData = res;
    });

    this.$http.getStakingParameters().then(res => {

      this.staking = this.normalize(res, 'Staking Parameters');
      // Get bond denomination with fallback options
      const bondDenom = res.bond_denom 
      Promise.all([
        this.$http.getStakingPool(),
        this.$http.getBankTotal(bondDenom)
      ]).then(pool => {
     
        const bondedAndSupply = this.chain.items.findIndex(
          x => x.subtitle === 'bonded_and_supply'
        );

        if (bondedAndSupply >= 0 && pool.length >= 2 && pool[0] && pool[1]) {
          const formattedBonded = formatNumber(
            formatTokenAmount(pool[0].element.pool.bonded_tokens, 2, bondDenom, false),
            true,
            0
          );
          const formattedTotal = formatNumber(
            formatTokenAmount(pool[1].amount.amount, 2, bondDenom, false),
            true,
            0
          );
          
          const titleValue = `${formattedBonded}/${formattedTotal}`;

          this.$set(
            this.chain.items[bondedAndSupply],
            'title',
            titleValue
          );
          
          const bondedRatio = this.chain.items.findIndex(
            x => x.subtitle === 'bonded_ratio'
          );
          
          if (bondedRatio >= 0) {
            const ratioValue = `${percent(pool[0].element.pool.bonded_tokens / pool[1].amount.amount)}%`;
        
            this.$set(
              this.chain.items[bondedRatio],
              'title',
              ratioValue
            );
          }
        } else {
          console.error('❌ Invalid pool data or bonded_and_supply item not found:', {
            bondedAndSupply,
            poolLength: pool.length,
            pool0Exists: !!pool[0],
            pool1Exists: !!pool[1]
          });
        }
      }).catch(poolError => {
        console.error('❌ Error fetching pool data:', poolError);
      });
    }).catch(stakingError => {
      console.error('❌ Error fetching staking parameters:', stakingError);
    });
    this.$http.getSlashingParameters().then(res => {
      this.slashing = this.normalize(res, 'Slashing Parameters');
    });

    const conf = this.$http.getSelectedConfig();
    if (conf.excludes && conf.excludes.indexOf('mint') > -1) {
      this.mint = null;
    } else {
      this.$http.getMintingInflation().then(res => {
        const chainIndex = this.chain.items.findIndex(
          x => x.subtitle === 'inflation'
        );
        this.$set(this.chain.items[chainIndex], 'title', `${percent(res)}%`);
      });
      this.$http.getMintParameters().then(res => {
        this.mint = this.normalize(res, 'Minting Parameters');
      });
    }

    this.$http.getDistributionParameters().then(res => {
      this.distribution = this.normalize(res, 'Distribution Parameters');
    });
    if (conf.excludes && conf.excludes.indexOf('governance') > -1) {
      this.gov.items = [];
    } else {
      Promise.all([
        this.$http.getGovernanceParameterDeposit(),
        this.$http.getGovernanceParameterTallying(),
        this.$http.getGovernanceParameterVoting()
      ]).then(data => {
        let items = [];
        data.forEach(item => {
          const values = this.normalize(item, '').items;
          items = items.concat(values);
        });
        this.gov.items = items;
        this.$set(this.gov, 'items', items);
      });
    }
  },
  beforeDestroy() {
    this.islive = false;
    clearInterval(this.timer);
  },
  methods: {
    normalize(data, title) {
      if (!data) return null;
      const items = this.makeItems(data);
      return {
        title,
        items
      };
    },
    makeItems(data) {
      return Object.keys(data).map(k => {
        if (isToken(data[k])) {
          return { title: tokenFormatter(data[k]), subtitle: k };
        }
        if (typeof data[k] === 'boolean') {
          return { title: data[k], subtitle: k };
        }
        const d = Number(data[k]);
        if (d < 1.01) {
          return { title: `${percent(d)}%`, subtitle: k };
        }
        if (d > 1000000000) {
          return { title: `${toDuration(d / 1000000)}`, subtitle: k };
        }
        return { title: data[k], subtitle: k };
      });
    },
    length: v => (Array.isArray(v) ? v.length : 0),
    formatTime: v => toDay(v, 'time'),
    formatProposer(v) {
      return getStakingValidatorByHex(this.$http.config.chain_name, v);
    },
    fetch() {
      this.$http.getLatestBlock().then(b => {
        const has = this.blocks.findIndex(
          x => x.block.header.height === b.block.header.height
        );
        if (has < 0) this.blocks.unshift(b);
        if (this.blocks.length > 10) this.blocks.pop();
      });
    }
  }
};
</script>

<style lang="scss" scoped>
@import '~@core/scss/base/bootstrap-extended/include';
@import '~@core/scss/base/components/variables-dark';

.customizer-border {
  border: 1px solid $info;

  .dark-layout & {
    border: 1px solid $primary;
  }
}
</style>
