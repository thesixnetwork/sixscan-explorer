<template>
  <div class="container-md px-0">
    <b-card style="border-radius: 12px;">
      <b-alert variant="danger" :show="syncing">
        <div class="alert-body">
          <span>
            No new blocks have been produced since
            <strong>{{ latestTime }}</strong>
          </span>
        </div>
      </b-alert>
      <b-card no-body class="mb-2">
        <b-button
          size="sm"
          variant="link"
          to="./uptime/my"
          class="mb-1 customizer-button"
          style="border-radius: 12px;"
        >
          Browse favorite only
        </b-button>
        <b-form-input
          v-model="query"
          placeholder="Keywords to filter validators"
        />
      </b-card>
      <b-row>
        <b-col
          v-for="(x, index) in uptime"
          :key="index"
          sm="4"
          md="4"
          class="text-truncate mb-2"
        >
          <b-form-checkbox
            v-model="pinned"
            :value="`${chain}#${x.address}`"
            class="custom-control-info mb-1"
            @change="pinValidator(`${chain}#${x.address}`)"
          >
            <span
              class="d-inline-block text-truncate font-weight-bold align-bottom"
            >
              {{ index + 1 }}. {{ x.validator.moniker }}
            </span>
          </b-form-checkbox>
          <div
            class="d-flex justify-content-between align-self-stretch flex-wrap"
          >
            <div v-for="(b, i) in blocks" :key="i" style="width:1.5%;">
              <router-link :to="`./blocks/${b.height}`">
                <div
                  v-b-tooltip.hover.v-second
                  :title="b.height"
                  :class="
                    b.sigs && b.sigs[x.address]
                      ? b.sigs[x.address]
                      : 'bg-light-success'
                  "
                  class="m-auto"
                >
                  &nbsp;
                </div>
              </router-link>
            </div>
          </div>
        </b-col>
      </b-row>
    </b-card>
  </div>
</template>

<script>
import {
  BRow,
  BCol,
  VBTooltip,
  BFormInput,
  BCard,
  BAlert,
  BFormCheckbox,
  BButton
} from 'bootstrap-vue';

import {
  consensusPubkeyToHexAddress,
  getCachedValidators,
  timeIn,
  toDay
} from '@/libs/utils';

export default {
  components: {
    BRow,
    BCol,
    BFormInput,
    BCard,
    BAlert,
    BButton,
    BFormCheckbox
  },
  directives: {
    'b-tooltip': VBTooltip
  },
  data() {
    const { chain } = this.$route.params;
    const pinned = localStorage.getItem('pinned')
      ? localStorage.getItem('pinned').split(',')
      : '';
    return {
      pinned,
      chain,
      query: '',
      validators: [],
      missing: {},
      blocks: Array.from('0'.repeat(50)).map(x => ({
        sigs: {},
        height: Number(x)
      })),
      syncing: false,
      latestTime: ''
    };
  },
  computed: {
    uptime() {
      const vals = this.query
        ? this.validators.filter(
            x => String(x.description.moniker).indexOf(this.query) > -1
          )
        : this.validators;
      vals.sort((a, b) => b.delegator_shares - a.delegator_shares);
      return vals.map(x => ({
        validator: x.description,
        address: consensusPubkeyToHexAddress(x.consensus_pubkey)
      }));
    }
  },
  created() {
    const cached = JSON.parse(getCachedValidators(this.$route.params.chain));

    if (cached) {
      this.validators = cached;
    }
    this.$http.getValidatorList().then(res => {
      this.validators = res;
    });
    this.initBlocks();
  },
  beforeDestroy() {
    this.blocks = []; // clear running tasks if it is not finish
    this.syncing = false;
    clearInterval(this.timer);
  },
  methods: {
    pinValidator() {
      localStorage.setItem('pinned', this.pinned);
    },
    initBlocks() {
      this.$http.getLatestBlock().then(d => {
        const { height } = d.block.last_commit;
        if (timeIn(d.block.header.time, 3, 'm')) {
          this.syncing = true;
        } else {
          this.syncing = false;
        }
        this.latestTime = toDay(d.block.header.time, 'long');
        const blocks = [];
        // update height
        let promise = Promise.resolve();
        for (let i = height - 1; i > height - 50; i -= 1) {
          blocks.unshift({ sigs: {}, height: i > 0 ? i : 0 });
          if (i > height - 48 && i > 0) {
            promise = promise.then(
              () =>
                new Promise(resolve => {
                  this.fetch_status(i, resolve);
                })
            );
          }
        }

        const sigs = this.initColor();
        d.block.last_commit.signatures.forEach(x => {
          if (x.validator_address) sigs[x.validator_address] = 'bg-success';
        });
        blocks.push({ sigs, height });
        this.blocks = blocks;

        this.timer = setInterval(this.fetch_latest, 6000);
      });
    },
    initColor() {
      const sigs = {};
      this.validators.forEach(x => {
        sigs[consensusPubkeyToHexAddress(x.consensus_pubkey)] = 'bg-danger';
      });
      return sigs;
    },
    fetch_status(height, resolve) {
      const block = this.blocks.find(b => b.height === height);
      if (block) {
        this.$http.getBlockByHeight(height).then(res => {
          resolve();
          const sigs = this.initColor();
          res.block.last_commit.signatures.forEach(x => {
            if (x.validator_address) sigs[x.validator_address] = 'bg-success';
          });
          this.$set(block, 'sigs', sigs);
        });
      }
    },
    fetch_latest() {
      this.$http.getLatestBlock().then(res => {
        const sigs = this.initColor();
        res.block.last_commit.signatures.forEach(x => {
          if (x.validator_address) sigs[x.validator_address] = 'bg-success';
        });
        const block = this.blocks.find(
          b => b[1] === res.block.last_commit.height
        );
        if (typeof block === 'undefined') {
          // mei
          // this.$set(block, 0, typeof sigs !== 'undefined')
          if (this.blocks.length >= 50) this.blocks.shift();
          this.blocks.push({ sigs, height: res.block.last_commit.height });
        }
      });
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

  .dark-layout & {
    background-color: $primary;
    color: #fff;
  }
}
</style>
