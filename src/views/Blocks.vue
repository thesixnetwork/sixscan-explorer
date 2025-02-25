<template>
  <div>
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
          <router-link :to="`./blocks/${data.item.block.header.height}`">
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
        <template #cell(txs)="data">
          {{ length(data.item.block.data.txs) }}
        </template>
      </b-table>
    </b-card>
  </div>
</template>

<script>
import {
  BTable,
  BCard,
  BCardHeader,
  BCardTitle,
  VBTooltip
} from 'bootstrap-vue';
import {
  getCachedValidators,
  getStakingValidatorByHex,
  toDay
} from '@/libs/utils';

export default {
  components: {
    BCard,
    BTable,
    BCardHeader,
    BCardTitle
  },
  directives: {
    'b-tooltip': VBTooltip
  },
  data() {
    return {
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
          key: 'txs'
        },
        {
          key: 'time',
          thClass: 'd-none d-md-block',
          tdClass: 'd-none d-md-block'
        }
      ]
    };
  },
  created() {
    this.$http.getLatestBlock().then(res => {
      this.blocks.push(res);
      const list = [];
      const { height } = res.block.header;
      for (let i = 1; i < 20; i += 1) {
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
  },
  beforeDestroy() {
    this.islive = false;
    clearInterval(this.timer);
  },
  methods: {
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
        if (this.blocks.length > 200) this.blocks.pop();
      });
    }
  }
};
</script>
