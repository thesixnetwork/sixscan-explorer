<template>
  <b-card v-if="assets">
    <b-card-title>
      Assets
    </b-card-title>
    <b-table :items="assets" :fields="cfield" hover striped sticky-header="true" responsive="xs" />
  </b-card>
</template>

<script>
import { sha256 } from '@cosmjs/crypto';
import { toHex } from '@cosmjs/encoding';
import { BTable, BCardTitle, BCard } from 'bootstrap-vue';
import {
  formatTokenAmount,
  formatTokenDenom,
  tokenFormatter
} from '@/libs/utils';

export default {
  components: {
    BCard,
    BTable,
    BCardTitle
  },
  data() {
    return {
      islive: true,
      assets: [],
      denoms: {},
      cfield: [
        {
          key: 'denom',
          formatter: this.formatDenom,
          tdClass: 'text-nowrap text-truncate overflow-hidden'
        },
        {
          key: 'abbr',
          label: 'amount'
        }
      ]
    };
  },
  created() {
    this.$http.getAllIBCDenoms().then(x => {
      x.denom_traces.forEach(trace => {
        const hash = toHex(
          sha256(new TextEncoder().encode(`${trace.path}/${trace.base_denom}`))
        );
        this.$set(this.denoms, `ibc/${hash.toUpperCase()}`, trace);
      });
    });
    this.$http.getBankTotals().then(res => {
      const toshow = res.sort();
      // const toshow = res.sort().filter(res => res.denom === "usix");
      this.assets = toshow.reverse().map(x => {
        const xh = x;
        xh.abbr = xh.denom === 'usix' ? formatTokenAmount(x.amount, 0, x.denom) : Number(x.amount) / 10 ** 18;
        xh.denom = xh.denom === 'usix' ? 'six' : xh.denom === 'asix' ? "six (evm)" : xh.denom;
        return xh;
      });
    });
  },
  beforeDestroy() {
    this.islive = false;
  },
  methods: {
    formatDenom(v) {
      if (this.denoms[v]) {
        const trace = this.denoms[v];
        return `* ${formatTokenDenom(trace.base_denom)} (${trace.path})`;
      }
      return v;
    }
  }
};
</script>

<style></style>
