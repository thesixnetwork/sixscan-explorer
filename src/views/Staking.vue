<template>
  <div>
    <b-card
      v-if="sixVals && sixVals.length > 0"
      title="SIX Network"
      class="overflow-auto"
    >
      <b-table
        :items="sixVals"
        :fields="validator_fields"
        :sort-desc="true"
        sort-by="description"
        striped
        hover
        responsive="sm"
      >
        <!-- A virtual column -->
        <template #cell(index)="data">
          <span>{{ data.index + 1 }}</span>
        </template>
        <!-- Column: Validator -->
        <template #cell(description)="data">
          <b-media
            vertical-align="center"
            class="text-truncate d-flex align-items-center"
            style="max-width:320px;"
          >
            <template #aside>
              <b-avatar
                v-if="
                  data.item.description.details &&
                    avatarUrl(data.item.description.details)
                "
                size="32"
                variant="light-primary"
                :style="{ border: '.5px solid rgba(198,198,198,0.5)' }"
                :src="avatarUrl(data.item.description.details)"
              />

              <b-avatar v-else size="32" variant="light-secondary">
                <feather-icon icon="UserIcon" size="18" />
              </b-avatar>
            </template>
            <span class="font-weight-bolder d-block text-nowrap text-uppercase">
              <router-link :to="`./validators/${data.item.operator_address}`">
                {{ data.item.description.moniker }}
              </router-link>
            </span>
            <small class="text-muted">
              {{
                data.item.description.website || data.item.description.identity
              }}
            </small>
          </b-media>
        </template>
        <!-- Token -->
        <template #cell(tokens)="data">
          <div
            v-if="data.item.tokens > 0"
            class="d-flex flex-column"
            style="max-width:320px;"
          >
            <span class="font-weight-bold mb-0">
              {{
                tokenFormatter(data.item.tokens, stakingParameters.bond_denom)
              }}
            </span>
            <span class="font-small-2 text-muted text-nowrap d-none d-lg-block">
              {{ stakingPool > 0 ? percent(data.item.tokens / stakingPool) + '%' : '-' }}
            </span>
          </div>
          <span v-else>{{ data.item.delegator_shares }}</span>
        </template>
        <!-- Token -->
        <template #cell(changes)="data">
          <small v-if="data.item.changes > 0" class="text-success">
            +{{ data.item.changes }}
          </small>
          <small v-else-if="data.item.changes === 0">-</small>
          <small v-else class="text-danger">{{ data.item.changes }}</small>
        </template>
      </b-table>
    </b-card>
    <b-card no-body class="overflow-auto">
      <b-card-header class="d-flex justify-content-between">
        <b-form-group class="mb-0">
          <b-form-radio-group
            id="btn-radios-1"
            v-model="selectedStatus"
            button-variant="outline-primary"
            :options="statusOptions"
            buttons
            name="radios-btn-default"
            @change="getValidatorListByStatus"
          />
        </b-form-group>
        <b-card-title class="d-none d-sm-block">
          <span>
            Validators: {{ validators.length }}/{{
              stakingParameters.max_validators
            }}
          </span>
        </b-card-title>
      </b-card-header>
      <b-card-body class="pl-0 pr-0 pb-0">
        <b-table
          class="mb-0"
          :items="list"
          :fields="validator_fields"
          :sort-desc="true"
          sort-by="tokens"
          striped
          hover
          responsive="sm"
          :style="{ fontSize: 'small' }"
        >
          <!-- A virtual column -->
          <template #cell(index)="data">
            <b-badge :variant="rankBadge(data)">
              <span>{{ data.index + 1 }}</span>
            </b-badge>
          </template>
          <!-- Column: Validator -->
          <template #cell(description)="data">
            <b-media
              vertical-align="center"
              class="text-truncate d-flex align-items-center"
              style="max-width:320px;"
            >
              <template #aside>
                <b-avatar
                  v-if="
                    data.item.description.details &&
                      avatarUrl(data.item.description.details)
                  "
                  size="32"
                  variant="light-primary"
                  :style="{ border: '.5px solid rgba(198,198,198,0.5)' }"
                  :src="avatarUrl(data.item.description.details)"
                />
                <b-avatar v-else size="32" variant="light-secondary">
                  <feather-icon icon="UserIcon" size="18" />
                </b-avatar>
              </template>
              <span
                class="font-weight-bolder d-block text-nowrap text-uppercase"
              >
                <router-link :to="`./validators/${data.item.operator_address}`">
                  {{ data.item.description.moniker }}
                </router-link>
              </span>
              <small class="text-muted">
                {{
                  data.item.description.website ||
                    data.item.description.identity
                }}
              </small>
            </b-media>
          </template>
          <!-- Token -->
          <template #cell(tokens)="data">
            <div v-if="data.item.tokens > 0" class="d-flex flex-column">
              <span class="font-weight-bold mb-0">
                {{
                  tokenFormatter(data.item.tokens, stakingParameters.bond_denom)
                }}
              </span>
              <span
                class="font-small-2 text-muted text-nowrap d-none d-lg-block"
              >
                {{ stakingPool > 0 ? percent(data.item.tokens / stakingPool) + '%' : '-' }}
              </span>
            </div>
            <span v-else>{{ data.item.delegator_shares }}</span>
          </template>
          <!-- Changes -->
          <template #cell(changes)="data">
            <small v-if="data.item.changes > 0" class="text-success">
              +{{ data.item.changes }}
            </small>
            <small v-else-if="data.item.changes === 0">-</small>
            <small v-else class="text-danger">{{ data.item.changes }}</small>
          </template>
        </b-table>
      </b-card-body>
      <b-card-footer class="d-none d-md-block">
        <small>
          <b-badge variant="danger">
            &nbsp;
          </b-badge>
          Top 33%
          <b-badge variant="warning">
            &nbsp;
          </b-badge>
          Top 67% of Voting Power
        </small>
      </b-card-footer>
    </b-card>
    <operation-modal type="Delegate" :validator-address="validator_address" />
    <div id="txevent" />
  </div>
