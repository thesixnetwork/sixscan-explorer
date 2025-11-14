<template>
  <div>
    <b-card title="Block Id">
      <div v-if="!block.block_id || !block.block_id.hash" class="text-center text-muted py-3">
        <p>Loading block ID...</p>
      </div>
      <div v-else>
          <object-field-component :tablefield="formattedBlockId" />
      </div>
    </b-card>

    <b-card title="Block Header">
      <object-field-component :tablefield="block.block.header" />
    </b-card>

    <b-card title="Transaction">
      <div v-if="!block.block.data.txs || block.block.data.txs.length === 0" class="text-center text-muted py-3">
        <p>No transactions in this block</p>
      </div>
      <b-table 
        v-else
        :items="txs" 
        :fields="fields" 
        responsive="sm"
      >
        <template #cell(hash)="data">
          <router-link :to="`../tx/${data.value}`">
            {{ data.value }}
          </router-link>
        </template>
      </b-table>
    </b-card>

    <b-card title="Evidence">
      <div v-if="!block.block.evidence.evidence || block.block.evidence.evidence.length === 0" class="text-center text-muted py-3">
        <p>No evidence in this block</p>
      </div>
      <array-field-component 
        v-else
        :tablefield="block.block.evidence.evidence" 
      />
    </b-card>

    <b-card title="Last Commit">
      <object-field-component
        :tablefield="block.block.last_commit"
        :small="true"
      />
    </b-card>
  </div>
</template>

<script>
import { BCard, BTable } from 'bootstrap-vue';
import { fromBase64 } from '@cosmjs/encoding';
import { decodeTxRaw } from '@cosmjs/proto-signing';
import Tx from '@/libs/data/tx';
import { abbrMessage, tokenFormatter,base64ToHex,formatValidatorAddress,base64ToBech32Address,getCachedValidators,consensusPubkeyToHexAddress,getStakingValidatorByHex } from '@/libs/utils';
import ObjectFieldComponent from './ObjectFieldComponent.vue';
import ArrayFieldComponent from './ArrayFieldComponent.vue';