</template>

<script>
import {
  BTable,
  BMedia,
  BAvatar,
  BBadge,
  BCard,
  BCardHeader,
  BCardTitle,
  VBTooltip,
  BCardBody,
  BCardFooter,
  BFormRadioGroup,
  BFormGroup
} from 'bootstrap-vue';
import { percent, StakingParameters, formatToken } from '@/libs/utils';
import { keybase } from '@/libs/fetch';
import OperationModal from '@/views/components/OperationModal/index.vue';

export default {
  components: {
    BCard,
    BTable,
    BMedia,
    BAvatar,
    BBadge,
    BCardHeader,
    BCardTitle,
    BCardBody,
    BCardFooter,
    BFormRadioGroup,
    BFormGroup,
    OperationModal
  },
  directives: {
    'b-tooltip': VBTooltip
  },
  data() {
    return {
      islive: true,
      validator_address: null,
      mintInflation: 0,
      stakingPool: 1,
      stakingParameters: new StakingParameters(),
      validators: [],
      latestPower: {},
      previousPower: {},
      validator_fields: [
        {
          key: 'index',
          label: '#',
          tdClass: 'd-none d-md-block',
          thClass: 'd-none d-md-block'
        },
        { key: 'description', label: 'Validator', sortByFormatted: true },
        {
          key: 'tokens',
          label: 'Voting Power',
          sortable: true,
          tdClass: 'text-right',
          thClass: 'text-right',
          sortByFormatted: true
        },
        {
          key: 'changes',
          label: '24H Changes'
        },
        {
          key: 'commission',
          formatter: value => {
            return `${percent(value?.commission_rates?.rate || value?.rate ||0)}%`;
          },
          tdClass: 'text-right',
          thClass: 'text-right'
        },
        {
          key: 'operation',
          label: '',
          tdClass: 'text-right',
          thClass: 'text-right'
        }
      ],
      statusOptions: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' }
      ],
      selectedStatus: 'active',
      isInactiveLoaded: false,
      inactiveValidators: []
    };
  },

  computed: {
    sixVals() {
      const filtered = this.list.filter(
        x =>
          x.description.moniker === 'SIX Network' ||
          x.description.moniker === 'SIX Delegator Early Bird'
      );
      return filtered;
    },

    list() {
      let tab =
        this.selectedStatus === 'active'
          ? this.validators
          : this.inactiveValidators;
      
      // Filter out unbonded validators from active list
      if (this.selectedStatus === 'active') {
        tab = tab.filter(x => x.status !== 'BOND_STATUS_UNBONDED');
      }
      
      const result = tab.map(x => {
        const xh = x;
        if (
          Object.keys(this.latestPower).length > 0 &&
          Object.keys(this.previousPower).length > 0
        ) {
          // Try different possible key paths to match against power data
          const consensusKey = x.consensus_pubkey?.key || x.consensus_pubkey?.value || x.pub_key?.key;
          const latest = this.latestPower[consensusKey] || 0;
          const previous = this.previousPower[consensusKey] || 0;
          xh.changes = latest - previous;
        } else {
          xh.changes = 0;
        }
        return xh;
      });
      
      return result;
    }
  },
  created() {
    this.$http.getStakingPool().then(pool => {
      // Fix: Extract bonded tokens from the correct path
      if (pool.element && pool.element.pool && pool.element.pool.bonded_tokens) {
        this.stakingPool = Number(pool.element.pool.bonded_tokens);
      } else if (pool.bonded_tokens) {
        this.stakingPool = Number(pool.bonded_tokens);
      } else if (pool.bondedToken) {
        this.stakingPool = Number(pool.bondedToken);
      } else {
        // Fallback: calculate total from validators if available
        this.stakingPool = 1; // Prevent division by zero
        console.warn("⚠️ Could not find bonded tokens in staking pool, using fallback");
      }
    }).catch(error => {
      console.error("❌ Error loading staking pool:", error);
      this.stakingPool = 1; // Prevent division by zero
    });
    // set
    this.$http.getStakingParameters().then(res => {
      this.stakingParameters = res;
    }).catch(error => {
      console.error("❌ Error loading staking parameters:", error);
    });
    this.initial();
  },
  beforeDestroy() {
    this.islive = false;
  },
  mounted() {
    const elem = document.getElementById('txevent');
    elem.addEventListener('txcompleted', () => {
      this.initial();
    });
  },
  methods: {
    initial() {      

      this.$http.getValidatorList().then(res => {
        const identities = [];
        const temp = res;
        for (let i = 0; i < temp.length; i += 1) {
          const { identity } = temp[i].description;
          const url = this.$store.getters['chains/getAvatarById'](identity);
          if (url) {
            temp[i].avatar = url;
          } else if (identity && identity !== '') {
            identities.push(identity);
          }
        }

        // fetch avatar from keybase
        let promise = Promise.resolve();
        identities.forEach(item => {
          promise = promise.then(
            () =>
              new Promise(resolve => {
                this.avatar(item, resolve);
              })
          );
        });
        this.validators = temp;
        this.getPreviousPower(this.validators.length);
      }).catch(error => {
        console.error("❌ Error loading validator list:", error);
        const fallbackUrl = `${this.$http.config.api}/cosmos/staking/v1beta1/validators`;
        fetch(fallbackUrl)
          .then(response => response.json())
          .then(data => {
            if (data.validators && data.validators.length > 0) {
              // Use raw validator data, just add a few computed fields that the UI expects
              const processedValidators = data.validators.map(val => {
                // Convert tokens to number and add any missing fields
                return {
                  ...val,
                  tokens: Number(val.tokens),
                  delegator_shares: Number(val.delegator_shares),
                  // Add changes field (will be filled by getPreviousPower)
                  changes: 0
                };
              });
              
              this.validators = processedValidators;
              
              // Calculate total staking pool if not set correctly
              if (this.stakingPool <= 1) {
                const totalBonded = processedValidators
                  .filter(v => v.status === 'BOND_STATUS_BONDED')
                  .reduce((sum, v) => sum + Number(v.tokens), 0);
                if (totalBonded > 0) {
                  this.stakingPool = totalBonded;
                }
              }
              
              // Save to localStorage as expected by other parts of the app
              localStorage.setItem(
                `validators-${this.$http.config.chain_name}`,
                JSON.stringify(processedValidators)
              );
              
              this.getPreviousPower(this.validators.length);
            }
          })
          .catch(fallbackError => {
            console.error("❌ Fallback also failed:", fallbackError);
          });
      });
    },
    getPreviousPower(length) {      
      // Try to get validator set data for power calculations
      this.$http.getValidatorListByHeight('latest', 0).then(data => {        
        if (data && data.validators) {
          // Process latest validator set data
          data.validators.forEach((x, index) => {
            // Use the pub_key.key from validator set
            const key = x.pub_key?.key;
            if (key) {
              this.$set(this.latestPower, key, Number(x.voting_power || 0));
            }
          });

          // Get previous block height (24h ago = ~14400 blocks)
          let height = Number(data.block_height);
          if (height > 14400) {
            height -= 14400;
          } else {
            height = 1;
          }

          // Get previous validator set data
          this.$http.getValidatorListByHeight(height, 0).then(previous => {            
            if (previous && previous.validators) {
              previous.validators.forEach((x, index) => {
                const key = x.pub_key?.key;
                if (key) {
                  this.$set(this.previousPower, key, Number(x.voting_power || 0));
                }
              });

              // Now compare staking validators with power data
              this.debugValidatorKeyMatching();
            }
          }).catch(prevError => {
            console.error("❌ Error getting previous validator set:", prevError);
            // Set all changes to 0 as fallback
            this.validators.forEach(v => {
              v.changes = 0;
            });
          });
        }
      }).catch(error => {
        console.error("❌ Error getting latest validator set:", error);
        // Set all changes to 0 as fallback
        this.validators.forEach(v => {
          v.changes = 0;
        });
      });
    },
    
    getValidatorListByStatus() {
      if (this.isInactiveLoaded) return;
      const statusList = ['BOND_STATUS_UNBONDED', 'BOND_STATUS_UNBONDING'];
      statusList.forEach(status => {
        this.$http.getValidatorListByStatus(status).then(res => {
          const identities = [];
          const temp = res;
          for (let i = 0; i < temp.length; i += 1) {
            const { identity } = temp[i].description;
            const url = this.$store.getters['chains/getAvatarById'](identity);
            if (url) {
              temp[i].avatar = url;
            } else if (identity && identity !== '') {
              identities.push(identity);
            }
          }

          // fetch avatar from keybase
          let promise = Promise.resolve();
          identities.forEach(item => {
            promise = promise.then(
              () =>
                new Promise(resolve => {
                  this.avatar(item, resolve);
                })
            );
          });
          this.inactiveValidators = this.inactiveValidators.concat(res);
        });
      });
      this.isInactiveLoaded = true;
    },
    selectValidator(da) {
      this.validator_address = da;
    },
    percent,
    tokenFormatter(amount, denom) {
      return formatToken({ amount, denom }, {}, 0);
    },
    rankBadge(data) {
      if (this.selectedStatus === 'inactive') return 'primary';
      const { index, item } = data;
      if (index < 3) return 'success';
      if (index < 10) return 'info';
      if (index < 30) return 'warning';
      return 'secondary';
    },
    debugValidatorKeyMatching() {
      // Force Vue reactivity update
      this.$forceUpdate();
    },
    
    avatar(identity, resolve) {
      keybase(identity).then(d => {
        if (Array.isArray(d.them) && d.them.length > 0) {
          this.$store.commit('chains/cacheAvatar', {
            identity,
            url: d.them[0].pictures.primary.url
          });
        }
        resolve();
      }).catch(() => {
        resolve(); // Always resolve to prevent hanging promises
      });
    },
    
    avatarUrl(details) {
      if (!details) return null;
      
      // Check if details contains image reference
      const parts = details.split('|');
      for (const part of parts) {
        if (part.includes('im=')) {
          const im = part.split('=')[1];
          if (im) {
            if (im.startsWith('n:')) {
              const id = im.slice(2);
              return `https://files.catbox.moe/${id}.png`;
            }
            return `https://i.imgur.com/${im}.png`;
          }
        }
      }
      return null;
    }
  }
};
</script>