export default {
  components: {
    BCard,
    BTable,
    ObjectFieldComponent,
    ArrayFieldComponent
  },
  data() {
    return {
      validators: [],
      block: { 
        block_id: {},
        block: { 
          header: {}, 
          data: {}, 
          evidence: {} 
        } 
      },
      txs: null,
      fields: [
        { key: 'hash' },
        { key: 'fee', formatter: v => tokenFormatter(v) },
        { key: 'messages', formatter: v => abbrMessage(v) },
        { key: 'memo' }
      ]
    };
  },
  computed: {
    formattedBlockId() {
      if (!this.block.block_id || typeof this.block.block_id !== 'object') {
        return {};
      }
      
      // Create a plain object that ObjectFieldComponent can iterate over
      const formatted = {};
      
      // Add hash
      if (this.block.block_id.hash) {
        formatted.hash = this.block.block_id.hash;
      }
      
      // Add parts/part_set_header
      if (this.block.block_id.parts) {
        formatted.parts = this.block.block_id.parts;
      } else if (this.block.block_id.part_set_header) {
        formatted.part_set_header = this.block.block_id.part_set_header;
      }
      
      // Add any other properties that might exist
      Object.keys(this.block.block_id).forEach(key => {
        if (key !== 'hash' && key !== 'parts' && key !== 'part_set_header') {
          formatted[key] = this.block.block_id[key];
        }
      });
      
      return formatted;
    }
  },
  beforeRouteUpdate(to, from, next) {
    const { height } = to.params;
    if (height > 0 && height !== from.params.height) {
      this.initData(height);
      next();
    }
  },
  created() {
    // Load validators first
    const cached = getCachedValidators(this.$route.params.chain || this.$http.config.chain_name);
    if (cached) {
      this.validators = JSON.parse(cached);
    }
    
    this.$http.getValidatorList().then(res => {
      this.validators = res;
    });

    // Then load block data
    const { height } = this.$route.params;
    this.initData(height);
  },
  methods: {
    initData(height) {
      this.$http.getBlockByHeight(height).then(res => {
        
        // Format all hash fields in the block data
        if (res.block && res.block.header) {
          const header = res.block.header;
          
          // Format hashes in last_block_id
          if (header.last_block_id) {
            if (header.last_block_id.hash) {
              header.last_block_id.hash = this.formatHex(header.last_block_id.hash);
            }
            if (header.last_block_id.part_set_header && header.last_block_id.part_set_header.hash) {
              header.last_block_id.part_set_header.hash = this.formatHex(header.last_block_id.part_set_header.hash);
            }
          }
          
          // Format other hash fields
          if (header.last_commit_hash) {
            header.last_commit_hash = this.formatHex(header.last_commit_hash);
          }
          if (header.data_hash) {
            header.data_hash = this.formatHex(header.data_hash);
          }
          if (header.validators_hash) {
            header.validators_hash = this.formatHex(header.validators_hash);
          }
          if (header.next_validators_hash) {
            header.next_validators_hash = this.formatHex(header.next_validators_hash);
          }
          if (header.consensus_hash) {
            header.consensus_hash = this.formatHex(header.consensus_hash);
          }
          if (header.app_hash) {
            header.app_hash = this.formatHex(header.app_hash);
          }
          if (header.last_results_hash) {
            header.last_results_hash = this.formatHex(header.last_results_hash);
          }
          if (header.evidence_hash) {
            header.evidence_hash = this.formatHex(header.evidence_hash);
          }
          if (header.proposer_address) {
            header.proposer_address = this.formatProposer(header.proposer_address);
          }
        }
        
        // Format block_id hash if it exists
        if (res.block_id && res.block_id.hash) {
          res.block_id.hash = this.formatHex(res.block_id.hash);
        }
        // Handle both part_set_header and parts field names
        if (res.block_id && res.block_id.part_set_header && res.block_id.part_set_header.hash) {
          res.block_id.part_set_header.hash = this.formatHex(res.block_id.part_set_header.hash);
        }
        if (res.block_id && res.block_id.parts && res.block_id.parts.hash) {
          res.block_id.parts.hash = this.formatHex(res.block_id.parts.hash);
        }

        this.block = res;
        
        // Format last_commit data
        if (res.block && res.block.last_commit) {
          const lastCommit = res.block.last_commit;
          
          // Format block_id hashes in last_commit
          if (lastCommit.block_id) {
            if (lastCommit.block_id.hash) {
              lastCommit.block_id.hash = this.formatHex(lastCommit.block_id.hash);
            }
            if (lastCommit.block_id.part_set_header && lastCommit.block_id.part_set_header.hash) {
              lastCommit.block_id.part_set_header.hash = this.formatHex(lastCommit.block_id.part_set_header.hash);
            }
          }
          
          // Format signatures array
          if (lastCommit.signatures && Array.isArray(lastCommit.signatures)) {
            lastCommit.signatures = lastCommit.signatures.map(signature => ({
              ...signature,
              validator_address: signature.validator_address ? this.formatProposer(signature.validator_address) : signature.validator_address,
              signature: signature.signature ? this.formatHex(signature.signature) : signature.signature
            }));
          }
        }
        
        this.block = res;
        const { txs } = res.block.data;
        if (txs === null) return;
        const array = [];
        for (let i = 0; i < txs.length; i += 1) {
          let tx = new Tx();
          try {
            const origin = decodeTxRaw(fromBase64(txs[i]));
            tx = Tx.create(origin);
          } catch (e) {
            // catch errors
          }
          tx.setHash(txs[i]);
          array.push(tx);
        }
        if (array.length > 0) this.txs = array;
      });
    },
    formatHex(base64Str) {
      return base64ToHex(base64Str || "");
    },
    formatProposer(base64Address) {
      // Convert base64 proposer address to hex
      const hexAddress = base64ToHex(base64Address);
      
      // Use the existing utility to get validator by hex address
      const validatorMoniker = getStakingValidatorByHex(this.$http.config.chain_name, hexAddress);
      
      return validatorMoniker;
    },
  }
};
</script>
